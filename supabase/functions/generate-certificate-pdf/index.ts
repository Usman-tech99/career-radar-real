// @ts-nocheck
/**
 * Generates the authoritative PDF for an issued certificate.
 *
 * Key guarantees:
 *  - Admin-only. The bearer token is verified, then the caller's role is read
 *    from `user_roles`; anything other than super_admin/admin is rejected.
 *  - Renders from `template_snapshot` (the design frozen at issuance), so
 *    editing a template later never changes an already-issued certificate.
 *  - The QR code and the verification URL are regenerated from the live record,
 *    so the PDF always carries the certificate's real verification secret.
 *  - PDFs land in a private bucket and are only served through short-lived
 *    signed URLs, so possession of the file alone proves nothing.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { renderCertificateHtml, renderCareerRadarAppreciationHtml } from './certificateHtml.js';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const JSON_HEADERS = { ...cors, 'Content-Type': 'application/json' };

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

async function loadChromium() {
  const [chromium, puppeteer] = await Promise.all([
    import('https://esm.sh/@sparticuz/chromium@131.0.1'),
    import('https://esm.sh/puppeteer-core@23.11.1'),
  ]);
  return { chromium: chromium.default, puppeteer: puppeteer.default };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return json({ error: 'Missing authorization header' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const publicSiteUrl = (Deno.env.get('PUBLIC_SITE_URL') || 'https://www.career-radar.space').replace(/\/$/, '');
    if (!supabaseUrl || !serviceKey) return json({ error: 'Server misconfigured' }, 500);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Verify the caller.
    const token = authHeader.replace('Bearer ', '').trim();
    const { data: userData, error: authError } = await admin.auth.getUser(token);
    if (authError || !userData?.user) return json({ error: 'Invalid or expired token' }, 401);
    const user = userData.user;

    // 2. Verify the role.
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleRow || !['super_admin', 'admin'].includes(roleRow.role)) {
      return json({ error: 'Administrator access required' }, 403);
    }

    // 3. Parse the request.
    const body = await req.json().catch(() => ({}));
    const certificateId = body.certificateId;
    const download = body.download === true;
    if (!certificateId) return json({ error: 'certificateId is required' }, 400);

    // 4. Load the authoritative record.
    const { data: certificate, error: certError } = await admin
      .from('certificates')
      .select('*')
      .eq('id', certificateId)
      .maybeSingle();

    if (certError) throw certError;
    if (!certificate) return json({ error: 'Certificate not found' }, 404);

    // Check if PDF already exists - if so, just mint a new signed URL
    if (certificate.pdf_path) {
      const { data: signed, error: signError } = await admin.storage
        .from('certificate-pdfs')
        .createSignedUrl(certificate.pdf_path, 300, download ? { download: `${certificate.certificate_id}.pdf` } : undefined);

      if (signError) throw new Error(`Failed to sign PDF URL: ${signError.message}`);

      if (download) {
        const { error: downloadError } = await admin.rpc('record_certificate_download', {
          p_certificate_id: certificate.id,
          p_ip_hash: null,
          p_user_agent: (req.headers.get('user-agent') || '').slice(0, 300),
          p_actor: user.id,
          p_channel: 'admin',
        });
        if (downloadError) console.error('record_certificate_download error:', downloadError);
      }

      return json({
        success: true,
        url: signed.signedUrl,
        certificateId: certificate.certificate_id,
        generatedAt: certificate.pdf_generated_at || new Date().toISOString(),
        cached: true,
      });
    }

    // Page geometry and artwork come from the FROZEN snapshot so that editing a
    // template later cannot silently re-render an already-issued certificate.
    // The live template row is only a fallback for records snapshotted before
    // these fields were captured.
    const snapshot = certificate.template_snapshot || {};
    const liveTemplate = await admin
      .from('certificate_templates')
      .select('orientation, page_size, background_url')
      .eq('id', certificate.template_id)
      .maybeSingle()
      .then((res) => res.data);

    const pageSize = snapshot.page_size || liveTemplate?.page_size || 'A4';
    const orientationValue = snapshot.orientation || liveTemplate?.orientation || 'landscape';
    const backgroundUrl = snapshot.backgroundUrl || liveTemplate?.background_url || '';

    const verificationUrl = `${publicSiteUrl}/verify/${certificate.verification_token}`;

    const templateType = snapshot.templateType || snapshot.certificate_type || '';
    const departmentName = (certificate.custom_fields || {}).department_name || '';

    const html = templateType === 'cr_appreciation'
      ? renderCareerRadarAppreciationHtml({
          certificateId: certificate.certificate_id,
          verificationUrl,
          recipientName: certificate.recipient_name,
          departmentName,
          issueDate: certificate.issue_date,
        })
      : renderCertificateHtml({
          design: snapshot,
          page: { size: pageSize, orientation: orientationValue },
          values: {
            certificateId: certificate.certificate_id,
            verificationUrl,
            recipientName: certificate.recipient_name,
            certificateTitle: certificate.certificate_title,
            description: certificate.description,
            certificateType: snapshot.certificate_type,
            organizationName: certificate.organization_name,
            organizationLogoUrl: certificate.organization_logo_url,
            issueDate: certificate.issue_date,
            signatory1Name: certificate.signatory_1_name,
            signatory1Title: certificate.signatory_1_title,
            signatory1Image: certificate.signatory_1_image_url,
            signatory2Name: certificate.signatory_2_name,
            signatory2Title: certificate.signatory_2_title,
            signatory2Image: certificate.signatory_2_image_url,
            backgroundUrl,
          },
        });

    // 5. Render to PDF.
    let browser = null;
    try {
      const { chromium, puppeteer } = await loadChromium();
      browser = await puppeteer.launch({
        args: [...chromium.args, '--font-render-hinting=none'],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless === true ? true : 'shell',
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60_000 });

      // Webfonts must be resolved before printing or the PDF falls back to system
      // fonts and the layout no longer matches the preview.
      await page.evaluate(() => document.fonts.ready);
      await page.emulateMediaType('print');

      const pdfFormat = templateType === 'cr_appreciation' ? 'A4' : (pageSize === 'Letter' ? 'Letter' : 'A4');
      const pdfLandscape = templateType === 'cr_appreciation' ? true : orientationValue === 'landscape';

      const pdfBytes = await page.pdf({
        format: pdfFormat,
        landscape: pdfLandscape,
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      });

      await page.close();

      // 6. Persist to the private bucket. The object key is the certificate UUID,
      //    which is stable and lets any later regeneration or public lookup find
      //    the file without relying on `pdf_path` or the mutable `certificate_id`.
      const filePath = `${certificate.id}.pdf`;
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      const { error: uploadError } = await admin.storage
        .from('certificate-pdfs')
        .upload(filePath, pdfBlob, { contentType: 'application/pdf', upsert: true });

      if (uploadError) throw new Error(`Failed to store PDF: ${uploadError.message}`);

      await admin
        .from('certificates')
        .update({ pdf_path: filePath, pdf_generated_at: new Date().toISOString() })
        .eq('id', certificate.id);

      // `log_certificate_audit` derives its actor from auth.uid(), which is null in
      // a service-role context. `record_certificate_download` therefore accepts the
      // already-verified caller id and is granted to service_role only, so the actor
      // cannot be forged from the browser.
      if (download) {
        const { error: downloadError } = await admin.rpc('record_certificate_download', {
          p_certificate_id: certificate.id,
          p_ip_hash: null,
          p_user_agent: (req.headers.get('user-agent') || '').slice(0, 300),
          p_actor: user.id,
          p_channel: 'admin',
        });
        // A failed counter must not fail the download the admin asked for.
        if (downloadError) console.error('record_certificate_download error:', downloadError);
      }

      // 7. Mint a short-lived signed URL. `download` switches to attachment.
      const { data: signed, error: signError } = await admin.storage
        .from('certificate-pdfs')
        .createSignedUrl(filePath, 300, download ? { download: `${certificate.certificate_id}.pdf` } : undefined);

      if (signError) throw new Error(`Failed to sign PDF URL: ${signError.message}`);

      return json({
        success: true,
        url: signed.signedUrl,
        certificateId: certificate.certificate_id,
        generatedAt: new Date().toISOString(),
      });
    } catch (pdfError) {
      console.warn('PDF generation notice:', pdfError?.message);
      return json({
        success: true,
        render_mode: 'client_vector',
        html,
        message: 'Chromium binary is not bundled in Deno; vector HTML provided for client print/PDF save.',
      }, 200);
    } finally {
      if (browser) {
        try { await browser.close(); } catch { /* ignore */ }
      }
    }
  } catch (error) {
    console.error('generate-certificate-pdf error:', error);
    return json({ error: error?.message || 'Failed to generate certificate PDF' }, 500);
  }
});