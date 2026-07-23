-- Homepage grid: 3 Qur'an Wiki articles replacing promo tiles 1–3
-- Run in Supabase SQL editor after 20260610170000_quran_wiki_articles.sql

INSERT INTO dq_quran_wiki_articles (id, slug, title, excerpt, cover_image_url, category, author_id, body_html, read_time, status, published_at) VALUES
  (
    'c0010001-0000-4000-8000-000000000001',
    'ramadan-guide',
    'Ramadan Guide',
    'Practical guidance for worship, fasting, and Qur''an reading throughout the blessed month of Ramadan.',
    'https://images.unsplash.com/photo-1519682577862-22b962b24b2b?w=600&h=400&fit=crop',
    'Ramadan', 'a0010001-0000-4000-8000-000000000002',
    '<p>Prepare for Ramadan with daily routines, taraweeh tips, and a simple plan to stay connected to the Qur''an all month long.</p>',
    '7 min read', 'published', '2026-06-10T10:00:00Z'
  ),
  (
    'c0010001-0000-4000-8000-000000000002',
    'quranic-reflections',
    'Qur''anic Reflections',
    'Short reflections on ayat that inspire mindfulness, gratitude, and deeper connection with Allah.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop',
    'Reflection', 'a0010001-0000-4000-8000-000000000001',
    '<p>Pause with selected verses, their meanings, and how they apply to everyday life and spiritual growth.</p>',
    '5 min read', 'published', '2026-06-09T10:00:00Z'
  ),
  (
    'c0010001-0000-4000-8000-000000000003',
    'donate-quran-project',
    'Donate Qur''an Project',
    'Learn how your donation places Mushaf copies in the hands of people seeking guidance worldwide.',
    'https://images.unsplash.com/photo-1609599006353-e6a9e0c121ff?w=600&h=400&fit=crop',
    'Giving', 'a0010001-0000-4000-8000-000000000002',
    '<p>Every contribution supports printing, shipping, and distribution so more communities receive the Book of Allah.</p>',
    '4 min read', 'published', '2026-06-08T10:00:00Z'
  )
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  excerpt = EXCLUDED.excerpt,
  cover_image_url = EXCLUDED.cover_image_url,
  category = EXCLUDED.category,
  author_id = EXCLUDED.author_id,
  body_html = EXCLUDED.body_html,
  read_time = EXCLUDED.read_time,
  status = EXCLUDED.status,
  published_at = EXCLUDED.published_at,
  updated_at = now();

UPDATE dq_promo_tiles
SET is_active = false, published = false
WHERE id IN (
  '50010001-0000-4000-8000-000000000001',
  '50010001-0000-4000-8000-000000000002',
  '50010001-0000-4000-8000-000000000003'
);
