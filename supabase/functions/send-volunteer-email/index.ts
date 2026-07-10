// @ts-nocheck
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
const NOTIFY_EMAIL = Deno.env.get('NOTIFY_EMAIL') || 'contact@career-radar.space';

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { full_name, email, phone, country, departments } = await req.json();

    const deptList = departments?.join(', ') || 'Not specified';
    const html = `
      <h2>New Volunteer Application</h2>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;">
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Name</td><td style="padding:8px;border:1px solid #ddd;">${full_name}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${email}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Phone</td><td style="padding:8px;border:1px solid #ddd;">${phone}</td></tr>
        <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Country</td><td style="padding:8px;border:1px solid #ddd;">${country}</td></tr>
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
        html,
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
