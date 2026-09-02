-- Give (amount donations + monthly) and UK Qur'an order postage tiers.

-- ---------------------------------------------------------------------------
-- Donations: kind, frequency, postage split, subscriptions
-- ---------------------------------------------------------------------------
ALTER TABLE public.dq_donations
  ADD COLUMN IF NOT EXISTS order_kind text NOT NULL DEFAULT 'donation',
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'one_time',
  ADD COLUMN IF NOT EXISTS items_subtotal numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS postage_total numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_shipped_sent_at timestamptz;

UPDATE public.dq_donations
SET items_subtotal = COALESCE(subtotal, total, 0)
WHERE items_subtotal = 0 AND COALESCE(subtotal, total, 0) <> 0;

ALTER TABLE public.dq_donations
  DROP CONSTRAINT IF EXISTS dq_donations_order_kind_check;
ALTER TABLE public.dq_donations
  ADD CONSTRAINT dq_donations_order_kind_check
  CHECK (order_kind IN ('donation', 'quran_order'));

ALTER TABLE public.dq_donations
  DROP CONSTRAINT IF EXISTS dq_donations_frequency_check;
ALTER TABLE public.dq_donations
  ADD CONSTRAINT dq_donations_frequency_check
  CHECK (frequency IN ('one_time', 'monthly'));

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.conname
    FROM pg_constraint c
    WHERE c.conrelid = 'public.dq_donations'::regclass
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%fulfillment_status%'
  LOOP
    EXECUTE format('ALTER TABLE public.dq_donations DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.dq_donations
  ADD CONSTRAINT dq_donations_fulfillment_status_check
  CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'not_required'));

CREATE INDEX IF NOT EXISTS dq_donations_order_kind_idx ON public.dq_donations (order_kind);
CREATE INDEX IF NOT EXISTS dq_donations_frequency_idx ON public.dq_donations (frequency);

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dq_donation_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  external_id text NOT NULL,
  status text NOT NULL DEFAULT 'incomplete'
    CHECK (status IN ('incomplete', 'active', 'paused', 'cancelled', 'past_due')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GBP',
  donor_name text NOT NULL,
  donor_email text NOT NULL,
  donor_phone text,
  donor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  dedication text,
  last_payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  UNIQUE (provider, external_id)
);

CREATE INDEX IF NOT EXISTS dq_donation_subscriptions_email_idx
  ON public.dq_donation_subscriptions (donor_email);
CREATE INDEX IF NOT EXISTS dq_donation_subscriptions_user_idx
  ON public.dq_donation_subscriptions (donor_user_id);

ALTER TABLE public.dq_donations
  ADD COLUMN IF NOT EXISTS subscription_id uuid REFERENCES public.dq_donation_subscriptions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS dq_donations_subscription_id_idx ON public.dq_donations (subscription_id);

-- ---------------------------------------------------------------------------
-- Give presets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dq_donate_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'GBP',
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.dq_donate_presets (amount, currency, sort_order, is_active)
SELECT v.amount, 'GBP', v.sort_order, true
FROM (VALUES (10::numeric, 1), (25, 2), (50, 3), (100, 4)) AS v(amount, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.dq_donate_presets);

-- ---------------------------------------------------------------------------
-- UK postage tiers
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dq_quran_postage_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  band text NOT NULL CHECK (band IN ('copies', 'boxes')),
  quantity int NOT NULL CHECK (quantity > 0),
  copies int NOT NULL CHECK (copies > 0),
  cost numeric NOT NULL DEFAULT 0,
  postage numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE (band, quantity)
);

