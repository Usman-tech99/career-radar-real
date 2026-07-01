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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing SUPABASE_URL or SERVICE_ROLE_KEY env vars");

    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error("Missing authorization header");

    const sb = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid token");

    // Fetch all data for scoring
    const { data: onboarding } = await sb.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle();
    const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle();
    const { data: publicUser } = await sb.from('public_users').select('*').eq('id', user.id).maybeSingle();
    const { data: blueprint } = await sb.from('career_blueprints').select('action_steps, title, recommended_skills').eq('user_id', user.id).eq('is_active', true).maybeSingle();
    const { data: resume } = await sb.from('resumes').select('data').eq('user_id', user.id).maybeSingle();

    const missing_items = [];

    // --- Skills Score (max 25) ---
    let skills_score = 0;
    let allSkills = [];

    if (onboarding?.skills?.length) {
      allSkills = [...allSkills, ...onboarding.skills];
    }
    // Also count skills from resume
    if (resume?.data?.skills?.length) {
      resume.data.skills.forEach(s => { if (!allSkills.includes(s)) allSkills.push(s); });
    }
    // Deduplicate
    allSkills = [...new Set(allSkills)];

    // 3 pts per skill, max 15
    skills_score = Math.min(15, allSkills.length * 3);

    // +5 if career goal is specific (more than 10 chars)
    if (onboarding?.career_goal && onboarding.career_goal.length > 10) {
      skills_score += 5;
    }

    // +5 if interests exist
    if (onboarding?.interests?.length) {
      skills_score += 5;
    }

    skills_score = Math.min(25, skills_score);
    if (allSkills.length === 0) missing_items.push("Add Skills");

    // --- Profile Score (max 20) ---
    let profile_score = 0;

    const hasName = publicUser?.full_name || profile?.full_name;
    if (hasName) profile_score += 4;
    else missing_items.push("Full Name");

    if (profile?.avatar_url || publicUser?.avatar_url) profile_score += 4;
    else missing_items.push("Profile Avatar");

    if (profile?.bio) profile_score += 4;
    else missing_items.push("Bio / Summary");

    if (profile?.linkedin_url) profile_score += 4;
    else missing_items.push("LinkedIn URL");

    if (profile?.twitter_url || onboarding?.city || publicUser?.country) profile_score += 4;

    profile_score = Math.min(20, profile_score);

    // --- Education Score (max 20) ---
    let education_score = 0;

    if (onboarding?.degree) {
      education_score += 6;
    } else {
      missing_items.push("Degree / Education");
    }

    if (onboarding?.study_year) education_score += 4;

    // Check resume for education entries
    const eduEntries = resume?.data?.education?.filter(e => e.institution || e.degree) || [];
    if (eduEntries.length > 0) {
      education_score += 6; // Has detailed education on resume
    }
    if (eduEntries.length > 1) {
      education_score += 4; // Multiple entries = bonus
    }

    // Location awareness
    if (onboarding?.country || onboarding?.city || publicUser?.country) {
      education_score += 4;
    }

    education_score = Math.min(20, education_score);

    // --- Experience Score (max 15) ---
    let experience_score = 0;

    if (onboarding?.experience) {
      const expMap = { 'Student': 3, 'Fresh Graduate': 5, '1-2 Years': 10, '3+ Years': 15 };
      experience_score = expMap[onboarding.experience] || 0;
    } else {
      missing_items.push("Experience Level");
    }

    // Bonus: resume has work entries
    const workEntries = resume?.data?.experience?.filter(e => e.title || e.company) || [];
    if (workEntries.length > 0) {
      experience_score = Math.min(15, experience_score + 2);
    }

    experience_score = Math.min(15, experience_score);

    // --- Activity Score (max 20) ---
    let activity_score = 0;

    if (blueprint) {
      activity_score += 5; // Has an active blueprint

      if (blueprint.action_steps?.length) {
        const completedSteps = blueprint.action_steps.filter(s => s.completed).length;
        activity_score += Math.min(10, completedSteps * 2); // 2 pts per completed step
        const totalSteps = blueprint.action_steps.length;
        activity_score += Math.min(5, totalSteps); // 1 pt per step defined
      }
    } else {
      missing_items.push("Generate AI Blueprint");
    }

    // Resume projects bonus
    const projectEntries = resume?.data?.projects?.filter(p => p.name) || [];
    if (projectEntries.length > 0) {
      activity_score = Math.min(20, activity_score + 3);
    }

    activity_score = Math.min(20, activity_score);

    // --- Total ---
    const total_score = Math.min(100, skills_score + profile_score + activity_score + education_score + experience_score);

    // --- History ---
    const { data: existingScore } = await sb.from('career_scores').select('score_history').eq('user_id', user.id).maybeSingle();
    const newHistoryEntry = { date: new Date().toISOString(), score: total_score };
    let score_history = existingScore?.score_history || [];

    const today = new Date().toISOString().split('T')[0];
    const lastEntry = score_history.length > 0 ? score_history[score_history.length - 1] : null;
    if (lastEntry && lastEntry.date.startsWith(today)) {
      score_history[score_history.length - 1] = newHistoryEntry;
    } else {
      score_history.push(newHistoryEntry);
    }
    if (score_history.length > 30) score_history = score_history.slice(-30);

    // --- Upsert ---
    const { data: updatedScore, error: upsertError } = await sb.from('career_scores').upsert({
      user_id: user.id,
      total_score,
      skills_score,
      profile_score,
      activity_score,
      education_score,
      experience_score,
      missing_items,
      score_history,
      last_calculated: new Date().toISOString()
    }, { onConflict: 'user_id' }).select().single();

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, score: updatedScore }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error: any) {
    console.error("Score Error:", JSON.stringify(error));
    const message = error?.message || error?.error?.message || JSON.stringify(error) || "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});