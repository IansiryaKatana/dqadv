-- Optional 16:9 cover for book listing cards (detail page keeps 1920×300 banner)

ALTER TABLE public.dq_books
  ADD COLUMN IF NOT EXISTS card_cover_image_url text NOT NULL DEFAULT '';