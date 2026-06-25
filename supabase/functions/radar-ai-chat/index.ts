// @ts-ignore: Suppress local module resolution error for the editor environment
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Declare global Deno namespace properties so the editor linter recognizes it immediately
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

    // Trim to last 20 messages
    const trimmed = messages.slice(-20);

    // Map and filter to ensure valid, alternating roles (User -> Model -> User)
    const formattedContents = [];
    let lastRole = null;

    for (const m of trimmed as any[]) {
      const currentRole = m.role === "assistant" ? "model" : "user";
      if (currentRole !== lastRole) {
        // Prepend system context to the first user message
        let text = m.content || "";
        if (currentRole === "user" && formattedContents.length === 0 && system) {
          text = `${system}\n\nUser message: ${text}`;
        }
        formattedContents.push({
          role: currentRole,
          parts: [{ text }]
        });
        lastRole = currentRole;
      }
    }

    if (formattedContents.length === 0) {
      return new Response(JSON.stringify({ error: "No valid messages found" }), { status: 400, headers: cors });
    }

    // Call working free-tier model pool
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: formattedContents,
          generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
        })
      }
    );

    const geminiData = await res.json();
    return new Response(JSON.stringify(geminiData), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Radar AI Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "An unknown error occurred" }), { status: 500, headers: cors });
  }
});