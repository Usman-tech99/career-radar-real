-- RLS Performance Optimization — COMPREHENSIVE FIX
-- Run the ENTIRE file in Supabase SQL editor (no need for prior migration)
BEGIN;

-- ============================================================
-- Fix 1: auth_rls_initplan — wrap auth functions in subqueries
-- ============================================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = (SELECT auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "roles_own_read" ON user_roles;
CREATE POLICY "roles_own_read" ON user_roles FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_founder_insert" ON profiles;
CREATE POLICY "profiles_founder_insert" ON profiles FOR INSERT WITH CHECK ((SELECT get_my_role()) = 'super_admin');

DROP POLICY IF EXISTS "profiles_founder_delete" ON profiles;
CREATE POLICY "profiles_founder_delete" ON profiles FOR DELETE USING ((SELECT get_my_role()) = 'super_admin');

DROP POLICY IF EXISTS "stats_update" ON site_stats;
CREATE POLICY "stats_update" ON site_stats FOR UPDATE USING ((SELECT get_my_role()) = 'super_admin');

DROP POLICY IF EXISTS "logs_insert" ON ai_chat_logs;
CREATE POLICY "logs_insert" ON ai_chat_logs FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- ============================================================
-- Fix 2: Drop all UI-created duplicate policies
-- ============================================================

DROP POLICY IF EXISTS "Allow authenticated read of jobs for metrics" ON jobs;
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated read of site_stats" ON site_stats;
DROP POLICY IF EXISTS "Allow authenticated read of user_roles for metrics" ON user_roles;
DROP POLICY IF EXISTS "Temporary open read for roles" ON user_roles;
DROP POLICY IF EXISTS "Temporary open write for roles" ON user_roles;
DROP POLICY IF EXISTS "profiles_own_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_own_select" ON profiles;

-- ============================================================
-- Fix 3: Split ALL policies to avoid SELECT overlap
-- ============================================================

-- announcements: select_announcements (public SELECT) + super_admin ALL
DROP POLICY IF EXISTS "super_admin_all_announcements" ON announcements;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_all_announcements_insert" ON announcements;
CREATE POLICY "super_admin_all_announcements_insert" ON announcements FOR INSERT WITH CHECK (get_my_role() = 'super_admin');
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_all_announcements_update" ON announcements;
CREATE POLICY "super_admin_all_announcements_update" ON announcements FOR UPDATE USING (get_my_role() = 'super_admin') WITH CHECK (get_my_role() = 'super_admin');
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_all_announcements_delete" ON announcements;
CREATE POLICY "super_admin_all_announcements_delete" ON announcements FOR DELETE USING (get_my_role() = 'super_admin');

-- popup_settings: select_popup_settings (public SELECT) + super_admin ALL
DROP POLICY IF EXISTS "super_admin_all_popup_settings" ON popup_settings;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_all_popup_settings_insert" ON popup_settings;
CREATE POLICY "super_admin_all_popup_settings_insert" ON popup_settings FOR INSERT WITH CHECK (get_my_role() = 'super_admin');
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_all_popup_settings_update" ON popup_settings;
CREATE POLICY "super_admin_all_popup_settings_update" ON popup_settings FOR UPDATE USING (get_my_role() = 'super_admin') WITH CHECK (get_my_role() = 'super_admin');
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "super_admin_all_popup_settings_delete" ON popup_settings;
CREATE POLICY "super_admin_all_popup_settings_delete" ON popup_settings FOR DELETE USING (get_my_role() = 'super_admin');

-- jobs: jobs_pub (public SELECT) + jobs_admin ALL
DROP POLICY IF EXISTS "jobs_admin" ON jobs;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "jobs_admin_insert" ON jobs;
CREATE POLICY "jobs_admin_insert" ON jobs FOR INSERT WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "jobs_admin_update" ON jobs;
CREATE POLICY "jobs_admin_update" ON jobs FOR UPDATE USING (get_my_role() IN ('super_admin', 'admin')) WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "jobs_admin_delete" ON jobs;
CREATE POLICY "jobs_admin_delete" ON jobs FOR DELETE USING (get_my_role() IN ('super_admin', 'admin'));

-- weekly_content: content_pub (public SELECT) + content_admin ALL
DROP POLICY IF EXISTS "content_admin" ON weekly_content;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "content_admin_insert" ON weekly_content;
CREATE POLICY "content_admin_insert" ON weekly_content FOR INSERT WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "content_admin_update" ON weekly_content;
CREATE POLICY "content_admin_update" ON weekly_content FOR UPDATE USING (get_my_role() IN ('super_admin', 'admin')) WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "content_admin_delete" ON weekly_content;
CREATE POLICY "content_admin_delete" ON weekly_content FOR DELETE USING (get_my_role() IN ('super_admin', 'admin'));

-- products: products_pub (public SELECT) + products_admin ALL
DROP POLICY IF EXISTS "products_admin" ON products;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "products_admin_insert" ON products;
CREATE POLICY "products_admin_insert" ON products FOR INSERT WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "products_admin_update" ON products;
CREATE POLICY "products_admin_update" ON products FOR UPDATE USING (get_my_role() IN ('super_admin', 'admin')) WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "products_admin_delete" ON products;
CREATE POLICY "products_admin_delete" ON products FOR DELETE USING (get_my_role() IN ('super_admin', 'admin'));

-- education_items: edu_pub (public SELECT) + edu_admin ALL
DROP POLICY IF EXISTS "edu_admin" ON education_items;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "edu_admin_insert" ON education_items;
CREATE POLICY "edu_admin_insert" ON education_items FOR INSERT WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "edu_admin_update" ON education_items;
CREATE POLICY "edu_admin_update" ON education_items FOR UPDATE USING (get_my_role() IN ('super_admin', 'admin')) WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "edu_admin_delete" ON education_items;
CREATE POLICY "edu_admin_delete" ON education_items FOR DELETE USING (get_my_role() IN ('super_admin', 'admin'));

-- socials: socials_pub (public SELECT) + socials_admin ALL
DROP POLICY IF EXISTS "socials_admin" ON socials;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "socials_admin_insert" ON socials;
CREATE POLICY "socials_admin_insert" ON socials FOR INSERT WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "socials_admin_update" ON socials;
CREATE POLICY "socials_admin_update" ON socials FOR UPDATE USING (get_my_role() IN ('super_admin', 'admin')) WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "socials_admin_delete" ON socials;
CREATE POLICY "socials_admin_delete" ON socials FOR DELETE USING (get_my_role() IN ('super_admin', 'admin'));

-- collaborators: collab_pub (public SELECT) + collab_admin ALL
DROP POLICY IF EXISTS "collab_admin" ON collaborators;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "collab_admin_insert" ON collaborators;
CREATE POLICY "collab_admin_insert" ON collaborators FOR INSERT WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "collab_admin_update" ON collaborators;
CREATE POLICY "collab_admin_update" ON collaborators FOR UPDATE USING (get_my_role() IN ('super_admin', 'admin')) WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "collab_admin_delete" ON collaborators;
CREATE POLICY "collab_admin_delete" ON collaborators FOR DELETE USING (get_my_role() IN ('super_admin', 'admin'));

-- team_members: team_members_pub (public SELECT) + team_members_admin ALL
DROP POLICY IF EXISTS "team_members_admin" ON team_members;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "team_members_admin_insert" ON team_members;
CREATE POLICY "team_members_admin_insert" ON team_members FOR INSERT WITH CHECK (get_my_role() = 'super_admin');
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "team_members_admin_update" ON team_members;
CREATE POLICY "team_members_admin_update" ON team_members FOR UPDATE USING (get_my_role() = 'super_admin') WITH CHECK (get_my_role() = 'super_admin');
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "team_members_admin_delete" ON team_members;
CREATE POLICY "team_members_admin_delete" ON team_members FOR DELETE USING (get_my_role() = 'super_admin');

-- scholarships: scholarships_pub (public SELECT) + scholarships_admin ALL
DROP POLICY IF EXISTS "scholarships_admin" ON scholarships;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "scholarships_admin_insert" ON scholarships;
CREATE POLICY "scholarships_admin_insert" ON scholarships FOR INSERT WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "scholarships_admin_update" ON scholarships;
CREATE POLICY "scholarships_admin_update" ON scholarships FOR UPDATE USING (get_my_role() IN ('super_admin', 'admin')) WITH CHECK (get_my_role() IN ('super_admin', 'admin'));
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "scholarships_admin_delete" ON scholarships;
CREATE POLICY "scholarships_admin_delete" ON scholarships FOR DELETE USING (get_my_role() IN ('super_admin', 'admin'));

-- ============================================================
-- Fix 4: Merge overlapping own+admin SELECT policies
-- ============================================================

-- onboarding_data: onboarding_own (ALL for own) + onboarding_admin (SELECT for admin)
DROP POLICY IF EXISTS "onboarding_own" ON onboarding_data;
DROP POLICY IF EXISTS "onboarding_admin" ON onboarding_data;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "onboarding_own_insert" ON onboarding_data;
CREATE POLICY "onboarding_own_insert" ON onboarding_data FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "onboarding_own_update" ON onboarding_data;
CREATE POLICY "onboarding_own_update" ON onboarding_data FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "onboarding_own_delete" ON onboarding_data;
CREATE POLICY "onboarding_own_delete" ON onboarding_data FOR DELETE USING ((SELECT auth.uid()) = user_id);
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "onboarding_select" ON onboarding_data;
CREATE POLICY "onboarding_select" ON onboarding_data FOR SELECT USING ((SELECT auth.uid()) = user_id OR get_my_role() = 'super_admin');

-- public_users: pub_users_own (ALL for own) + pub_users_founder (SELECT for admin)
DROP POLICY IF EXISTS "pub_users_own" ON public_users;
DROP POLICY IF EXISTS "pub_users_founder" ON public_users;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "pub_users_own_insert" ON public_users;
CREATE POLICY "pub_users_own_insert" ON public_users FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "pub_users_own_update" ON public_users;
CREATE POLICY "pub_users_own_update" ON public_users FOR UPDATE USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "pub_users_own_delete" ON public_users;
CREATE POLICY "pub_users_own_delete" ON public_users FOR DELETE USING ((SELECT auth.uid()) = id);
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "pub_users_select" ON public_users;
CREATE POLICY "pub_users_select" ON public_users FOR SELECT USING ((SELECT auth.uid()) = id OR get_my_role() = 'super_admin');

-- user_roles: roles_own_read (SELECT for own) + roles_founder (ALL for admin)
DROP POLICY IF EXISTS "roles_founder" ON user_roles;
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "roles_founder_insert" ON user_roles;
CREATE POLICY "roles_founder_insert" ON user_roles FOR INSERT WITH CHECK (get_my_role() = 'super_admin');
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "roles_founder_update" ON user_roles;
CREATE POLICY "roles_founder_update" ON user_roles FOR UPDATE USING (get_my_role() = 'super_admin') WITH CHECK (get_my_role() = 'super_admin');
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "roles_founder_delete" ON user_roles;
CREATE POLICY "roles_founder_delete" ON user_roles FOR DELETE USING (get_my_role() = 'super_admin');
-- Re-runnable: the object may already exist from an out-of-band apply.
DROP POLICY IF EXISTS "roles_founder_select" ON user_roles;
CREATE POLICY "roles_founder_select" ON user_roles FOR SELECT USING (get_my_role() = 'super_admin');

-- ============================================================
-- Fix 5: Storage auth.role() wrapping + remove duplicate policies
-- ============================================================

DROP POLICY IF EXISTS "avatars_public_read" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "avatars_auth_delete" ON storage.objects;
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "avatars_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "avatars_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "team_avatars_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "team_avatars_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "team_avatars_auth_delete" ON storage.objects;
CREATE POLICY "team_avatars_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'team-avatars' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "team_avatars_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'team-avatars' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "team_avatars_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'team-avatars' AND (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "collab_logos_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "collab_logos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "collab_logos_auth_delete" ON storage.objects;
CREATE POLICY "collab_logos_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'collaborator-logos' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "collab_logos_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'collaborator-logos' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "collab_logos_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'collaborator-logos' AND (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "prod_thumbs_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "prod_thumbs_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "prod_thumbs_auth_delete" ON storage.objects;
CREATE POLICY "prod_thumbs_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-thumbnails' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "prod_thumbs_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-thumbnails' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "prod_thumbs_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-thumbnails' AND (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "edu_thumbs_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "edu_thumbs_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "edu_thumbs_auth_delete" ON storage.objects;
CREATE POLICY "edu_thumbs_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'education-thumbnails' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "edu_thumbs_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'education-thumbnails' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "edu_thumbs_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'education-thumbnails' AND (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "content_files_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "content_files_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "content_files_auth_delete" ON storage.objects;
CREATE POLICY "content_files_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'content-files' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "content_files_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'content-files' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "content_files_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'content-files' AND (SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "sclogos_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "sclogos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "sclogos_auth_delete" ON storage.objects;
CREATE POLICY "sclogos_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scholarship-logos' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "sclogos_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'scholarship-logos' AND (SELECT auth.role()) = 'authenticated');
CREATE POLICY "sclogos_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'scholarship-logos' AND (SELECT auth.role()) = 'authenticated');

-- ============================================================
-- Fix 6: blueprints, scores, resumes — initplan for auth.uid()
-- ============================================================

DROP POLICY IF EXISTS "blueprints_own" ON career_blueprints;
CREATE POLICY "blueprints_own" ON career_blueprints FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "scores_own" ON career_scores;
CREATE POLICY "scores_own" ON career_scores FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "resumes_own" ON resumes;
CREATE POLICY "resumes_own" ON resumes FOR ALL USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

COMMIT;
