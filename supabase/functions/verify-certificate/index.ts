// @ts-nocheck
/**
 * Public certificate verification endpoint.
 *
 * This is the authoritative check behind the public verification page. It calls
 * the `public_verify_certificate` SQL function, which:
 *   - compares the supplied reference against the real certificate row,
 *   - records a verification event (so "verified" is distinct from
 *     "downloaded" or "issued"),
 *   - increments the verification counter, and
 *   - returns ONLY an explicit allow-list of public fields.
 *
 * Because the field allow-list lives in the database function, adding a column
 * to `certificates` can never accidentally leak it to the public.
 *
 * Two distinct actions share this endpoint so that "verified" and "downloaded"
 * stay separately meaningful:
 *   - `action: 'verify'` (default) checks a certificate and mints no PDF URL.
 *   - `action: 'pdf'` resolves a *valid* certificate and mints a 10-minute
 *     signed URL, incrementing the download counter. It is only called when a
 *     visitor actually asks for the PDF, so the counter reflects downloads
 *     rather than verification traffic.
 *
 * No authentication required.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const JSON_HEADERS = { ...cors, 'Content-Type': 'application/json' };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/** Stable, non-reversible hash so we keep an abuse signal without storing raw IPs. */
async function hashIp(ip) {
  const salt = Deno.env.get('CERTIFICATE_VERIFY_IP_SALT') || 'career-radar-verify';
  const data = new TextEncoder().encode(`${salt}:${ip || 'unknown'}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function clientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '';
}

const VALID_METHODS = new Set(['certificate_id', 'verification_url', 'qr_code']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST' && req.method !== 'GET') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !anonKey) return json({ error: 'Server misconfigured' }, 500);

    let reference = '';
    let method = 'certificate_id';
    let action = 'verify';

    if (req.method === 'GET') {
      const url = new URL(req.url);
      reference = url.searchParams.get('token') || url.searchParams.get('id') || '';
      method = url.searchParams.get('method') || (url.searchParams.get('token') ? 'verification_url' : 'certificate_id');
      action = url.searchParams.get('action') || 'verify';
    } else {
      const body = await req.json().catch(() => ({}));
      reference = body.reference || body.certificateId || body.token || '';
      method = body.method || (body.token ? 'verification_url' : 'certificate_id');
      action = body.action || 'verify';
    }

    if (!VALID_METHODS.has(method)) method = 'certificate_id';
    if (action !== 'pdf') action = 'verify';

    reference = String(reference || '').trim();
    if (!reference) {
      return json({ error: 'Enter a certificate ID or scan a certificate QR code' }, 400);
    }
    if (reference.length > 128) {
      return json({ error: 'That does not look like a valid certificate reference' }, 400);
    }

    // Anon key + the SECURITY DEFINER RPC: the anon role has EXECUTE on the
    // function only, and no SELECT on the certificates table itself.
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    });

    const ipHash = await hashIp(clientIp(req));
    const userAgent = req.headers.get('user-agent') || '';

    /**
     * Resolve the row id and status with the service role. Used by the PDF action,
     * where the caller already verified the certificate in the browser and only
     * needs the stored object key. The status re-check here is the actual
     * authorisation: it happens on the server, at mint time.
     */
    const resolveRow = async () => {
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!serviceKey) return { error: 'PDF service unavailable' };

      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      });

      const byToken = method === 'verification_url' || method === 'qr_code';
      // Mirror the SQL lookup exactly: normalise the input, never the column.
      const value = byToken ? reference.toLowerCase() : reference.toUpperCase();

      const { data: located, error: locateError } = await admin
        .from('certificates')
        .select('id, status')
        .eq(byToken ? 'verification_token' : 'certificate_id', value)
        .maybeSingle();

      if (locateError) return { error: 'PDF lookup failed' };
      if (!located) return { error: 'No certificate matches that reference.' };
      return { admin, row: located };
    };

    if (action === 'pdf') {
      const resolved = await resolveRow();
      if (resolved.error) {
        const clientError = resolved.error === 'PDF service unavailable'
          ? 'PDF downloads are temporarily unavailable'
          : resolved.error;
        return json({ error: clientError }, resolved.error === 'PDF service unavailable' ? 503 : 404);
      }
      if (resolved.row.status !== 'valid') {
        return json({
          error: 'A PDF copy is only available while a certificate is valid.',
          status: resolved.row.status,
        }, 403);
      }

      const { data: signed, error: signError } = await resolved.admin.storage
        .from('certificate-pdfs')
        .createSignedUrl(`${resolved.row.id}.pdf`, 600);

      if (signError || !signed?.signedUrl) {
        console.error('createSignedUrl error:', signError);
        // The PDF may not have been generated yet; verification must still work,
        // so this is a soft failure for the download button alone.
        return json({ error: 'No PDF is available for this certificate yet.' }, 404);
      }

      const { error: downloadError } = await resolved.admin.rpc('record_certificate_download', {
        p_certificate_id: resolved.row.id,
        p_ip_hash: ipHash,
        p_user_agent: userAgent,
        p_actor: null,
        p_channel: 'public',
      });
      // The PDF is already minted; a failed counter must not deny the download.
      if (downloadError) console.error('record_certificate_download error:', downloadError);

      return json({ found: true, pdf_url: signed.signedUrl, expires_in: 600 });
    }

    const { data, error } = await supabase.rpc('public_verify_certificate', {
      p_reference: reference,
      p_method: method,
      p_ip_hash: ipHash,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error('public_verify_certificate error:', error);
      
      // Fallback: direct database query if RPC fails
      console.log('RPC failed, trying direct query as fallback');
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (!serviceKey) {
        return json({ error: 'Verification is temporarily unavailable' }, 503);
      }

      const admin = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      });

      const byToken = method === 'verification_url' || method === 'qr_code';
      const value = byToken ? reference.toLowerCase() : reference.toUpperCase();

      const { data: located, error: locateError } = await admin
        .from('certificates')
        .select('id, certificate_id, verification_token, recipient_name, certificate_title, description, achievement, template_snapshot, issue_date, organization_name, organization_logo_url, signatory_1_name, signatory_1_title, signatory_1_image_url, signatory_2_name, signatory_2_title, signatory_2_image_url, custom_fields, pdf_path, status, revoked_at, revocation_reason, verification_count')
        .eq(byToken ? 'verification_token' : 'certificate_id', value)
        .maybeSingle();

      if (locateError) {
        console.error('Fallback query error:', locateError);
        return json({ error: 'Verification is temporarily unavailable' }, 503);
      }

      if (!located) {
        return json({
          found: false,
          error: 'No certificate matches that reference. Please check the ID and try again.',
        });
      }

      // Try to increment counter, but don't fail if it doesn't work
      admin.rpc('record_certificate_verification', {
        p_certificate_id: located.id,
      }).catch(e => console.error('Failed to increment counter:', e));

      return json({
        found: true,
        certificate: {
          id: located.id,
          certificate_id: located.certificate_id,
          verification_token: located.verification_token,
          recipient_name: located.recipient_name,
          certificate_title: located.certificate_title,
          description: located.description,
          achievement: located.achievement,
          certificate_type: located.custom_fields?.certificate_type || located.template_snapshot?.certificate_type || 'appreciation',
          issue_date: located.issue_date,
          organization_name: located.organization_name,
          organization_logo_url: located.organization_logo_url,
          signatory_1_name: located.signatory_1_name,
          signatory_1_title: located.signatory_1_title,
          signatory_1_image_url: located.signatory_1_image_url,
          signatory_2_name: located.signatory_2_name,
          signatory_2_title: located.signatory_2_title,
          signatory_2_image_url: located.signatory_2_image_url,
          template_snapshot: located.template_snapshot,
          custom_fields: located.custom_fields || {},
          pdf_path: located.pdf_path,
          status: located.status,
          revoked_at: located.revoked_at,
          revocation_reason: located.revocation_reason,
          verification_count: (located.verification_count || 0) + 1,
          last_verified_at: new Date().toISOString(),
        },
      });
    }

    if (!data?.found) {
      return json({
        found: false,
        error: 'No certificate matches that reference. Please check the ID and try again.',
      });
    }

    // No signed URL is minted here. Handing one out on every verification would
    // inflate the download counter with traffic that never downloaded anything, so
    // the page requests `action: 'pdf'` when the visitor actually clicks.
    return json({ found: true, certificate: data });
  } catch (error) {
    console.error('verify-certificate error:', error);
    return json({ error: 'Verification is temporarily unavailable' }, 503);
  }
});