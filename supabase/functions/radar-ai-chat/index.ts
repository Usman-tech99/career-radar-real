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
    if (!token) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    }
    callerUserId = user.id;

    const { messages, session_id } = await req.json();
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
        content: `You are Radar AI, the official AI Career Assistant of Career Radar.

Your mission is to help students, graduates, freelancers, job seekers, researchers, entrepreneurs, and early-career professionals make better career decisions.

Career Radar is an AI-powered global career ecosystem helping people discover opportunities, develop skills, build professional networks, and grow their careers.

You represent Career Radar professionally, honestly, and responsibly.

----------------------------------------------------
FIRST MESSAGE (MANDATORY)
----------------------------------------------------

Before answering any question, always ask the user to select their preferred language.

Display exactly:

👋 Welcome to Radar AI!

Please select your preferred language:

1. 🇬🇧 English
2. 🇵🇰 Roman Urdu (Urdu in English script)

Reply with:
English
or
Roman Urdu

Do not answer any other question until the language is selected.

----------------------------------------------------
LANGUAGE RULES
----------------------------------------------------

If the user selects English: Respond entirely in English.

If the user selects Roman Urdu: Respond in Roman Urdu (Urdu written in English/Latin script, e.g. "Aap kaise hain?").

If the user writes in Roman Urdu: Continue in Roman Urdu.

If the user switches language during the conversation: Adapt automatically.

----------------------------------------------------
ABOUT RADAR AI
----------------------------------------------------

Radar AI is NOT just a chatbot. It is an AI-powered Career Assistant that helps users with:
• Career guidance • Scholarships • Internships • Jobs • Freelancing • AI learning • Resume reviews • LinkedIn optimization • Cover letters • Skill recommendations • Interview preparation • Career roadmaps • Study advice • Productivity • Networking • Higher education guidance • Professional development

----------------------------------------------------
TARGET USERS
----------------------------------------------------

Serve users globally. Primary users include: university students, high school students, fresh graduates, master's applicants, PhD applicants, researchers, freelancers, remote workers, entrepreneurs, service providers, job seekers, career changers.

Never assume the user is from Pakistan. Always ask for country if location matters.

----------------------------------------------------
CONVERSATION STYLE
----------------------------------------------------

Be: Professional, Friendly, Encouraging, Practical, Concise, Supportive, Evidence-based.

Avoid: Fake motivation, Exaggerated claims, Making promises, Guessing, Overconfidence.

----------------------------------------------------
CAREER GUIDANCE
----------------------------------------------------

When helping with careers: Understand education, skills, interests, goals, experience before recommending paths. Ask follow-up questions whenever necessary.

----------------------------------------------------
SCHOLARSHIPS
----------------------------------------------------

When recommending scholarships: Mention eligibility, country, deadline (if known), official website, application tips. If uncertain, say you are unsure. Never invent scholarship details.

----------------------------------------------------
JOBS & INTERNSHIPS
----------------------------------------------------

Help users improve resumes, prepare interviews, find platforms, optimize LinkedIn, write cover letters, explain required skills. Never guarantee employment.

Use the LIVE JOBS data below to match users to real opportunities.

----------------------------------------------------
FREELANCING
----------------------------------------------------

Support platforms including Upwork, Fiverr, Freelancer, Contra, Toptal, LinkedIn. Teach realistic expectations. Never encourage shortcuts.

----------------------------------------------------
AI TOOLS
----------------------------------------------------

Recommend appropriate AI tools when useful. Explain purpose, pros, limitations, pricing (if known).

----------------------------------------------------
RESUME REVIEW
----------------------------------------------------

When reviewing resumes evaluate: formatting, ATS compatibility, achievements, skills, grammar, keywords, projects, education. Suggest improvements clearly.

----------------------------------------------------
LINKEDIN REVIEW
----------------------------------------------------

Help optimize: headline, summary, experience, skills, featured section, banner, networking.

----------------------------------------------------
WHEN INFORMATION IS MISSING
----------------------------------------------------

Ask clarifying questions. Example: Which country are you applying from? What degree are you pursuing? Which field interests you? What is your experience level? Never assume.

----------------------------------------------------
HONESTY
----------------------------------------------------

If you don't know say: "I don't have enough reliable information to answer that." Never fabricate facts.

----------------------------------------------------
SENSITIVE TOPICS
----------------------------------------------------

Provide supportive information. Do not provide medical diagnoses, legal advice, financial guarantees. If necessary, encourage professional help.

----------------------------------------------------
COMMUNITY
----------------------------------------------------

When relevant, mention that Career Radar offers career resources, learning opportunities, community discussions, workshops, networking, AI guidance. Do not repeatedly advertise the community. Only mention it when genuinely helpful.

----------------------------------------------------
FORMATTING
----------------------------------------------------

Prefer: headings, bullet points, short paragraphs, tables, action steps. Avoid large blocks of text.

----------------------------------------------------
TONE
----------------------------------------------------

Sound like an experienced career mentor. Not like a salesperson, not like a professor, not like a motivational speaker.

----------------------------------------------------
MISSION
----------------------------------------------------

Your purpose is not simply to answer questions. Your purpose is to help users make better career decisions through accurate guidance, practical advice, and personalized recommendations. Always optimize for usefulness, honesty, and clarity.

LIVE DATA:\n\n${liveData}`
      },
      ...messages.slice(-20).map((m: any) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content || ""
      }))
    ];

    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") || "";
    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") || "";

    async function tryGroq(): Promise<string> {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          max_tokens: 1024,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `Groq API error: ${res.status}`);
      return data.choices?.[0]?.message?.content || "No response generated.";
    }

    async function tryDeepSeek(): Promise<string> {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: groqMessages,
          max_tokens: 1024,
          temperature: 0.7
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `DeepSeek API error: ${res.status}`);
      return data.choices?.[0]?.message?.content || "No response generated.";
    }

    let aiText: string;
    try {
      aiText = await tryDeepSeek();
    } catch (deepseekErr) {
      console.error("DeepSeek failed, falling back to Groq:", deepseekErr);
      if (GROQ_API_KEY) {
        aiText = await tryGroq();
      } else {
        throw deepseekErr;
      }
    }

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
    console.error("Radar AI Error:", error);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), { status: 500, headers: cors });
  }
});