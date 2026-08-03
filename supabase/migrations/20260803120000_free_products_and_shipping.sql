-- Free request products + paid physical shipping.
-- Extends kind check so free request SKUs can use kind = 'free'.

ALTER TABLE public.dq_donation_products
  DROP CONSTRAINT IF EXISTS dq_donation_products_kind_check;

ALTER TABLE public.dq_donation_products
  ADD CONSTRAINT dq_donation_products_kind_check
  CHECK (kind IN ('product', 'quick', 'free'));

ALTER TABLE public.dq_donation_products
  ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;

UPDATE public.dq_donation_products
SET
  kind = 'free',
  is_free = true,
  requires_shipping = true,
  cta_url = '/order-free-qurans',
  cta_label = 'REQUEST FREE COPY'
WHERE slug = 'quran-free-copy';

UPDATE public.dq_donation_products
SET requires_shipping = true
WHERE slug IN ('single-quran-donation', 'family-quran-package');

UPDATE public.dq_donation_products
SET is_free = (kind = 'free' OR ((COALESCE(price, 0) <= 0) AND requires_shipping));

UPDATE public.dq_hero_content
SET secondary_cta_url = '/order-free-qurans'
WHERE secondary_cta_url ILIKE '%quran-free-copy%';
