-- =============================================================================
-- DQ Website CMS — Full seed data
-- Run AFTER: supabase/migrations/20260610120000_dq_cms_schema.sql
-- Based on DQ WEBSITE 101-1.png reference mockup
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- Site settings
-- -----------------------------------------------------------------------------
INSERT INTO dq_site_settings (key, value) VALUES
  ('site_name', 'Donate Quran'),
  ('primary_color', '#F4B000'),
  ('primary_foreground', '#050505'),
  ('color_black', '#050505'),
  ('color_soft_black', '#111111'),
  ('color_cream', '#F8F3EA'),
  ('color_muted', '#6F6F6F'),
  ('color_border', '#E8E2D6'),
  ('font_family', 'Pliant'),
  ('font_file_url', ''),
  ('donate_url', '/donate'),
  ('app_store_url', 'https://apps.apple.com/us/app/donate-quran/id1080811194'),
  ('play_store_url', 'https://play.google.com/store/apps/details?id=com.donatequran'),
  ('logo_light_url', '/images/logo-light.png'),
  ('logo_dark_url', '/images/logo-dark.png'),
  ('favicon_url', '/favicon.png'),
  ('home_quran_order_image_url', '/images/quran-product.jpg'),
  ('tagline', 'Faith. Knowledge. Impact.'),
  ('meta_description', 'Donate Qur''an — placing sacred knowledge in hands worldwide through donation, distribution, and education.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- -----------------------------------------------------------------------------
-- Navigation links (10)
-- -----------------------------------------------------------------------------
INSERT INTO dq_navigation_links (id, label, href, sort_order, is_active, show_in_header, show_in_footer, footer_group) VALUES
  ('10010001-0000-4000-8000-000000000001', 'Home',               '/',                  1,  true, true, true, 'quick_links'),
  ('10010001-0000-4000-8000-000000000002', 'About us',           '/about',             2,  true, true, true, 'quick_links'),
  ('10010001-0000-4000-8000-000000000003', 'Donate',             '/donate',            7,  true, true, true, 'quick_links'),
  ('10010001-0000-4000-8000-000000000004', 'Order Free Qurans',  '/order-free-qurans', 4,  false, false, false, 'quick_links'),
  ('10010001-0000-4000-8000-000000000005', 'Distribute',         '/distribute',        9,  true, true, true, 'quick_links'),
  ('10010001-0000-4000-8000-000000000006', 'Quran',              '/quran',             3,  true, true, true, 'resources'),
  ('10010001-0000-4000-8000-000000000007', 'Books',              '/books',             4,  true, true, true, 'resources'),
  ('10010001-0000-4000-8000-000000000008', 'Articles',           '/articles',          5,  true, false, true, 'resources'),
  ('10010001-0000-4000-8000-000000000009', 'Videos',             '/videos',            6,  true, true, true, 'resources'),
  ('10010001-0000-4000-8000-000000000010', 'Contact Us',         '/contact',           8,  true, true, true, 'quick_links')
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label, href = EXCLUDED.href, sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  show_in_header = EXCLUDED.show_in_header, show_in_footer = EXCLUDED.show_in_footer,
  footer_group = EXCLUDED.footer_group, updated_at = now();

UPDATE dq_navigation_links
SET is_active = false, updated_at = now()
WHERE id NOT IN (
  '10010001-0000-4000-8000-000000000001',
  '10010001-0000-4000-8000-000000000002',
  '10010001-0000-4000-8000-000000000003',
  '10010001-0000-4000-8000-000000000005',
  '10010001-0000-4000-8000-000000000006',
  '10010001-0000-4000-8000-000000000007',
  '10010001-0000-4000-8000-000000000008',
  '10010001-0000-4000-8000-000000000009',
  '10010001-0000-4000-8000-000000000010'
);

-- -----------------------------------------------------------------------------
-- Hero (singleton)
-- -----------------------------------------------------------------------------
INSERT INTO dq_hero_content (id, title_line1, title_line2, title_line3, highlight_word, description, image_url, primary_cta_label, primary_cta_url, secondary_cta_label, secondary_cta_url, is_active) VALUES (
  '11111111-1111-1111-1111-111111111101',
  'Faith.', 'Knowledge.', 'Impact.', 'Impact.',
  'Join us in spreading the light of the Qur''an worldwide. Every donation helps deliver sacred knowledge to hearts that seek guidance, hope, and connection with Allah.',
  '/images/hero-quran.jpg',
  'DONATE NOW', '/donate',
  'WATCH OUR STORY', '/stories',
  true
) ON CONFLICT (id) DO UPDATE SET
  title_line1 = EXCLUDED.title_line1, title_line2 = EXCLUDED.title_line2, title_line3 = EXCLUDED.title_line3,
  highlight_word = EXCLUDED.highlight_word, description = EXCLUDED.description, image_url = EXCLUDED.image_url,
  primary_cta_label = EXCLUDED.primary_cta_label, primary_cta_url = EXCLUDED.primary_cta_url,
  secondary_cta_label = EXCLUDED.secondary_cta_label, secondary_cta_url = EXCLUDED.secondary_cta_url,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- What's Inside (singleton)
-- -----------------------------------------------------------------------------
INSERT INTO dq_whats_inside (id, heading, highlight_word, intro_html, bullets, image_url, background_color, is_active) VALUES (
  '11111111-1111-1111-1111-111111111102',
  'What''s', 'Inside?',
  '<p>Each Qur''an package we distribute is thoughtfully prepared to help recipients read, understand, and reflect. Premium print quality meets practical learning tools — a gift designed to last a lifetime.</p>',
  '[
    "Clear Arabic Text with Uthmani script",
    "English Translation for daily understanding",
    "Transliteration for Beginners",
    "Premium Quality Paper and durable binding",
    "Bookmark and reading guide included",
    "QR code linking to audio recitation resources",
    "Compact size ideal for travel and study",
    "Elegant black-and-gold cover design"
  ]'::jsonb,
  '/images/quran-product.jpg',
  '#FAF7F1',
  true
) ON CONFLICT (id) DO UPDATE SET
  heading = EXCLUDED.heading, highlight_word = EXCLUDED.highlight_word,
  intro_html = EXCLUDED.intro_html, bullets = EXCLUDED.bullets, image_url = EXCLUDED.image_url,
  background_color = EXCLUDED.background_color,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- Venture section (singleton)
