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

    const systemPrompt = `You are an AI Career Strategist for Pakistani students. Generate a JSON blueprint based on the user's profile.

Profile:
- Degree: ${onboarding.degree}
- Year: ${onboarding.study_year}
- Skills: ${onboarding.skills?.join(', ')}
- Goals: ${onboarding.career_goal}
- Interests: ${onboarding.interests?.join(', ')}
- Experience: ${onboarding.experience}

LIVE JOBS TO MATCH FROM (use exact IDs):
${JSON.stringify(jobs)}

LIVE COURSES TO MATCH FROM (use exact IDs):
${JSON.stringify(education)}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "title": "Your [Field] Career Path",
  "summary": "2-3 sentences max",
  "recommended_skills": [{"skill": "Skill Name", "priority": "High/Medium/Low", "resource_url": "URL"}],
  "recommended_jobs": ["job_id_1", "job_id_2"],
  "recommended_courses": ["edu_id_1", "edu_id_2"],
  "action_steps": [{"id": "step_1", "title": "Step Title", "deadline": "MM/YYYY", "completed": false}],
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
        max_tokens: 2048,
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

    return new Response(JSON.stringify({ success: true, blueprint: insertedBlueprint }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Blueprint Error:", error);
    return new Response(JSON.stringify({ error: error?.message || "An unknown error occurred" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
