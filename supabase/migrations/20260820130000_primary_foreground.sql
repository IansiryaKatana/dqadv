-- Text color used on gold / primary CTA surfaces (buttons, badges, play icons)

INSERT INTO public.dq_site_settings (key, value) VALUES
  ('primary_foreground', '#050505')
ON CONFLICT (key) DO NOTHING;