INSERT INTO public.dq_quran_postage_tiers (band, quantity, copies, cost, postage, total, sort_order)
VALUES
  ('copies', 1, 1, 0, 7.50, 7.50, 1),
  ('copies', 2, 2, 10, 2.50, 12.50, 2),
  ('copies', 3, 3, 13, 2.00, 15.00, 3),
  ('copies', 4, 4, 13, 2.00, 15.00, 4),
  ('copies', 5, 5, 15, 2.50, 17.50, 5),
  ('copies', 6, 6, 18, 2.00, 20.00, 6),
  ('copies', 7, 7, 18, 2.00, 20.00, 7),
  ('copies', 8, 8, 18, 2.00, 20.00, 8),
  ('copies', 9, 9, 18, 2.00, 20.00, 9),
  ('boxes', 1, 10, 20, 5, 25, 10),
  ('boxes', 2, 20, 25, 5, 30, 11),
  ('boxes', 3, 30, 30, 5, 35, 12),
  ('boxes', 4, 40, 40, 5, 45, 13),
  ('boxes', 5, 50, 45, 10, 50, 14),
  ('boxes', 6, 60, 50, 15, 65, 15),
  ('boxes', 7, 70, 55, 20, 75, 16),
  ('boxes', 8, 80, 60, 25, 85, 17),
  ('boxes', 9, 90, 65, 30, 95, 18),
  ('boxes', 10, 100, 70, 35, 105, 19),
  ('boxes', 11, 110, 100, 50, 150, 20),
  ('boxes', 12, 120, 120, 60, 180, 21),
  ('boxes', 13, 130, 130, 75, 205, 22),
  ('boxes', 14, 140, 140, 85, 225, 23),
  ('boxes', 15, 150, 160, 100, 260, 24)
ON CONFLICT (band, quantity) DO NOTHING;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.dq_donation_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_donate_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_quran_postage_tiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dq_public_read_donate_presets" ON public.dq_donate_presets;
DROP POLICY IF EXISTS "dq_admin_all_donate_presets" ON public.dq_donate_presets;
DROP POLICY IF EXISTS "dq_public_read_postage_tiers" ON public.dq_quran_postage_tiers;
DROP POLICY IF EXISTS "dq_admin_all_postage_tiers" ON public.dq_quran_postage_tiers;
DROP POLICY IF EXISTS "dq_donor_read_own_subscriptions" ON public.dq_donation_subscriptions;
DROP POLICY IF EXISTS "dq_admin_select_subscriptions" ON public.dq_donation_subscriptions;
DROP POLICY IF EXISTS "dq_admin_update_subscriptions" ON public.dq_donation_subscriptions;

CREATE POLICY "dq_public_read_donate_presets"
  ON public.dq_donate_presets FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "dq_admin_all_donate_presets"
  ON public.dq_donate_presets FOR ALL TO authenticated
  USING (dq_is_admin()) WITH CHECK (dq_is_admin());

CREATE POLICY "dq_public_read_postage_tiers"
  ON public.dq_quran_postage_tiers FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "dq_admin_all_postage_tiers"
  ON public.dq_quran_postage_tiers FOR ALL TO authenticated
  USING (dq_is_admin()) WITH CHECK (dq_is_admin());

CREATE POLICY "dq_donor_read_own_subscriptions"
  ON public.dq_donation_subscriptions FOR SELECT TO authenticated
  USING (
    donor_user_id = (SELECT auth.uid())
    OR (
      donor_user_id IS NULL
      AND lower(donor_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

CREATE POLICY "dq_admin_select_subscriptions"
  ON public.dq_donation_subscriptions FOR SELECT TO authenticated
  USING (dq_can_manage_donations());

CREATE POLICY "dq_admin_update_subscriptions"
  ON public.dq_donation_subscriptions FOR UPDATE TO authenticated
  USING (dq_can_manage_donations()) WITH CHECK (dq_can_manage_donations());

GRANT SELECT ON public.dq_donate_presets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dq_donate_presets TO authenticated;
GRANT SELECT ON public.dq_quran_postage_tiers TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dq_quran_postage_tiers TO authenticated;
GRANT SELECT ON public.dq_donation_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.dq_donation_subscriptions TO authenticated;
GRANT ALL ON TABLE public.dq_donate_presets TO postgres, service_role;
GRANT ALL ON TABLE public.dq_quran_postage_tiers TO postgres, service_role;
GRANT ALL ON TABLE public.dq_donation_subscriptions TO postgres, service_role;

-- ---------------------------------------------------------------------------
-- Trust copy: postage is charged from the UK tariff
-- ---------------------------------------------------------------------------
UPDATE public.dq_trust_blocks
SET body_html = '<p>UK delivery only. The first Qur''an is free — you pay postage of £7.50. Extra copies include a contribution to print cost plus postage. Orders of 10 or more are packed in boxes of 10 (up to 15 boxes).</p>'
WHERE key = 'postage_packaging';
