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

    const systemPrompt = `You are an expert career strategist analyzing a Pakistani student's profile to build a highly specific career blueprint. Think step by step before writing the final JSON.

CURRENT DATE: ${currentMonth}/${currentYear}. ALL deadlines MUST be after this date.

USER PROFILE:
- Degree: ${onboarding.degree}
- Year/Status: ${onboarding.study_year}
- Current Skills: ${onboarding.skills?.join(', ') || 'None listed'}
- Career Goal: ${onboarding.career_goal}
- Interests: ${onboarding.interests?.join(', ') || 'None listed'}
- Experience Level: ${onboarding.experience}

LIVE JOBS (use exact IDs, only if genuinely relevant):
${JSON.stringify(jobs)}

LIVE COURSES (use exact IDs, only if genuinely relevant):
${JSON.stringify(education)}

REASONING PROCESS (do this internally before producing JSON):
Step 1 — Identify the target role implied by their career_goal. Be specific: "Software Engineer" and "Backend Developer" and "Data Analyst" require different skill sets even if the user's phrasing is vague — infer the most likely specific role from their degree + goal + interests combined.
Step 2 — List what that specific target role actually requires (technical skills, tools, soft skills) at an entry level in the Pakistani job market.
Step 3 — Compare that requirement list against the user's Current Skills. The DIFFERENCE is what you recommend — never recommend a skill they already listed.
Step 4 — Rank the gap by what unlocks the most opportunity fastest, given their year/experience level. A final-year student needs different urgency than a first-year student.
Step 5 — For each action step, tie it explicitly to closing one specific piece of that gap — not a generic career-advice checklist.

EXAMPLE (for calibration only — do not copy this content, generate fresh content from the actual profile above):
Input: Degree: BS Computer Science, Year: Final Year, Skills: HTML, CSS, JavaScript, Goal: Become a Frontend Developer, Interests: UI design, Experience: Student
Reasoning: Target role = Junior Frontend Developer. That role needs: a modern framework (React/Vue), version control (Git), basic API integration, and a portfolio with real projects — not just static pages. User has HTML/CSS/JS (foundational) but no framework, no Git, no deployed projects. Biggest gap: no framework + no portfolio proof of applied skill.
Resulting action_steps would specifically say things like "Build and deploy 2 React projects using a real API (e.g. a weather app, a movie search app)" with a reason like "You know JavaScript fundamentals but have nothing that proves you can build with a framework — recruiters filter for this specifically," rather than a generic "learn React."

NOW GENERATE FOR THE ACTUAL PROFILE ABOVE.

RULES:
- Never recommend a skill already in their Current Skills list.
- Every recommended skill needs a "reason" explaining why THIS user needs it for THEIR specific goal — never a generic industry statement.
- Every action step needs a "reason" tying it to closing a specific gap, and a deadline appropriate to their year/experience (don't give a first-year student a "apply for jobs next month" step).
- Only include job/course IDs from the live lists if they genuinely match — it's fine to recommend fewer than the max, or none, rather than forcing weak matches.
- Ban these generic phrases unless followed by a concrete specific: "network more," "update your resume," "learn in-demand skills," "gain experience."
- gap_analysis: 2-3 sentences naming the single biggest, most specific gap — not a vague summary.

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "title": "Your [Specific Role] Career Path",
  "summary": "2-3 sentences max",
  "gap_analysis": "2-3 sentences on the single biggest specific gap",
  "recommended_skills": [{"skill": "Skill Name", "priority": "High/Medium/Low", "reason": "why THIS user needs THIS skill for THEIR goal", "resource_url": "URL"}],
  "recommended_jobs": ["job_id_1", "job_id_2"],
  "recommended_courses": ["edu_id_1", "edu_id_2"],
  "action_steps": [{"id": "step_1", "title": "Step Title", "deadline": "MM/YYYY", "reason": "why this step closes a specific gap now", "completed": false}],
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
      gap_analysis: blueprint.gap_analysis,
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