-- -----------------------------------------------------------------------------
INSERT INTO dq_venture_section (id, heading, highlight_word, subtitle, description, is_active) VALUES (
  '11111111-1111-1111-1111-111111111103',
  'Our', 'Greatest', 'Venture',
  'From remote villages to bustling cities, your generosity places the Qur''an in hands eager to learn. These are real moments of distribution — diverse communities united by the joy of receiving Allah''s word.',
  true
) ON CONFLICT (id) DO UPDATE SET
  heading = EXCLUDED.heading, highlight_word = EXCLUDED.highlight_word,
  subtitle = EXCLUDED.subtitle, description = EXCLUDED.description, updated_at = now();

-- -----------------------------------------------------------------------------
-- Venture gallery images (8)
-- -----------------------------------------------------------------------------
INSERT INTO dq_venture_images (id, image_url, alt, caption, sort_order, is_active) VALUES
  ('20010001-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1564769662533-4f00a747b231?w=400&h=500&fit=crop', 'Child receiving a Qur''an',           'A young boy receives his first Qur''an copy',              1, true),
  ('20010001-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1591604466376-0621a4a3f404?w=400&h=500&fit=crop', 'Community distribution event',       'Volunteers hand out Qur''ans at a local masjid',           2, true),
  ('20010001-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1542816417-0983c9c9ad14?w=400&h=500&fit=crop', 'Students with Qur''an copies',       'Students proudly hold their new Mushaf editions',          3, true),
  ('20010001-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=400&h=500&fit=crop', 'Family reading together',            'A family gathers to read and reflect together',            4, true),
  ('20010001-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1585036156171-3841649478f7?w=400&h=500&fit=crop', 'Global outreach distribution',       'Qur''ans prepared for international shipment',             5, true),
  ('20010001-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=500&fit=crop', 'Women holding donated Qur''ans',     'Sisters celebrate receiving accessible translations',      6, true),
  ('20010001-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=500&fit=crop', 'Youth outreach program',             'Young learners at a weekend Qur''an circle',               7, true),
  ('20010001-0000-4000-8000-000000000008', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', 'Elder receiving a Qur''an gift',     'An elder smiles while holding a donated copy',             8, true)
ON CONFLICT (id) DO UPDATE SET
  image_url = EXCLUDED.image_url, alt = EXCLUDED.alt, caption = EXCLUDED.caption,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active;

-- -----------------------------------------------------------------------------
-- Donation products — product cards (8)
-- -----------------------------------------------------------------------------
INSERT INTO dq_donation_products (id, slug, title, description, image_url, price, currency, category, stock_status, cta_label, cta_url, kind, sort_order, is_active, published) VALUES
  ('30010001-0000-4000-8000-000000000001', 'single-quran-donation',    'Single Qur''an Donation',    'Sponsor one beautifully bound Qur''an for someone in need.',                          'https://images.unsplash.com/photo-1609599006353-e6a9e0c121ff?w=600&h=400&fit=crop',  10.00,  'GBP', 'Donation',  'Available',   'DONATE', '/donate/single',    'product', 1, true, true),
  ('30010001-0000-4000-8000-000000000002', 'family-quran-package',     'Family Qur''an Package',     'Provide four Qur''ans for a household to read and learn together.',                    'https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&h=400&fit=crop',  40.00,  'GBP', 'Package',   'In Stock',    'DONATE', '/donate/family',    'product', 2, true, true),
  ('30010001-0000-4000-8000-000000000003', 'quran-app',                'The Qur''an App',            'Support our digital platform with translation, audio, and study tools.',              'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&h=400&fit=crop',   5.00,  'GBP', 'Digital',   'Free Access', 'DONATE', '/donate/app',       'product', 3, true, true),
  ('30010001-0000-4000-8000-000000000004', 'bulk-donation',            'Bulk Donation',              'Sponsor a full pallet of Qur''ans for mass community distribution.',                  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&h=400&fit=crop', 500.00,  'GBP', 'Bulk',      'By Request',  'DONATE', '/donate/bulk',      'product', 4, true, true),
  ('30010001-0000-4000-8000-000000000005', 'student-sponsorship',      'Student Sponsorship',        'Fund Qur''ans for students in schools and madrasahs.',                                'https://images.unsplash.com/photo-1542816417-0983c9c9ad14?w=600&h=400&fit=crop',    25.00,  'GBP', 'Education', 'Available',   'DONATE', '/donate/students',  'product', 5, true, true),
  ('30010001-0000-4000-8000-000000000006', 'monthly-subscription',     'Monthly Subscription',       'Give monthly and sustain ongoing Qur''an distribution year-round.',                   'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',   15.00,  'GBP', 'Recurring', 'Active',      'DONATE', '/donate/monthly',   'product', 6, true, true),
  ('30010001-0000-4000-8000-000000000007', 'ramadan-special-pack',     'Ramadan Special Pack',       'Seasonal bundle: Qur''ans plus Ramadan reading guides for families.',                 'https://images.unsplash.com/photo-1519682577862-22b962b24b2b?w=600&h=400&fit=crop',   35.00,  'GBP', 'Seasonal',  'Limited',     'DONATE', '/donate/ramadan',   'product', 7, true, true),
  ('30010001-0000-4000-8000-000000000008', 'sadaqah-jariyah-fund',     'Sadaqah Jariyah Fund',       'Contribute to ongoing charity — every Qur''an keeps giving reward.',                  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop',  50.00,  'GBP', 'Fund',      'Open',        'DONATE', '/donate/sadaqah',   'product', 8, true, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image_url = EXCLUDED.image_url,
  price = EXCLUDED.price, category = EXCLUDED.category, stock_status = EXCLUDED.stock_status,
  cta_label = EXCLUDED.cta_label, cta_url = EXCLUDED.cta_url, kind = EXCLUDED.kind,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, published = EXCLUDED.published,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- Quick donation campaigns (8)
-- -----------------------------------------------------------------------------
INSERT INTO dq_donation_products (id, slug, title, description, image_url, price, currency, category, stock_status, cta_label, cta_url, kind, sort_order, is_active, published) VALUES
  ('31010001-0000-4000-8000-000000000001', 'flagship-sponsorship',         'The Qur''an Project — Flagship Sponsorship',  'Become a flagship partner funding large-scale distribution campaigns across multiple regions.',  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=500&fit=crop', NULL, 'GBP', 'Campaign', 'Open', 'DONATE NOW', '/donate/flagship',     'quick', 1, true, true),
  ('31010001-0000-4000-8000-000000000002', 'quran-distribution-hardcopy',  'Qur''an Distribution (Hardcopy)',             'Fund printing and delivery of physical Mushaf copies to underserved communities.',               'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=500&fit=crop', NULL, 'GBP', 'Campaign', 'Open', 'DONATE NOW', '/donate/distribution', 'quick', 2, true, true),
  ('31010001-0000-4000-8000-000000000003', 'publishing-translation',       'Publishing & Translation Support',            'Help produce new translations and editions for non-Arabic speaking communities.',              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop', NULL, 'GBP', 'Campaign', 'Open', 'DONATE NOW', '/donate/publishing',   'quick', 3, true, true),
  ('31010001-0000-4000-8000-000000000004', 'mushaf-print-fund',            'Mushaf Print Fund',                           'Sponsor a print run of premium Mushaf editions for waiting communities.',                      'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&h=500&fit=crop', NULL, 'GBP', 'Campaign', 'Open', 'DONATE NOW', '/donate/mushaf',       'quick', 4, true, true),
  ('31010001-0000-4000-8000-000000000005', 'marketing-outreach',           'Marketing & Outreach',                        'Expand our reach through campaigns, events, and educational content worldwide.',               'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop', NULL, 'GBP', 'Campaign', 'Open', 'DONATE NOW', '/donate/marketing',    'quick', 5, true, true),
  ('31010001-0000-4000-8000-000000000006', 'prison-outreach',              'Prison & Institutional Outreach',           'Deliver Qur''ans to correctional facilities and institutions seeking guidance.',               'https://images.unsplash.com/photo-1488523785076-6ef0109c1b44?w=800&h=500&fit=crop', NULL, 'GBP', 'Campaign', 'Open', 'DONATE NOW', '/donate/prison',       'quick', 6, true, true),
  ('31010001-0000-4000-8000-000000000007', 'refugee-relief',               'Refugee Relief Qur''an Fund',                 'Provide Qur''ans to displaced families rebuilding their lives.',                               'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop', NULL, 'GBP', 'Campaign', 'Open', 'DONATE NOW', '/donate/refugee',      'quick', 7, true, true),
  ('31010001-0000-4000-8000-000000000008', 'new-muslim-welcome-kit',       'New Muslim Welcome Kit',                      'Fund welcome packages with Qur''an, transliteration guide, and learning resources.',             'https://images.unsplash.com/photo-1609599006353-e6a9e0c121ff?w=800&h=500&fit=crop', NULL, 'GBP', 'Campaign', 'Open', 'DONATE NOW', '/donate/welcome-kit',  'quick', 8, true, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description, image_url = EXCLUDED.image_url,
  cta_label = EXCLUDED.cta_label, cta_url = EXCLUDED.cta_url, kind = EXCLUDED.kind,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, published = EXCLUDED.published,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- Story posters / video carousel (8)
-- -----------------------------------------------------------------------------
INSERT INTO dq_story_posters (id, title, image_url, video_url, link_url, sort_order, is_active, published) VALUES
  ('40010001-0000-4000-8000-000000000001', 'Reward that lives on.',                  'https://images.unsplash.com/photo-1609599006353-e6a9e0c121ff?w=400&h=700&fit=crop', NULL, '/stories/reward-that-lives-on',           1, true, true),
  ('40010001-0000-4000-8000-000000000002', 'Open a Qur''an, Open a Heart.',          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=700&fit=crop', NULL, '/stories/open-a-heart',                   2, true, true),
  ('40010001-0000-4000-8000-000000000003', 'Every Qur''an Donated Keeps Giving.',    'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=700&fit=crop', NULL, '/stories/keeps-giving',                   3, true, true),
  ('40010001-0000-4000-8000-000000000004', 'What Happens After You Donate?',         'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=700&fit=crop', NULL, '/stories/after-you-donate',               4, true, true),
  ('40010001-0000-4000-8000-000000000005', 'A Gift from Australia',                  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=700&fit=crop', NULL, '/stories/gift-from-australia',            5, true, true),
  ('40010001-0000-4000-8000-000000000006', 'The Joy of Learning',                    'https://images.unsplash.com/photo-1542816417-0983c9c9ad14?w=400&h=700&fit=crop', NULL, '/stories/joy-of-learning',                6, true, true),
  ('40010001-0000-4000-8000-000000000007', 'Building a Community Library',           'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&h=700&fit=crop', NULL, '/stories/community-library',              7, true, true),
  ('40010001-0000-4000-8000-000000000008', 'Your Impact in Africa',                  'https://images.unsplash.com/photo-1564769662533-4f00a747b231?w=400&h=700&fit=crop', NULL, '/stories/impact-in-africa',               8, true, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, image_url = EXCLUDED.image_url, video_url = EXCLUDED.video_url,
  link_url = EXCLUDED.link_url, sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active, published = EXCLUDED.published;

-- -----------------------------------------------------------------------------
-- Authors (4 — shared across 8 articles)
-- -----------------------------------------------------------------------------
INSERT INTO dq_authors (id, name, avatar_url, bio) VALUES
  ('a0010001-0000-4000-8000-000000000001', 'Donate Quran Staff',      NULL, 'Official Donate Qur''an editorial team.'),
  ('a0010001-0000-4000-8000-000000000002', 'Amina Hassan',  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop', 'Writer and community educator focused on daily Qur''an practice.'),
  ('a0010001-0000-4000-8000-000000000003', 'Omar Farouk',   'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop', 'Impact correspondent covering global distribution stories.'),
  ('a0010001-0000-4000-8000-000000000004', 'Fatima Ali',    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop', 'Volunteer coordinator and outreach specialist.')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url, bio = EXCLUDED.bio;

-- -----------------------------------------------------------------------------
-- Blog articles (8)
-- -----------------------------------------------------------------------------
INSERT INTO dq_articles (id, slug, title, excerpt, cover_image_url, category, author_id, body_html, read_time, status, published_at) VALUES
  (
    'b0010001-0000-4000-8000-000000000001',
    'importance-reading-quran-daily',
    'The Importance of Reading the Qur''an Daily',
    'Discover how a few minutes of daily recitation can transform your spiritual routine and deepen your connection with Allah.',
    'https://images.unsplash.com/photo-1609599006353-e6a9e0c121ff?w=800&h=500&fit=crop',
    'NEW', 'a0010001-0000-4000-8000-000000000002',
    '<p>Establishing a daily Qur''an habit builds consistency, reflection, and barakah in your day. Start small — even one ayah with meaning counts.</p>',
    '5 min read', 'published', '2026-01-10T10:00:00Z'
  ),
  (
    'b0010001-0000-4000-8000-000000000002',
    'join-our-volunteer-program',
    'Why You Should Join Our Volunteer Program',
    'From packing Qur''ans to community outreach, volunteers are the heartbeat of our mission. Here is how you can get involved.',
    'https://images.unsplash.com/photo-1589998059171-988d887df646?w=800&h=500&fit=crop',
    'NEW', 'a0010001-0000-4000-8000-000000000004',
    '<p>Volunteering with Donate Quran connects you directly to families receiving their first copy. No experience needed — just compassion and commitment.</p>',
    '6 min read', 'published', '2026-01-12T10:00:00Z'
  ),
  (
    'b0010001-0000-4000-8000-000000000003',
    'teaching-children-the-quran',
    'Teaching Children the Qur''an',
    'Practical tips for parents and educators introducing young hearts to the Book of Allah.',
    'https://images.unsplash.com/photo-1542816417-0983c9c9ad14?w=800&h=500&fit=crop',
    'Education', 'a0010001-0000-4000-8000-000000000002',
    '<p>Make learning joyful: short sessions, visual aids, transliteration, and celebrating small milestones keep children engaged.</p>',
    '7 min read', 'published', '2026-01-18T10:00:00Z'
  ),
  (
    'b0010001-0000-4000-8000-000000000004',
    'history-of-quran-manuscripts',
    'The History of Qur''an Manuscripts',
    'Explore how the preservation of the Qur''an spans centuries of careful transmission and beautiful calligraphy.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop',
    'History', 'a0010001-0000-4000-8000-000000000001',
    '<p>From oral tradition to written Mushaf, the Qur''an''s preservation is a miracle Muslims have safeguarded for generations.</p>',
    '8 min read', 'published', '2026-01-22T10:00:00Z'
  ),
  (
    'b0010001-0000-4000-8000-000000000005',
    'how-donations-are-distributed',
    'How Your Donations Are Distributed',
    'Follow the journey from your generous gift to a Qur''an placed in the hands of someone ready to learn.',
    'https://images.unsplash.com/photo-1488523785076-6ef0109c1b44?w=800&h=500&fit=crop',
    'Impact', 'a0010001-0000-4000-8000-000000000003',
    '<p>Every pound is allocated to printing, logistics, and local partners who know their communities best. Transparency is our promise.</p>',
    '6 min read', 'published', '2026-02-01T10:00:00Z'
  ),
  (
    'b0010001-0000-4000-8000-000000000006',
    'benefits-of-hifz',
    'The Benefits of Hifz',
    'Memorizing the Qur''an is a lifelong journey — here are spiritual, cognitive, and communal rewards of committing it to heart.',
    'https://images.unsplash.com/photo-1519682577862-22b962b24b2b?w=800&h=500&fit=crop',
    'Spirituality', 'a0010001-0000-4000-8000-000000000002',
    '<p>Hifz strengthens memory, discipline, and closeness to Allah. Whether you memorize one surah or the entire Book, every ayah matters.</p>',
    '9 min read', 'published', '2026-02-08T10:00:00Z'
  ),
  (
    'b0010001-0000-4000-8000-000000000007',
    'ramadan-giving-guide',
    'Ramadan Giving Guide',
    'Maximize your sadaqah this Ramadan with purposeful giving — from single copies to community sponsorship.',
    'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=500&fit=crop',
    'Ramadan', 'a0010001-0000-4000-8000-000000000001',
    '<p>Ramadan multiplies reward. Consider sponsoring families, funding print runs, or setting up a recurring gift for year-round impact.</p>',
    '5 min read', 'published', '2026-02-15T10:00:00Z'
  ),
  (
    'b0010001-0000-4000-8000-000000000008',
    'success-stories-from-the-field',
    'Success Stories from the Field',
    'Real testimonies from recipients and volunteers who witnessed the power of a donated Qur''an.',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop',
    'Stories', 'a0010001-0000-4000-8000-000000000003',
    '<p>From a village in West Africa to a classroom in Southeast Asia, these stories show how one donation creates ripples of knowledge.</p>',
    '7 min read', 'published', '2026-02-22T10:00:00Z'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, cover_image_url = EXCLUDED.cover_image_url,
  category = EXCLUDED.category, author_id = EXCLUDED.author_id, body_html = EXCLUDED.body_html,
  read_time = EXCLUDED.read_time, status = EXCLUDED.status, published_at = EXCLUDED.published_at,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- Promo tiles (8)
-- -----------------------------------------------------------------------------
INSERT INTO dq_promo_tiles (id, title, image_url, link_url, sort_order, is_active, published) VALUES
  ('50010001-0000-4000-8000-000000000001', 'Ramadan Guide',              'https://images.unsplash.com/photo-1519682577862-22b962b24b2b?w=600&h=400&fit=crop', '/guides/ramadan',           1, true, true),
  ('50010001-0000-4000-8000-000000000002', 'Qur''anic Reflections',      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop', '/reflections',              2, true, true),
  ('50010001-0000-4000-8000-000000000003', 'Donate Qur''an Project',     'https://images.unsplash.com/photo-1609599006353-e6a9e0c121ff?w=600&h=400&fit=crop', '/donate',                   3, true, true),
  ('50010001-0000-4000-8000-000000000004', 'Volunteer With Us',         'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600&h=400&fit=crop', '/volunteer',                4, true, true),
  ('50010001-0000-4000-8000-000000000005', 'New Muslim Resources',       'https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&h=400&fit=crop', '/resources/new-muslims',    5, true, true),
  ('50010001-0000-4000-8000-000000000006', 'Distribution Partners',      'https://images.unsplash.com/photo-1488523785076-6ef0109c1b44?w=600&h=400&fit=crop', '/partners',                 6, true, true),
  ('50010001-0000-4000-8000-000000000007', 'Monthly Giving',             'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop', '/donate/monthly',           7, true, true),
  ('50010001-0000-4000-8000-000000000008', 'Impact Report 2025',         'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop', '/impact/2025',              8, true, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url,
  sort_order = EXCLUDED.sort_order, is_active = EXCLUDED.is_active, published = EXCLUDED.published;

-- -----------------------------------------------------------------------------
-- Qur'an Wiki banner (singleton)
-- -----------------------------------------------------------------------------
INSERT INTO dq_quran_wiki_banner (id, title, subtitle, image_url, link_url, is_active) VALUES (
  '11111111-1111-1111-1111-111111111104',
  'Qur''an Wiki',
  'LEARN, STUDY AND REFLECT',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=400&fit=crop',
  'https://www.quran-wiki.com/',
  true
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title, subtitle = EXCLUDED.subtitle,
  image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url, updated_at = now();

-- -----------------------------------------------------------------------------
-- Qur'an Wiki articles — homepage grid (replaces promo tiles 1–3)
-- -----------------------------------------------------------------------------
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
  slug = EXCLUDED.slug, title = EXCLUDED.title, excerpt = EXCLUDED.excerpt,
  cover_image_url = EXCLUDED.cover_image_url, category = EXCLUDED.category,
  author_id = EXCLUDED.author_id, body_html = EXCLUDED.body_html, read_time = EXCLUDED.read_time,
  status = EXCLUDED.status, published_at = EXCLUDED.published_at, updated_at = now();

-- Retire the three promo tiles now shown as Qur'an Wiki grid cards
UPDATE dq_promo_tiles
SET is_active = false, published = false
WHERE id IN (
  '50010001-0000-4000-8000-000000000001',
  '50010001-0000-4000-8000-000000000002',
  '50010001-0000-4000-8000-000000000003'
);

-- -----------------------------------------------------------------------------
-- Footer settings (singleton)
-- -----------------------------------------------------------------------------
INSERT INTO dq_footer_settings (id, about_text, email, phone, address, copyright, developer_credit, social_links, is_active) VALUES (
  '11111111-1111-1111-1111-111111111105',
  'Donate Quran is a faith-based charity dedicated to placing the Qur''an in the hands of people worldwide through donation, distribution, and education.',
  'info@donatequran.org',
  '',
  '',
  '© 2026 Donate Qur''an. All rights reserved.',
  'Developed with care for the Ummah',
  '[
    {"label": "Facebook",  "href": "https://www.facebook.com/DonateQuran"},
    {"label": "Instagram", "href": "https://www.instagram.com/donatequran/"},
    {"label": "X",         "href": "https://x.com/DonateQuran"},
    {"label": "YouTube",   "href": "https://www.youtube.com/channel/UCupzcEvI3cDAsyZV7uuNLvQ"}
  ]'::jsonb,
  true
) ON CONFLICT (id) DO UPDATE SET
  about_text = EXCLUDED.about_text, email = EXCLUDED.email, phone = EXCLUDED.phone,
  address = EXCLUDED.address, copyright = EXCLUDED.copyright,
  developer_credit = EXCLUDED.developer_credit, social_links = EXCLUDED.social_links,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- CMS media registry (8 — tracks uploaded / referenced assets)
-- -----------------------------------------------------------------------------
INSERT INTO dq_cms_media (id, filename, public_url, folder, kind, metadata) VALUES
  ('60010001-0000-4000-8000-000000000001', 'hero-quran.jpg',       '/images/hero-quran.jpg',                                                          'hero',       'image', '{"section":"hero"}'::jsonb),
  ('60010001-0000-4000-8000-000000000002', 'quran-product.jpg',    '/images/quran-product.jpg',                                                       'products',   'image', '{"section":"whats_inside"}'::jsonb),
  ('60010001-0000-4000-8000-000000000003', 'venture-01.jpg',       'https://images.unsplash.com/photo-1564769662533-4f00a747b231?w=400&h=500&fit=crop', 'venture',    'image', '{"sort_order":1}'::jsonb),
  ('60010001-0000-4000-8000-000000000004', 'story-reward.jpg',     'https://images.unsplash.com/photo-1609599006353-e6a9e0c121ff?w=400&h=700&fit=crop', 'stories',    'image', '{"sort_order":1}'::jsonb),
  ('60010001-0000-4000-8000-000000000005', 'product-single.jpg',   'https://images.unsplash.com/photo-1609599006353-e6a9e0c121ff?w=600&h=400&fit=crop', 'products',   'image', '{"slug":"single-quran-donation"}'::jsonb),
  ('60010001-0000-4000-8000-000000000006', 'blog-daily-quran.jpg', 'https://images.unsplash.com/photo-1609599006353-e6a9e0c121ff?w=800&h=500&fit=crop', 'articles',   'image', '{"slug":"importance-reading-quran-daily"}'::jsonb),
  ('60010001-0000-4000-8000-000000000007', 'promo-ramadan.jpg',    'https://images.unsplash.com/photo-1519682577862-22b962b24b2b?w=600&h=400&fit=crop', 'promo',      'image', '{"sort_order":1}'::jsonb),
  ('60010001-0000-4000-8000-000000000008', 'wiki-banner.jpg',      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1400&h=400&fit=crop', 'wiki',       'image', '{"section":"quran_wiki"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  filename = EXCLUDED.filename, public_url = EXCLUDED.public_url,
  folder = EXCLUDED.folder, kind = EXCLUDED.kind, metadata = EXCLUDED.metadata;

COMMIT;

-- =============================================================================
-- After running this seed:
-- 1. Create a Supabase Auth user in Dashboard → Authentication → Users
-- 2. Link them as admin:
--
--    INSERT INTO dq_admin_users (auth_user_id, email, role)
--    VALUES ('<auth-user-uuid>', 'admin@donatequran.org', 'owner');
--
-- 3. Upload local images to Storage bucket `dq-cms-media` if replacing Unsplash URLs
-- =============================================================================
