import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { messages, session_id } = await req.json();

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch live data
    const { data: jobs } = await sb
      .from("jobs")
      .select("id,title,company,location,type,tags,apply_url,deadline")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(30);

    const { data: content } = await sb
      .from("weekly_content")
      .select("id,title,description,category,week_label,file_url,external_link")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(20);

    const system = `You are Radar AI — career assistant for Career Radar.
    AI-powered career GPS for Pakistani students and freelancers.
    Be helpful, concise, encouraging. Never fabricate data.
    If user writes Roman Urdu, respond in Roman Urdu.
    Modes: CAREER COACH (advice), JOB MATCHER (match from LIVE JOBS below),
    CONTENT GUIDE (recommend from LIVE CONTENT below).
    LIVE JOBS: ${JSON.stringify(jobs)}
    LIVE CONTENT: ${JSON.stringify(content)}`;

    // Cap at last 20 messages
    const trimmed = messages.slice(-20);

    // Call Gemini 2.0 Flash
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents: trimmed.map((m: any) => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          })),
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
        })
      }
    );

    return new Response(res.body, { headers: { ...cors, "Content-Type": "text/event-stream" } });

  } catch (error) {
    console.error("Radar AI Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: cors });
  }
});
