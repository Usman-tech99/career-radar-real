-- Career Radar - Complete Database Schema

-- Foundation:
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- Admin Tables (user_roles + profiles):
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin','admin','collaborator')),
  role_label TEXT DEFAULT '',
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create the function BEFORE using it in policies
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Now we can use the function in RLS policies
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_founder" ON user_roles FOR ALL USING (get_my_role()='super_admin') WITH CHECK (get_my_role()='super_admin');
CREATE POLICY "roles_own_read" ON user_roles FOR SELECT USING (user_id=auth.uid());

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, role_title TEXT, bio TEXT,
  avatar_url TEXT, linkedin_url TEXT, twitter_url TEXT,
  is_founder BOOLEAN DEFAULT FALSE,
  is_visible_on_team_page BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 99,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid()=id) WITH CHECK (auth.uid()=id);
CREATE POLICY "profiles_founder_insert" ON profiles FOR INSERT WITH CHECK (get_my_role()='super_admin');
CREATE POLICY "profiles_founder_delete" ON profiles FOR DELETE USING (get_my_role()='super_admin');
CREATE TRIGGER profiles_upd BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN INSERT INTO profiles(id,full_name) VALUES(NEW.id,NEW.raw_user_meta_data->>'full_name') ON CONFLICT(id) DO NOTHING; RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Public User Tables:
CREATE TABLE public_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT, email TEXT, avatar_url TEXT, country TEXT,
  onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pub_users_own" ON public_users FOR ALL USING (auth.uid()=id) WITH CHECK (auth.uid()=id);
CREATE POLICY "pub_users_founder" ON public_users FOR SELECT USING (get_my_role()='super_admin');

CREATE TABLE onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  degree TEXT, study_year TEXT, skills TEXT[], country TEXT, city TEXT,
  career_goal TEXT, experience TEXT CHECK (experience IN ('Student','Fresh Graduate','1-2 Years','3+ Years')),
  interests TEXT[], created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "onboarding_own" ON onboarding_data FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "onboarding_admin" ON onboarding_data FOR SELECT USING (get_my_role()='super_admin');

