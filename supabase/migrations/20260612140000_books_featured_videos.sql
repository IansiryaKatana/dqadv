-- Qur'an books (surah/parts) and featured videos

CREATE TABLE IF NOT EXISTS public.dq_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  cover_image_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Surah',
  author_id uuid REFERENCES public.dq_authors(id) ON DELETE SET NULL,
  body_html text NOT NULL DEFAULT '',
  read_time text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.dq_featured_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  thumbnail_url text NOT NULL DEFAULT '',
  video_type text NOT NULL DEFAULT 'youtube' CHECK (video_type IN ('upload', 'youtube')),
  video_url text NOT NULL,
  duration text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dq_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_featured_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dq_public_read_books" ON public.dq_books
  FOR SELECT TO anon, authenticated USING (status = 'published');

CREATE POLICY "dq_admin_all_books" ON public.dq_books
  FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());

CREATE POLICY "dq_public_read_featured_videos" ON public.dq_featured_videos
  FOR SELECT TO anon, authenticated USING (is_active = true AND published = true);

CREATE POLICY "dq_admin_all_featured_videos" ON public.dq_featured_videos
  FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());

GRANT SELECT ON public.dq_books TO anon, authenticated;
GRANT ALL ON public.dq_books TO authenticated;
GRANT SELECT ON public.dq_featured_videos TO anon, authenticated;
GRANT ALL ON public.dq_featured_videos TO authenticated;

-- Admin read all form submissions
CREATE POLICY "dq_admin_read_form_submissions" ON public.dq_form_submissions
  FOR SELECT TO authenticated USING (dq_is_admin());

GRANT SELECT ON public.dq_form_submissions TO authenticated;
