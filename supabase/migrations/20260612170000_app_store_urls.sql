-- Official Donate Quran mobile app store links

INSERT INTO public.dq_site_settings (key, value) VALUES
  ('app_store_url', 'https://apps.apple.com/us/app/donate-quran/id1080811194'),
  ('play_store_url', 'https://play.google.com/store/apps/details?id=com.donatequran')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
