-- Multilingual Quran PDF/audio downloads

CREATE TABLE IF NOT EXISTS public.dq_quran_editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  language text NOT NULL,
  featured_image_url text NOT NULL,
  pdf_url text,
  pdf_storage_path text,
  audio_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dq_quran_editions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dq_public_read_quran_editions" ON public.dq_quran_editions
  FOR SELECT TO anon, authenticated USING (is_active = true AND published = true);

CREATE POLICY "dq_admin_all_quran_editions" ON public.dq_quran_editions
  FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());

GRANT SELECT ON public.dq_quran_editions TO anon, authenticated;
GRANT ALL ON public.dq_quran_editions TO authenticated;
