-- DQ Website CMS Schema

CREATE TYPE public.dq_admin_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE public.dq_site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role public.dq_admin_role NOT NULL DEFAULT 'editor',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_navigation_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  href text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  show_in_header boolean NOT NULL DEFAULT true,
  show_in_footer boolean NOT NULL DEFAULT false,
  footer_group text DEFAULT 'quick_links',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_hero_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_line1 text NOT NULL,
  title_line2 text NOT NULL,
  title_line3 text NOT NULL,
  highlight_word text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  primary_cta_label text NOT NULL DEFAULT 'DONATE NOW',
  primary_cta_url text NOT NULL DEFAULT '/donate',
  secondary_cta_label text NOT NULL DEFAULT 'SEE OUR PROGRAMS',
  secondary_cta_url text NOT NULL DEFAULT '/projects',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_whats_inside (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  heading text NOT NULL DEFAULT 'What''s',
  highlight_word text NOT NULL DEFAULT 'Inside?',
  intro_html text NOT NULL,
  bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  image_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_venture_section (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  heading text NOT NULL DEFAULT 'Our',
  highlight_word text NOT NULL DEFAULT 'Greatest',
  subtitle text NOT NULL DEFAULT 'Venture',
  description text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_venture_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt text NOT NULL,
  caption text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_donation_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  price numeric,
  currency text DEFAULT 'USD',
  category text,
  stock_status text,
  cta_label text NOT NULL DEFAULT 'DONATE NOW',
  cta_url text NOT NULL DEFAULT '/donate',
  kind text NOT NULL DEFAULT 'product' CHECK (kind IN ('product', 'quick')),
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_story_posters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  video_url text,
  link_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  cover_image_url text NOT NULL,
  category text NOT NULL DEFAULT 'Blog',
  author_id uuid REFERENCES public.dq_authors(id) ON DELETE SET NULL,
  body_html text,
  read_time text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_promo_tiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  image_url text NOT NULL,
  link_url text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_quran_wiki_banner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text NOT NULL,
  image_url text NOT NULL,
  link_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_footer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  about_text text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  address text NOT NULL,
  copyright text NOT NULL,
  developer_credit text,
  social_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_cms_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  public_url text NOT NULL,
  folder text,
  kind text NOT NULL DEFAULT 'image',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.dq_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_type text NOT NULL,
  name text,
  email text,
  phone text,
  message text,
  payload jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.dq_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dq_admin_users
    WHERE auth_user_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin', 'editor')
  );
$$;

REVOKE ALL ON FUNCTION public.dq_is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dq_is_admin() TO authenticated;

ALTER TABLE public.dq_site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_navigation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_hero_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_whats_inside ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_venture_section ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_venture_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_donation_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_story_posters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_promo_tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_quran_wiki_banner ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_footer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_cms_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dq_public_read_nav" ON public.dq_navigation_links FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "dq_public_read_hero" ON public.dq_hero_content FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "dq_public_read_inside" ON public.dq_whats_inside FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "dq_public_read_venture_section" ON public.dq_venture_section FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "dq_public_read_venture_images" ON public.dq_venture_images FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "dq_public_read_products" ON public.dq_donation_products FOR SELECT TO anon, authenticated USING (is_active = true AND published = true);
CREATE POLICY "dq_public_read_stories" ON public.dq_story_posters FOR SELECT TO anon, authenticated USING (is_active = true AND published = true);
CREATE POLICY "dq_public_read_authors" ON public.dq_authors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "dq_public_read_articles" ON public.dq_articles FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "dq_public_read_promo" ON public.dq_promo_tiles FOR SELECT TO anon, authenticated USING (is_active = true AND published = true);
CREATE POLICY "dq_public_read_wiki" ON public.dq_quran_wiki_banner FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "dq_public_read_footer" ON public.dq_footer_settings FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "dq_public_read_settings" ON public.dq_site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "dq_public_read_media" ON public.dq_cms_media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "dq_public_insert_submissions" ON public.dq_form_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "dq_admin_all_nav" ON public.dq_navigation_links FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_hero" ON public.dq_hero_content FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_inside" ON public.dq_whats_inside FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_venture_section" ON public.dq_venture_section FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_venture_images" ON public.dq_venture_images FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_products" ON public.dq_donation_products FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_stories" ON public.dq_story_posters FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_authors" ON public.dq_authors FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_articles" ON public.dq_articles FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_promo" ON public.dq_promo_tiles FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_wiki" ON public.dq_quran_wiki_banner FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_footer" ON public.dq_footer_settings FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_settings" ON public.dq_site_settings FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_all_media" ON public.dq_cms_media FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_read_submissions" ON public.dq_form_submissions FOR SELECT TO authenticated USING (dq_is_admin());
CREATE POLICY "dq_admin_update_submissions" ON public.dq_form_submissions FOR UPDATE TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());
CREATE POLICY "dq_admin_delete_submissions" ON public.dq_form_submissions FOR DELETE TO authenticated USING (dq_is_admin());
CREATE POLICY "dq_admin_read_admin_users" ON public.dq_admin_users FOR SELECT TO authenticated USING (dq_is_admin());
CREATE POLICY "dq_admin_manage_admin_users" ON public.dq_admin_users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.dq_admin_users WHERE auth_user_id = auth.uid() AND is_active = true AND role IN ('owner', 'admin'))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.dq_admin_users WHERE auth_user_id = auth.uid() AND is_active = true AND role IN ('owner', 'admin'))
);

