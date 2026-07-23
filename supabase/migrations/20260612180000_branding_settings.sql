-- Logo and favicon URLs (empty = use built-in static defaults in the app)

INSERT INTO public.dq_site_settings (key, value) VALUES
  ('logo_light_url', '/images/logo-light.png'),
  ('logo_dark_url', '/images/logo-dark.png'),
  ('favicon_url', '/favicon.png')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
