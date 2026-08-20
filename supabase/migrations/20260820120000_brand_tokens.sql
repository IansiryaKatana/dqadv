-- Brand palette and font (empty font_file_url = load family from Google Fonts)

INSERT INTO public.dq_site_settings (key, value) VALUES
  ('primary_color', '#F4B000'),
  ('color_black', '#050505'),
  ('color_soft_black', '#111111'),
  ('color_cream', '#F8F3EA'),
  ('color_muted', '#6F6F6F'),
  ('color_border', '#E8E2D6'),
  ('font_family', 'Pliant'),
  ('font_file_url', '')
ON CONFLICT (key) DO NOTHING;
