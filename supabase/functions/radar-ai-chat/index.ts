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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { messages } = await req.json();

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

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

    return new Response(JSON.stringify({ content: aiText }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Radar AI Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "An unknown error occurred" }), { status: 500, headers: cors });
  }
});
