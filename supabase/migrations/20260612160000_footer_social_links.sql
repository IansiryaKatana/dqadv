-- Update footer social media links to official Donate Quran profiles

UPDATE public.dq_footer_settings
SET
  social_links = '[
    {"label": "Facebook",  "href": "https://www.facebook.com/DonateQuran"},
    {"label": "Instagram", "href": "https://www.instagram.com/donatequran/"},
    {"label": "X",         "href": "https://x.com/DonateQuran"},
    {"label": "YouTube",   "href": "https://www.youtube.com/channel/UCupzcEvI3cDAsyZV7uuNLvQ"}
  ]'::jsonb,
  updated_at = now()
WHERE is_active = true;
