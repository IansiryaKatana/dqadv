-- Reorder header navigation: Home, About, Quran, Books, Articles, Videos, Donate, Contact, Distribute

UPDATE public.dq_navigation_links SET sort_order = 1, updated_at = now() WHERE href = '/';
UPDATE public.dq_navigation_links SET sort_order = 2, updated_at = now() WHERE href = '/about';
UPDATE public.dq_navigation_links SET sort_order = 3, updated_at = now() WHERE href = '/quran';
UPDATE public.dq_navigation_links SET sort_order = 4, updated_at = now() WHERE href = '/books';
UPDATE public.dq_navigation_links SET sort_order = 5, updated_at = now() WHERE href = '/articles';
UPDATE public.dq_navigation_links SET sort_order = 6, updated_at = now() WHERE href = '/videos';
UPDATE public.dq_navigation_links SET sort_order = 7, updated_at = now() WHERE href = '/donate';
UPDATE public.dq_navigation_links SET sort_order = 8, updated_at = now() WHERE href = '/contact';
UPDATE public.dq_navigation_links SET sort_order = 9, updated_at = now() WHERE href = '/distribute';