CREATE TABLE career_blueprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT, summary TEXT,
  recommended_skills JSONB DEFAULT '[]',
  recommended_jobs JSONB DEFAULT '[]',
  recommended_courses JSONB DEFAULT '[]',
  action_steps JSONB DEFAULT '[]',
  milestones JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  generated_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE career_blueprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blueprints_own" ON career_blueprints FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE career_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_score INTEGER DEFAULT 0 CHECK (total_score BETWEEN 0 AND 100),
  skills_score INTEGER DEFAULT 0,   -- max 25
  profile_score INTEGER DEFAULT 0,  -- max 20
  activity_score INTEGER DEFAULT 0, -- max 20
  education_score INTEGER DEFAULT 0,-- max 20
  experience_score INTEGER DEFAULT 0,-- max 15
  missing_items JSONB DEFAULT '[]',
  score_history JSONB DEFAULT '[]',
  last_calculated TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE career_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores_own" ON career_scores FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Resumes
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resumes_own" ON resumes FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- Content Tables (Jobs, Weekly Content, Products, Education):
-- site_stats SINGLETON
CREATE TABLE site_stats (id INT PRIMARY KEY DEFAULT 1 CHECK(id=1),
  community_members INTEGER DEFAULT 0, jobs_posted INTEGER DEFAULT 0,
  resources_shared INTEGER DEFAULT 0, total_products INTEGER DEFAULT 0,
  countries INTEGER DEFAULT 0, whatsapp_groups INTEGER DEFAULT 0,
  main_channel_followers INTEGER DEFAULT 0, scholarship_channel_followers INTEGER DEFAULT 0,
  ai_channel_followers INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO site_stats(id) VALUES(1);

-- Migration for existing DBs: ALTER TABLE site_stats ADD COLUMN IF NOT EXISTS countries INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS whatsapp_groups INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS main_channel_followers INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS scholarship_channel_followers INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS ai_channel_followers INTEGER DEFAULT 0;
ALTER TABLE site_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stats_read" ON site_stats FOR SELECT USING(TRUE);
CREATE POLICY "stats_update" ON site_stats FOR UPDATE USING(get_my_role()='super_admin');

CREATE OR REPLACE FUNCTION increment_jobs_posted()
RETURNS void LANGUAGE sql SECURITY DEFINER
AS $$ UPDATE site_stats SET jobs_posted = jobs_posted + 1, updated_at = NOW() WHERE id = 1; $$;

CREATE OR REPLACE FUNCTION increment_total_products()
RETURNS void LANGUAGE sql SECURITY DEFINER
AS $$ UPDATE site_stats SET total_products = total_products + 1, updated_at = NOW() WHERE id = 1; $$;

CREATE OR REPLACE FUNCTION increment_community_members()
RETURNS void LANGUAGE sql SECURITY DEFINER
AS $$ UPDATE site_stats SET community_members = community_members + 1, updated_at = NOW() WHERE id = 1; $$;

CREATE OR REPLACE FUNCTION increment_resources_shared()
RETURNS void LANGUAGE sql SECURITY DEFINER
AS $$ UPDATE site_stats SET resources_shared = resources_shared + 1, updated_at = NOW() WHERE id = 1; $$;

-- jobs
CREATE TABLE jobs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, company TEXT NOT NULL, location TEXT,
  type TEXT CHECK(type IN('Full-time','Part-time','Internship','Freelance','Remote')),
  description TEXT, apply_url TEXT, deadline DATE,
  tags TEXT[] DEFAULT '{}', slug TEXT UNIQUE,
  is_featured BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_jobs ON jobs(is_active,created_at DESC);
CREATE INDEX idx_jobs_tags ON jobs USING GIN(tags);
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_pub" ON jobs FOR SELECT USING(is_active=TRUE);
CREATE POLICY "jobs_admin" ON jobs FOR ALL USING(get_my_role() IN('super_admin','admin')) WITH CHECK(get_my_role() IN('super_admin','admin'));
CREATE TRIGGER jobs_upd BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- weekly_content
CREATE TABLE weekly_content (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT,
  category TEXT CHECK(category IN('Roadmap','Guide','AI Tools','Resource Pack','Workshop','Other')),
  thumbnail_url TEXT, file_url TEXT, external_link TEXT, week_label TEXT,
  is_published BOOLEAN DEFAULT TRUE,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE weekly_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_pub" ON weekly_content FOR SELECT USING(is_published=TRUE);
CREATE POLICY "content_admin" ON weekly_content FOR ALL USING(get_my_role() IN('super_admin','admin')) WITH CHECK(get_my_role() IN('super_admin','admin'));
CREATE TRIGGER content_upd BEFORE UPDATE ON weekly_content FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- products
CREATE TABLE products (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT,
  category TEXT CHECK(category IN('File','Course','Template','eBook','Bundle','Physical')),
  thumbnail_url TEXT, file_url TEXT, preview_url TEXT,
  price_pkr INTEGER DEFAULT 0, is_free BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE, external_link TEXT,
  whatsapp_number TEXT, bank_details TEXT,
  posted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_pub" ON products FOR SELECT USING(is_active=TRUE);
CREATE POLICY "products_admin" ON products FOR ALL USING(get_my_role() IN('super_admin','admin')) WITH CHECK(get_my_role() IN('super_admin','admin'));
CREATE TRIGGER products_upd BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- delivered_orders (manual payment tracking)
CREATE TABLE delivered_orders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_title TEXT NOT NULL, buyer_name TEXT, buyer_whatsapp TEXT,
  amount_pkr INTEGER, payment_method TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN('pending','confirmed','delivered','rejected')),
  notes TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE delivered_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_founder" ON delivered_orders FOR ALL USING(get_my_role()='super_admin');

-- education_items
CREATE TABLE education_items (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, description TEXT,
  type TEXT CHECK(type IN('Course','Book','Guide','Workshop')),
  level TEXT CHECK(level IN('Beginner','Intermediate','Advanced')),
  thumbnail_url TEXT, is_free BOOLEAN DEFAULT TRUE,
  free_access_url TEXT, product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  duration_label TEXT, topics_covered TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT TRUE, sort_order INTEGER DEFAULT 99,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE education_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "edu_pub" ON education_items FOR SELECT USING(is_published=TRUE);
CREATE POLICY "edu_admin" ON education_items FOR ALL USING(get_my_role() IN('super_admin','admin')) WITH CHECK(get_my_role() IN('super_admin','admin'));

-- Community + AI Tables:
-- structure_page SINGLETON
CREATE TABLE structure_page (id INT PRIMARY KEY DEFAULT 1 CHECK(id=1),
  aim TEXT, mission TEXT, vision TEXT,
  core_values JSONB DEFAULT '[]', goals JSONB DEFAULT '[]', milestones JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO structure_page(id) VALUES(1);
ALTER TABLE structure_page ENABLE ROW LEVEL SECURITY;
CREATE POLICY "struct_pub" ON structure_page FOR SELECT USING(TRUE);
CREATE POLICY "struct_admin" ON structure_page FOR UPDATE USING(get_my_role() IN('super_admin','admin'));

-- about_page SINGLETON
CREATE TABLE about_page (id INT PRIMARY KEY DEFAULT 1 CHECK(id=1),
  story_heading TEXT DEFAULT 'Our Story', story_text TEXT,
  founded_date TEXT, contact_email TEXT, contact_whatsapp TEXT,
  community_link TEXT, tagline TEXT, founder_message TEXT,
  mission_text TEXT DEFAULT '',
  core_values JSONB DEFAULT '[]',
  what_we_do TEXT DEFAULT '',
  who_can_join TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO about_page(id) VALUES(1);
-- Migration for existing DBs: ALTER TABLE about_page ADD COLUMN IF NOT EXISTS mission_text TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS core_values JSONB DEFAULT '[]', ADD COLUMN IF NOT EXISTS what_we_do TEXT DEFAULT '', ADD COLUMN IF NOT EXISTS who_can_join TEXT DEFAULT '';
ALTER TABLE about_page ENABLE ROW LEVEL SECURITY;
CREATE POLICY "about_pub" ON about_page FOR SELECT USING(TRUE);
CREATE POLICY "about_admin" ON about_page FOR UPDATE USING(get_my_role() IN('super_admin','admin'));

-- socials
CREATE TABLE socials (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name TEXT NOT NULL,
  platform_type TEXT CHECK(platform_type IN('whatsapp','youtube','instagram','telegram','linkedin','twitter','discord','tiktok','facebook','other')),
  handle_or_name TEXT, url TEXT NOT NULL, description TEXT,
  members_count TEXT, is_active BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE, sort_order INTEGER DEFAULT 99,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE socials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "socials_pub" ON socials FOR SELECT USING(is_active=TRUE);
CREATE POLICY "socials_admin" ON socials FOR ALL USING(get_my_role() IN('super_admin','admin')) WITH CHECK(get_my_role() IN('super_admin','admin'));

-- collaborators
CREATE TABLE collaborators (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, description TEXT, logo_url TEXT,
  website_url TEXT, youtube_url TEXT, whatsapp_url TEXT, instagram_url TEXT,
  collaboration_type TEXT CHECK(collaboration_type IN('Partner','Sponsor','Affiliate','Friend')),
  is_featured BOOLEAN DEFAULT FALSE, is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 99, created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE collaborators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collab_pub" ON collaborators FOR SELECT USING(is_active=TRUE);
CREATE POLICY "collab_admin" ON collaborators FOR ALL USING(get_my_role() IN('super_admin','admin')) WITH CHECK(get_my_role() IN('super_admin','admin'));

-- team_members (dedicated table — only super admin populates)
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT,
  role TEXT NOT NULL,
  skills TEXT[] DEFAULT '{}',
  age INTEGER,
  education TEXT,
  goal TEXT,
  social_links JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 99,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "team_members_pub" ON team_members FOR SELECT USING (is_active = TRUE);
CREATE POLICY "team_members_admin" ON team_members FOR ALL USING (get_my_role() = 'super_admin') WITH CHECK (get_my_role() = 'super_admin');
CREATE TRIGGER team_members_upd BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Storage RLS for team-avatars bucket
CREATE POLICY "team_avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'team-avatars');
CREATE POLICY "team_avatars_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'team-avatars' AND auth.role() = 'authenticated');
CREATE POLICY "team_avatars_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'team-avatars' AND auth.role() = 'authenticated');
CREATE POLICY "team_avatars_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'team-avatars' AND auth.role() = 'authenticated');

-- ai_chat_logs
CREATE TABLE ai_chat_logs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL, user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_message TEXT NOT NULL, ai_response TEXT NOT NULL,
  mode_detected TEXT CHECK(mode_detected IN('career_coach','job_matcher','content_assistant','general')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_insert" ON ai_chat_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "logs_founder_select" ON ai_chat_logs FOR SELECT USING(get_my_role()='super_admin');
CREATE POLICY "logs_founder_delete" ON ai_chat_logs FOR DELETE USING(get_my_role()='super_admin');

-- scholarships
CREATE TABLE scholarships (id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL, provider TEXT NOT NULL,
  coverage TEXT CHECK(coverage IN('Fully Funded','Partial Tuition','Monthly Stipend','Other')),
  country TEXT NOT NULL, deadline DATE, description TEXT,
  eligibility TEXT, apply_url TEXT NOT NULL, image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_scholarships ON scholarships(country,coverage);
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scholarships_pub" ON scholarships FOR SELECT USING(TRUE);
CREATE POLICY "scholarships_admin" ON scholarships FOR ALL USING(get_my_role() IN('super_admin','admin')) WITH CHECK(get_my_role() IN('super_admin','admin'));
CREATE TRIGGER scholarships_upd BEFORE UPDATE ON scholarships FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Storage RLS for avatars bucket
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Storage RLS for collaborator-logos bucket
CREATE POLICY "collab_logos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'collaborator-logos');
CREATE POLICY "collab_logos_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'collaborator-logos' AND auth.role() = 'authenticated');
CREATE POLICY "collab_logos_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'collaborator-logos' AND auth.role() = 'authenticated');
CREATE POLICY "collab_logos_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'collaborator-logos' AND auth.role() = 'authenticated');

-- Storage RLS for product-thumbnails bucket
CREATE POLICY "prod_thumbs_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-thumbnails');
CREATE POLICY "prod_thumbs_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-thumbnails' AND auth.role() = 'authenticated');
CREATE POLICY "prod_thumbs_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-thumbnails' AND auth.role() = 'authenticated');
CREATE POLICY "prod_thumbs_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-thumbnails' AND auth.role() = 'authenticated');

-- Storage RLS for product-files bucket (private — super_admin only for all ops)
CREATE POLICY "prod_files_admin_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-files' AND get_my_role() = 'super_admin');
CREATE POLICY "prod_files_admin_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-files' AND get_my_role() = 'super_admin');
CREATE POLICY "prod_files_admin_update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-files' AND get_my_role() = 'super_admin');
CREATE POLICY "prod_files_admin_delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-files' AND get_my_role() = 'super_admin');

-- Storage RLS for education-thumbnails bucket
CREATE POLICY "edu_thumbs_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'education-thumbnails');
CREATE POLICY "edu_thumbs_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'education-thumbnails' AND auth.role() = 'authenticated');
CREATE POLICY "edu_thumbs_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'education-thumbnails' AND auth.role() = 'authenticated');
CREATE POLICY "edu_thumbs_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'education-thumbnails' AND auth.role() = 'authenticated');

-- Storage RLS for content-files bucket
CREATE POLICY "content_files_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'content-files');
CREATE POLICY "content_files_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'content-files' AND auth.role() = 'authenticated');
CREATE POLICY "content_files_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'content-files' AND auth.role() = 'authenticated');
CREATE POLICY "content_files_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'content-files' AND auth.role() = 'authenticated');

-- community_page SINGLETON
CREATE TABLE community_page (id INT PRIMARY KEY DEFAULT 1 CHECK(id=1),
  stats JSONB DEFAULT '[]',
  roadmap_items JSONB DEFAULT '[]',
  founder_message TEXT DEFAULT '',
  testimonials_heading TEXT DEFAULT 'Testimonials',
  testimonials_text TEXT DEFAULT 'Real success stories from our community will be featured here as members achieve scholarships, internships, jobs, and career milestones.',
  cta_heading TEXT DEFAULT 'Start Your Career Journey Today',
  cta_text TEXT DEFAULT 'Join thousands of students discovering opportunities, building skills, and preparing for the future with Career Radar.',
  primary_cta_text TEXT DEFAULT 'Join Community',
  primary_cta_link TEXT DEFAULT '/social',
  secondary_cta_text TEXT DEFAULT 'Partner With Us',
  secondary_cta_link TEXT DEFAULT '/collaborators',
   explore_links JSONB DEFAULT '[]',
   community_links JSONB DEFAULT '[]',
   events JSONB DEFAULT '[]',
   volunteer_program JSONB DEFAULT '{"heading":"Volunteer Program","text":"","image_url":""}',
   success_stories JSONB DEFAULT '[]',
   updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO community_page(id) VALUES(1);
-- Migration for existing DBs: ALTER TABLE community_page ADD COLUMN IF NOT EXISTS events JSONB DEFAULT '[]', ADD COLUMN IF NOT EXISTS volunteer_program JSONB DEFAULT '{"heading":"Volunteer Program","text":"","image_url":""}', ADD COLUMN IF NOT EXISTS success_stories JSONB DEFAULT '[]';
ALTER TABLE community_page ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_pub" ON community_page FOR SELECT USING(TRUE);
CREATE POLICY "community_admin" ON community_page FOR UPDATE USING(get_my_role() IN('super_admin','admin'));

-- Storage RLS for scholarship-logos bucket
CREATE POLICY "sclogos_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'scholarship-logos');
CREATE POLICY "sclogos_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scholarship-logos' AND auth.role() = 'authenticated');
CREATE POLICY "sclogos_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'scholarship-logos' AND auth.role() = 'authenticated');
CREATE POLICY "sclogos_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'scholarship-logos' AND auth.role() = 'authenticated');

-- Storage RLS for avatars bucket
CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_auth_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_auth_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatars_auth_delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
