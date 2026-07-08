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

    const { data: onboarding, error: onboardingError } = await sb.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle();
    if (onboardingError || !onboarding) throw new Error("Onboarding data not found");

    const { data: jobs, error: jobsError } = await sb.from('jobs').select('id,title,company,tags').eq('is_active', true).limit(50);
    if (jobsError) throw jobsError;

    const { data: education, error: eduError } = await sb.from('education_items').select('id,title,type,topics_covered').eq('is_published', true).limit(50);
    if (eduError) throw eduError;

    const now = new Date()
    const currentMonth = now.toLocaleString('en-US', { month: '2-digit' })
    const currentYear = now.getFullYear()

    const systemPrompt = `You are an AI Career Strategist for Pakistani students. You must produce a DEEP, SPECIFIC, non-generic career blueprint — not a template.

CURRENT DATE: ${currentMonth}/${currentYear}. ALL deadlines MUST be after this current date.

USER PROFILE:
- Degree: ${onboarding.degree}
- Year/Status: ${onboarding.study_year}
- Current Skills: ${onboarding.skills?.join(', ') || 'None listed'}
- Career Goal: ${onboarding.career_goal}
- Interests: ${onboarding.interests?.join(', ') || 'None listed'}
- Experience Level: ${onboarding.experience}

LIVE JOBS TO MATCH FROM (use exact IDs):
${JSON.stringify(jobs)}

LIVE COURSES TO MATCH FROM (use exact IDs):
${JSON.stringify(education)}

INSTRUCTIONS — read carefully, this determines output quality:
1. Do NOT recommend skills the user already has listed. Identify the SPECIFIC gap between their current skills and what their career_goal actually requires — reference their exact degree/experience, not the field in general.
2. For each recommended skill, you MUST explain WHY it matters for THIS user specifically (their goal + current gap) — not a generic industry statement. Bad: "SQL is important for data roles." Good: "Your marketing degree gives you the communication side of product work, but SQL will let you validate ideas with data directly instead of relying on analysts."
3. For action_steps, tailor the plan to their actual stage — a first-year student's steps look different from a final-year student's or someone with 1-2 years experience. Each step needs a "reason" tying it to their specific gap.
4. Only recommend jobs/courses from the live lists that genuinely match their goal + skill level — don't force matches if nothing fits well; it's fine to recommend fewer than the max.
5. Avoid these generic phrases entirely: "network more," "update your resume," "learn in-demand skills," "gain experience" — unless followed by a concrete, specific instruction (e.g. which platform, which 3 people to reach out to, which specific project to build).
6. Write a "gap_analysis" — 2-3 sentences identifying the single biggest gap between where they are and their goal.

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "title": "Your [Field] Career Path",
  "summary": "2-3 sentences max",
  "gap_analysis": "2-3 sentences on the biggest specific gap",
  "recommended_skills": [{"skill": "Skill Name", "priority": "High/Medium/Low", "reason": "why THIS user needs THIS skill", "resource_url": "URL"}],
  "recommended_jobs": ["job_id_1", "job_id_2"],
  "recommended_courses": ["edu_id_1", "edu_id_2"],
  "action_steps": [{"id": "step_1", "title": "Step Title", "deadline": "MM/YYYY", "reason": "why this step now, for this user", "completed": false}],
  "milestones": ["Milestone 1", "Milestone 2"]
}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: systemPrompt }],
        max_tokens: 3072,
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    const groqData = await res.json();

    if (!res.ok) {
      throw new Error(groqData.error?.message || `Groq API error: ${res.status}`);
    }

    const responseText = groqData.choices?.[0]?.message?.content?.trim();
    if (!responseText) throw new Error("Groq returned empty response");

    const blueprint = JSON.parse(responseText);

    await sb.from('career_blueprints').update({ is_active: false }).eq('user_id', user.id);

    const { data: insertedBlueprint, error: insertError } = await sb.from('career_blueprints').insert({
      user_id: user.id,
      title: blueprint.title,
      summary: blueprint.summary,
      recommended_skills: blueprint.recommended_skills,
      recommended_jobs: blueprint.recommended_jobs,
      recommended_courses: blueprint.recommended_courses,
      action_steps: blueprint.action_steps,
      milestones: blueprint.milestones,
      is_active: true
    }).select().single();

    if (insertError) throw insertError;

    // Log to ai_chat_logs
    (async () => {
      const { error: logErr } = await sb.from('ai_chat_logs').insert({
        session_id: 'blueprint-' + user.id,
        user_id: user.id,
        user_message: `Generate career blueprint (${onboarding.career_goal || 'general'})`,
        ai_response: blueprint.summary || 'Blueprint generated',
        mode_detected: 'career_coach'
      });
      if (logErr) console.error('Blueprint log insert failed:', logErr);
    })();

    return new Response(JSON.stringify({ success: true, blueprint: insertedBlueprint, raw: blueprint }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Blueprint Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "An unknown error occurred" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
