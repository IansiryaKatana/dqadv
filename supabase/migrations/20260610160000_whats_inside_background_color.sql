-- Optional solid background behind the What's Inside cover image.
ALTER TABLE public.dq_whats_inside
  ADD COLUMN IF NOT EXISTS background_color text;
