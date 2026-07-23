-- Qur'an Wiki articles (article-style CMS, mirrors dq_articles)
CREATE TABLE public.dq_quran_wiki_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL,
  cover_image_url text NOT NULL,
  category text NOT NULL DEFAULT 'Wiki',
  author_id uuid REFERENCES public.dq_authors(id) ON DELETE SET NULL,
  body_html text,
  read_time text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.dq_quran_wiki_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dq_public_read_wiki_articles" ON public.dq_quran_wiki_articles
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "dq_admin_all_wiki_articles" ON public.dq_quran_wiki_articles
  FOR ALL TO authenticated
  USING (dq_is_admin())
  WITH CHECK (dq_is_admin());

GRANT SELECT ON public.dq_quran_wiki_articles TO anon, authenticated;
