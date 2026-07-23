-- Separate hero background images for tablet and mobile (desktop uses image_url).
ALTER TABLE public.dq_hero_content
  ADD COLUMN IF NOT EXISTS image_url_tablet text,
  ADD COLUMN IF NOT EXISTS image_url_mobile text;

COMMENT ON COLUMN public.dq_hero_content.image_url IS 'Desktop hero background (lg and up).';
COMMENT ON COLUMN public.dq_hero_content.image_url_tablet IS 'Tablet hero background (md to lg). Falls back to desktop when empty.';
COMMENT ON COLUMN public.dq_hero_content.image_url_mobile IS 'Mobile hero background (below md). Falls back to tablet, then desktop when empty.';
