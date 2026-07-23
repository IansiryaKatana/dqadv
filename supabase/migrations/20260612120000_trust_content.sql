-- Trust & mission content blocks (About, Donate enrichment)

CREATE TABLE IF NOT EXISTS public.dq_trust_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  title text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dq_trust_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dq_public_read_trust_blocks" ON public.dq_trust_blocks
  FOR SELECT TO anon, authenticated USING (is_active = true);

CREATE POLICY "dq_admin_all_trust_blocks" ON public.dq_trust_blocks
  FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());

GRANT SELECT ON public.dq_trust_blocks TO anon, authenticated;
GRANT ALL ON public.dq_trust_blocks TO authenticated;

INSERT INTO public.dq_trust_blocks (key, title, body_html, extra, sort_order) VALUES
(
  'hundred_percent_promise',
  'We are a 100% donation charity',
  '<p>When we started Donate Quran, we made a bold promise to the general public that <strong>100% of their donations</strong> would go directly to printing copies of the Quran in English. As a charity, we would find other means to cover our operating costs.</p><p>We depend on private donors, foundations and sponsors to cover everything from staff salaries to office systems, office rent and supplies. These donors are very dedicated; their investment fuels our long-term mission, which is growing in size. Our mission is to continue using 100% of public donations for printing copies of the Quran.</p><p>Every donation can make a difference when giving towards this project. Please take into consideration that we have not compromised on the quality and standard in producing this publication.</p>',
  '{}'::jsonb,
  1
),
(
  'quality_standards',
  'Quality you can trust',
  '<p>These Qurans are made up of a bind hardcopy book consisting of <strong>50g of Shamua coloured paper</strong>, making it easy to read by the human eye.</p><p>We have chosen the translation of Saheeh International and our surah appendices have made it simpler to understand.</p>',
  '{}'::jsonb,
  2
),
(
  'postage_packaging',
  'Postage & packaging',
  '<p>Postage and packaging charges apply for physical Qur''an copies.</p>',
  '{}'::jsonb,
  3
),
(
  'sadaqah_intro',
  'Sadaqatul Jariyah',
  '<p>Sadaqatul Jariyah is ongoing charity (continuous rewards) received by us for good actions and deeds, that will not only benefit us in this life, but will continue to benefit us after our death, Inshallah.</p>',
  '{}'::jsonb,
  10
),
(
  'why_donate',
  'Why Donate?',
  '<p>Abu Huraira (RadhiAllahu ''anhu) reported: Allah''s messenger ﷺ said:</p><blockquote>When a man dies, his acts come to an end, but three, recurring charity or knowledge (by which people) benefit, or a pious son, who prays for him (for the deceased) <cite>Sahih Muslim – Book 13-Hadith 4005</cite></blockquote><p>Allah SWT says: &ldquo;…and spending something (in charity) out of the provision which we have bestowed you, before death should come to any of you…&rdquo; (Qur''an, 63:10)</p>',
  '{}'::jsonb,
  11
),
(
  'ongoing_charity',
  'Good deeds that outlive you',
  '<p>Below are examples of good actions and deeds which will outlive you, Insha Allah:</p>',
  '{"bullets":["If you teach someone to recite Quran, you receive hasanat every time they recite — even after your death.","Give copies of the Holy Quran and each time they read from it, you will receive hasanat.","Give away Islamic reading materials.","Teach someone Dua and/or Dhikr — each time it is recited you will gain hasanat.","Share Dua or Quran resources online or on CD.","Building or donating to build a dispensary or hospital."]}'::jsonb,
  12
),
(
  'bank_payment',
  'Direct bank payment',
  '<p>Prefer to pay by bank transfer? Use the details below.</p>',
  '{"bankName":"Starling Bank","bankAddress":"Starling Bank Limited (No. 09092149), 3rd Floor, 2 Finsbury Avenue, London, EC2M 2PP","accountNumber":"34939137","iban":"GB21SRLG60837134939137","swift":"SRLGGB2L","referenceNote":"For all international transfers please mention (01312601) as the reference.","orderNote":"If you have ordered a Quran, please also provide a Sales Order Reference Number."}'::jsonb,
  20
),
(
  'mercy_foundation',
  'Mercy 4 All Foundation',
  '<p>Donate Quran is part of a non-profitable organisation which is part of <strong>Mercy 4 All Foundation</strong>, a registered charity in the United Kingdom. 100 percent of funds donated to us are used on printing a copy of the Quran.</p><p>The core activities of Mercy 4 All Foundation are charitable activities in Dawah and humanitarian projects — to convey the message of Islam to Muslims and Non-Muslims.</p>',
  '{}'::jsonb,
  30
),
(
  'mission_dawah',
  'Our Dawah mission',
  '<p>As Allah has Commanded in The Holy Qur''an: &ldquo;And let there be [arising] from you a nation inviting to [all that is] good, enjoining what is right and forbidding what is wrong, and those will be the successful.&rdquo; (Al Quran 3:104)</p><p>We aim to promote the teachings of the Quran and the Sunnah and tolerance in order to achieve peace and co-existence among all races.</p><p>We provide free copies of the Quran translation in English to Mosques, Community Centres, Dawah Centres, Hospitals, Schools, Hotels, Prisons, Libraries and Homes.</p><p>Our target is to distribute millions of copies worldwide, Inshallah.</p>',
  '{}'::jsonb,
  31
),
(
  'origin_story',
  'How it started',
  '<p>In 2013, we initially distributed 20 Qurans to friends and families and now, Alhumdullilah, we have distributed thousands of copies by the grace of Allah.</p><p>It all started by word of mouth and by the grace of Allah we are contacted by people from around the world for many copies.</p><p>You too can get involved — we are looking for individuals and institutions who would like to become registered distributors.</p>',
  '{}'::jsonb,
  32
),
(
  'impact_testimony',
  'Impact worldwide',
  '<p>Alhumdulillah, Donate Quran has had many positive responses from both Muslims and Non-Muslims who are now able to understand the Quran better. As a result, some Non-Muslims have taken the Shahada — they are very blessed, MashaAllah.</p>',
  '{}'::jsonb,
  33
),
(
  'other_projects',
  'Other projects',
  '<p><strong>Pure Health Hospital – Humanity Project</strong></p><p>Modern state of the art hospital in India (Gujarat), providing free medical treatment to disadvantaged individuals. There are around 2 million people living in this area. We are also working towards various social activities such as Free Medical Camps.</p>',
  '{}'::jsonb,
  40
)
ON CONFLICT (key) DO NOTHING;
