// @ts-nocheck
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') || 'contact@career-radar.space';
const TURNSTILE_SECRET = Deno.env.get('TURNSTILE_SECRET_KEY') || '';

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const rateMap = new Map<string, { start: number; count: number }>();
function rateLimit(ip: string, max = 10, windowMs = 60000): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now - entry.start > windowMs) {
    rateMap.set(ip, { start: now, count: 1 });
    return { allowed: true };
  }
  entry.count++;
  if (entry.count > max) {
    return { allowed: false, retryAfter: Math.ceil((entry.start + windowMs - now) / 1000) };
  }
  return { allowed: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = rateLimit(ip, 10, 60000);
  if (!rl.allowed) {
    return new Response(JSON.stringify({ error: `Too many requests. Retry after ${rl.retryAfter}s` }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
  }

  try {
    const { type, captchaToken, full_name, email, phone, country, departments } = await req.json();

    // Verify captcha on new submissions (not approval emails from admin)
    if (type !== 'approved' && captchaToken && TURNSTILE_SECRET) {
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${TURNSTILE_SECRET}&response=${captchaToken}`,
      })
      const verifyData = await verifyRes.json()
      if (!verifyData.success) {
        return new Response(JSON.stringify({ error: 'Captcha verification failed' }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } })
      }
    }

    const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    if (type === 'approved') {
      const html = `
        <h2>Welcome to Career Radar!</h2>
        <p>Dear ${esc(full_name)},</p>
        <p>Congratulations! Your volunteer application has been <strong>approved</strong>.</p>
        <p>We are excited to have you join our mission of helping students build better careers. You will receive onboarding instructions and next steps via WhatsApp shortly.</p>
        <p style="margin-top:16px;">If you have any questions, feel free to reach out at <a href="mailto:${esc(NOTIFY_EMAIL)}">${esc(NOTIFY_EMAIL)}</a>.</p>
        <p>Best regards,<br/>Career Radar Team</p>
      `;
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Career Radar <notifications@career-radar.space>',
          to: email,
          subject: `Welcome to Career Radar — Application Approved!`,
          html,
        })
      });
      if (!res.ok) { const err = await res.text(); console.error('Resend error:', err); throw new Error('Failed to send approval email'); }
      return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    const deptList = departments?.map(d => esc(d)).join(', ') || 'Not specified';
    const adminHtml = `
      <h2>New Volunteer Application</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Name</td><td style="padding:8px;border:1px solid #ddd;">${esc(full_name)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${esc(email)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Phone</td><td style="padding:8px;border:1px solid #ddd;">${esc(phone)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Country</td><td style="padding:8px;border:1px solid #ddd;">${esc(country)}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Departments</td><td style="padding:8px;border:1px solid #ddd;">${deptList}</td></tr>
      </table>
      <p style="margin-top:16px;color:#666;">View in admin panel: <a href="https://career-radar.space/admin/manage-volunteers">career-radar.space/admin/manage-volunteers</a></p>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Career Radar <notifications@career-radar.space>',
        to: NOTIFY_EMAIL,
        subject: `New Volunteer Application — ${full_name}`,
        html: adminHtml,
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      throw new Error('Failed to send email');
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
