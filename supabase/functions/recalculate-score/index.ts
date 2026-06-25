import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
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

    // Fetch data for scoring
    const { data: onboarding, error: onboardingError } = await sb.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle();
    if (onboardingError) throw onboardingError;

    const { data: profile, error: profileError } = await sb.from('profiles').select('linkedin_url, avatar_url, bio').eq('id', user.id).maybeSingle();
    if (profileError) throw profileError;
    const { data: blueprint } = await sb.from('career_blueprints').select('action_steps').eq('user_id', user.id).eq('is_active', true).maybeSingle();
    
    // We would ideally fetch education completions and login activity here, but keeping it simple based on spec:
    
    let skills_score = 0;
    if (onboarding && onboarding.skills) {
      skills_score = Math.min(25, Math.floor(onboarding.skills.length / 5) * 5); 
      // e.g. 5 skills = 5 pts, wait prompt says: "5pts per 5 skills listed" -> 5 skills = 5, 10 skills = 10, max 25
    }

    let profile_score = 0;
    const missing_items = [];
    if (profile?.linkedin_url) profile_score += 10;
    else missing_items.push("LinkedIn Profile");
    
    if (profile?.avatar_url) profile_score += 5;
    else missing_items.push("Avatar");
    
    if (profile?.bio) profile_score += 5;
    else missing_items.push("Bio");

    let experience_score = 0;
    if (onboarding?.experience) {
      if (onboarding.experience === 'Student') experience_score = 0;
      else if (onboarding.experience === 'Fresh Graduate') experience_score = 5;
      else if (onboarding.experience === '1-2 Years') experience_score = 10;
      else if (onboarding.experience === '3+ Years') experience_score = 15;
    } else {
      missing_items.push("Experience Level");
    }

    let activity_score = 0;
    if (blueprint?.action_steps) {
      const completedSteps = blueprint.action_steps.filter((s: any) => s.completed).length;
      activity_score = Math.min(20, completedSteps * 4); // 4 pts per completed action step, max 20
    }

    // Default education score for now
    let education_score = 0; 

    const total_score = skills_score + profile_score + activity_score + education_score + experience_score;

    // Fetch existing score to update history
    const { data: existingScore } = await sb.from('career_scores').select('score_history').eq('user_id', user.id).maybeSingle();
    
    const newHistoryEntry = { date: new Date().toISOString(), score: total_score };
    let score_history = existingScore?.score_history || [];
    
    // Check if we already logged a score today, if so, replace it, else append
    const today = new Date().toISOString().split('T')[0];
    const lastEntry = score_history.length > 0 ? score_history[score_history.length - 1] : null;
    
    if (lastEntry && lastEntry.date.startsWith(today)) {
      score_history[score_history.length - 1] = newHistoryEntry;
    } else {
      score_history.push(newHistoryEntry);
    }
    
    // Keep only last 30 entries
    if (score_history.length > 30) score_history = score_history.slice(-30);

    // Upsert the score
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
    }).select().single();

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, score: updatedScore }), { headers: { ...cors, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Score Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
