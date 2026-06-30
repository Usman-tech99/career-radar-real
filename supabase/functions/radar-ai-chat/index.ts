import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response>) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

function detectMode(messages: { role: string; content: string }[]): string {
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content?.toLowerCase() || "";
  if (/\b(job|hiring|vacancy|position|opening|apply|career opportunity|remote job|freelance gig)\b/i.test(lastUserMsg)) return "job_matcher";
  if (/\b(course|learn|study|tutorial|guide|resource|lesson|education|skill development|training)\b/i.test(lastUserMsg)) return "content_assistant";
  if (/\b(career|advice|roadmap|strategy|path|goal|future|plan|growth|recommendation|suggestion)\b/i.test(lastUserMsg)) return "career_coach";
  return "general";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    // Verify caller JWT so we log the real user_id, not a spoofed one
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    let callerUserId: string | null = null;
    if (token) {
      const { data: { user }, error: authError } = await sb.auth.getUser(token);
      if (!authError && user) {
        callerUserId = user.id;
      }
    }

    const { messages, session_id } = await req.json();
    // Use the verified caller ID; never trust the body's user_id
    const verifiedUserId = callerUserId;

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

    const liveData = `LIVE JOBS: ${JSON.stringify(jobs)}\nLIVE CONTENT: ${JSON.stringify(content)}`;

    const groqMessages = [
      {
        role: "system",
        content: `You are Radar AI — career assistant for Career Radar. AI-powered career GPS for Pakistani students and freelancers. Be helpful, concise, encouraging. Never fabricate data. If user writes Roman Urdu, respond in Roman Urdu. Modes: CAREER COACH (advice), JOB MATCHER (match from LIVE JOBS below), CONTENT GUIDE (recommend from LIVE CONTENT below).\n\n${liveData}`
      },
      ...messages.slice(-20).map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content || ""
      }))
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        max_tokens: 1024,
        temperature: 0.7
      })
    });

    const groqData = await res.json();

    if (!res.ok) {
      throw new Error(groqData.error?.message || `Groq API error: ${res.status}`);
    }

    const aiText = groqData.choices?.[0]?.message?.content || "No response generated.";

    // Log to ai_chat_logs using verified caller ID
    const userMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
    const mode = detectMode(messages);
    (async () => {
      const { error: logErr } = await sb.from("ai_chat_logs").insert({
        session_id: session_id || "anon",
        user_id: verifiedUserId,
        user_message: userMessage,
        ai_response: aiText,
        mode_detected: mode
      });
      if (logErr) console.error("Log insert failed:", logErr);
    })()

    return new Response(JSON.stringify({ content: aiText, mode }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Radar AI Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "An unknown error occurred" }), { status: 500, headers: cors });
  }
});