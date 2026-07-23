-- Remove deprecated "Order Free Qurans" nav item and update site branding copy

UPDATE public.dq_navigation_links
SET is_active = false, show_in_header = false, show_in_footer = false, updated_at = now()
WHERE href = '/order-free-qurans';

UPDATE public.dq_navigation_links SET sort_order = 4, updated_at = now() WHERE href = '/distribute';
UPDATE public.dq_navigation_links SET sort_order = 5, updated_at = now() WHERE href = '/quran';
UPDATE public.dq_navigation_links SET sort_order = 6, updated_at = now() WHERE href = '/books';
UPDATE public.dq_navigation_links SET sort_order = 7, updated_at = now() WHERE href = '/articles';
UPDATE public.dq_navigation_links SET sort_order = 8, updated_at = now() WHERE href = '/videos';
UPDATE public.dq_navigation_links SET sort_order = 9, updated_at = now() WHERE href = '/contact';

UPDATE public.dq_site_settings
SET value = 'Donate Quran', updated_at = now()
WHERE key = 'site_name';

UPDATE public.dq_footer_settings
SET about_text = replace(about_text, 'dq is', 'Donate Quran is'),
    updated_at = now()
WHERE about_text LIKE 'dq is%';
