// @ts-nocheck
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: { get: (key: string) => string | undefined };
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

Deno.serve(async (_req: Request) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const results: string[] = [];

    // Delete error_logs older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { count: logsDeleted, error: logsErr } = await supabase
      .from('error_logs')
      .delete()
      .lt('created_at', ninetyDaysAgo);
    if (logsErr) throw logsErr;
    results.push(`Deleted ${logsDeleted || 0} error_logs older than 90 days`);

    // Delete volunteers older than 12 months
    const twelveMonthsAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const { count: volunteersDeleted, error: volErr } = await supabase
      .from('volunteers')
      .delete()
      .lt('created_at', twelveMonthsAgo);
    if (volErr) throw volErr;
    results.push(`Deleted ${volunteersDeleted || 0} volunteers older than 12 months`);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
