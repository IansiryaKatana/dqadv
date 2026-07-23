-- Hide Articles from header navigation (keep in footer)

UPDATE public.dq_navigation_links
SET show_in_header = false, updated_at = now()
WHERE href = '/articles';
