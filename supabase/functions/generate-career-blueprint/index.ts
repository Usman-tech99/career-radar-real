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
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error("Missing authorization header");

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid token");

    // Fetch user's onboarding data
    const { data: onboarding, error: onboardingError } = await sb.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle();
    if (onboardingError || !onboarding) throw new Error("Onboarding data not found");

    // Fetch jobs to match
    const { data: jobs, error: jobsError } = await sb.from('jobs').select('id,title,company,tags').eq('is_active', true).limit(50);
    if (jobsError) throw jobsError;

    // Fetch education to match
    const { data: education, error: eduError } = await sb.from('education_items').select('id,title,type,topics_covered').eq('is_published', true).limit(50);
    if (eduError) throw eduError;

    const systemPrompt = `You are an AI Career Strategist for Pakistani students.
    Generate a JSON blueprint for a user based on their onboarding profile.
    Profile:
    Degree: ${onboarding.degree}
    Year: ${onboarding.study_year}
    Skills: ${onboarding.skills?.join(', ')}
    Goals: ${onboarding.career_goal}
    Interests: ${onboarding.interests?.join(', ')}
    Experience: ${onboarding.experience}

    LIVE JOBS TO MATCH FROM (use exact IDs):
    ${JSON.stringify(jobs)}

    LIVE COURSES TO MATCH FROM (use exact IDs):
    ${JSON.stringify(education)}

    Return a JSON object with this exact structure:
    {
      "title": "Your [Field] Career Path",
      "summary": "2-3 sentences max",
      "recommended_skills": [{"skill": "Skill Name", "priority": "High/Medium/Low", "resource_url": "URL"}],
      "recommended_jobs": ["job_id_1", "job_id_2"],
      "recommended_courses": ["edu_id_1", "edu_id_2"],
      "action_steps": [{"id": "step_1", "title": "Step Title", "deadline": "MM/YYYY", "completed": false}],
      "milestones": ["Milestone 1", "Milestone 2"]
    }`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
          generationConfig: { 
            maxOutputTokens: 2048, 
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const geminiData = await res.json();
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error("Gemini failed to return content candidates. Check API quota.");
    }

    const responseText = geminiData.candidates[0].content.parts[0].text.trim();
    const blueprint = JSON.parse(responseText);

    // Save to database
    // First, deactivate any old blueprints
    await sb.from('career_blueprints').update({ is_active: false }).eq('user_id', user.id);

    // Insert new
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