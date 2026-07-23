-- Donation commerce schema: product extensions, carts, and donations
-- Run this migration manually when ready.

-- Extend donation products with commerce fields
ALTER TABLE public.dq_donation_products
  ADD COLUMN IF NOT EXISTS requires_shipping boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS impact_statement text,
  ADD COLUMN IF NOT EXISTS min_amount numeric,
  ADD COLUMN IF NOT EXISTS max_quantity int NOT NULL DEFAULT 99;

-- Gift carts (session-based)
CREATE TABLE IF NOT EXISTS public.dq_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

CREATE TABLE IF NOT EXISTS public.dq_cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.dq_carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.dq_donation_products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_amount numeric,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

-- Donations (replaces generic orders)
CREATE TABLE IF NOT EXISTS public.dq_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE NOT NULL,
  cart_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  donor_name text NOT NULL,
  donor_email text NOT NULL,
  donor_phone text,
  shipping_address jsonb,
  dedication text,
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  payment_provider text,
  payment_intent_id text,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  fulfillment_status text NOT NULL DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dq_donations_reference_idx ON public.dq_donations (reference);
CREATE INDEX IF NOT EXISTS dq_donations_payment_status_idx ON public.dq_donations (payment_status);
CREATE INDEX IF NOT EXISTS dq_cart_items_cart_id_idx ON public.dq_cart_items (cart_id);

-- RLS
ALTER TABLE public.dq_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_donations ENABLE ROW LEVEL SECURITY;

-- Public cart access (session-based — enforced at app layer for v1)
CREATE POLICY "dq_public_carts_all" ON public.dq_carts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dq_public_cart_items_all" ON public.dq_cart_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Donations: public can insert; only admins can read
CREATE POLICY "dq_public_insert_donations" ON public.dq_donations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "dq_admin_all_donations" ON public.dq_donations FOR ALL TO authenticated USING (dq_is_admin()) WITH CHECK (dq_is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dq_carts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dq_cart_items TO anon, authenticated;
GRANT INSERT ON public.dq_donations TO anon, authenticated;
GRANT ALL ON public.dq_donations TO authenticated;

-- Seed impact statements for existing products
UPDATE public.dq_donation_products SET
  requires_shipping = true,
  impact_statement = 'Provides 1 Qur''an to a family in need'
WHERE slug = 'single-quran-request';

UPDATE public.dq_donation_products SET
  requires_shipping = true,
  impact_statement = 'Delivers a premium English translation Mushaf'
WHERE slug = 'quran-english-translation';

UPDATE public.dq_donation_products SET
  requires_shipping = false,
  impact_statement = 'Supports our digital Qur''an learning platform'
WHERE slug = 'quran-project-app';

UPDATE public.dq_donation_products SET
  requires_shipping = false,
  impact_statement = 'Sponsors a full pallet — approximately 500 Qur''ans distributed'
WHERE slug = 'bulk-pallet-order';

UPDATE public.dq_donation_products SET
  impact_statement = 'Funds large-scale distribution campaigns across multiple regions'
WHERE slug = 'flagship-sponsorship';

UPDATE public.dq_donation_products SET
  impact_statement = 'Funds printing of new Mushaf editions for waiting communities'
WHERE slug = 'mushaf-print';

UPDATE public.dq_donation_products SET
  impact_statement = 'Expands our reach through campaigns and educational content'
WHERE slug = 'marketing-outreach';