GRANT SELECT ON public.dq_navigation_links TO anon, authenticated;
GRANT SELECT ON public.dq_hero_content TO anon, authenticated;
GRANT SELECT ON public.dq_whats_inside TO anon, authenticated;
GRANT SELECT ON public.dq_venture_section TO anon, authenticated;
GRANT SELECT ON public.dq_venture_images TO anon, authenticated;
GRANT SELECT ON public.dq_donation_products TO anon, authenticated;
GRANT SELECT ON public.dq_story_posters TO anon, authenticated;
GRANT SELECT ON public.dq_authors TO anon, authenticated;
GRANT SELECT ON public.dq_articles TO anon, authenticated;
GRANT SELECT ON public.dq_promo_tiles TO anon, authenticated;
GRANT SELECT ON public.dq_quran_wiki_banner TO anon, authenticated;
GRANT SELECT ON public.dq_footer_settings TO anon, authenticated;
GRANT SELECT ON public.dq_site_settings TO anon, authenticated;
GRANT SELECT ON public.dq_cms_media TO anon, authenticated;
GRANT INSERT ON public.dq_form_submissions TO anon, authenticated;
GRANT ALL ON public.dq_navigation_links TO authenticated;
GRANT ALL ON public.dq_hero_content TO authenticated;
GRANT ALL ON public.dq_whats_inside TO authenticated;
GRANT ALL ON public.dq_venture_section TO authenticated;
GRANT ALL ON public.dq_venture_images TO authenticated;
GRANT ALL ON public.dq_donation_products TO authenticated;
GRANT ALL ON public.dq_story_posters TO authenticated;
GRANT ALL ON public.dq_authors TO authenticated;
GRANT ALL ON public.dq_articles TO authenticated;
GRANT ALL ON public.dq_promo_tiles TO authenticated;
GRANT ALL ON public.dq_quran_wiki_banner TO authenticated;
GRANT ALL ON public.dq_footer_settings TO authenticated;
GRANT ALL ON public.dq_site_settings TO authenticated;
GRANT ALL ON public.dq_cms_media TO authenticated;
GRANT SELECT, UPDATE, DELETE ON public.dq_form_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dq_admin_users TO authenticated;

INSERT INTO storage.buckets (id, name, public) VALUES ('dq-cms-media', 'dq-cms-media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "dq_public_read_storage" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'dq-cms-media');
CREATE POLICY "dq_admin_upload_storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dq-cms-media' AND dq_is_admin());
CREATE POLICY "dq_admin_update_storage" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'dq-cms-media' AND dq_is_admin()) WITH CHECK (bucket_id = 'dq-cms-media' AND dq_is_admin());
CREATE POLICY "dq_admin_delete_storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'dq-cms-media' AND dq_is_admin());
