// @ts-nocheck
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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error("Missing authorization header");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid token");

    const { text } = await req.json();
    if (!text || text.trim().length < 20) throw new Error("Extracted text is too short — ensure the file contains readable content");

    const systemPrompt = `You are a resume parser. Extract structured information from the resume text below and return ONLY valid JSON (no markdown, no code fences) with this exact structure:

{
  "personal": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "title": "",
    "linkedin": "",
    "portfolio": "",
    "bio": ""
  },
  "education": [
    { "institution": "", "degree": "", "field": "", "startYear": "", "endYear": "", "gpa": "" }
  ],
  "skills": [],
  "experience": [
    { "company": "", "title": "", "location": "", "startDate": "", "endDate": "", "current": false, "description": "" }
  ],
  "projects": [
    { "name": "", "description": "", "technologies": "", "link": "" }
  ],
  "certifications": [
    { "name": "", "issuer": "", "date": "", "link": "" }
  ]
}

Rules:
- Extract all fields you can find. For missing fields, use empty string "" or empty array [].
- Normalize phone numbers to international format if possible.
- Extract LinkedIn and portfolio URLs exactly as they appear.
- Split skills into individual strings in the skills array.
- For experience, set "current": true if the end date says "Present" or similar.
- Return only the JSON object, nothing else.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        max_tokens: 4096,
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    const groqData = await res.json();

    if (!res.ok) {
      throw new Error(groqData.error?.message || `Groq API error: ${res.status}`);
    }

    const responseText = groqData.choices?.[0]?.message?.content?.trim();
    if (!responseText) throw new Error("Groq returned empty response");

    const parsed = JSON.parse(responseText);

    return new Response(JSON.stringify({ success: true, data: parsed }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("parse-resume Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "An unknown error occurred" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
