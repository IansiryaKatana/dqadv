-- Commerce integrations: payment settings, donor accounts, email log, donation extensions

-- Integration settings (secrets stored encrypted by app layer)
CREATE TABLE IF NOT EXISTS public.dq_integration_settings (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  is_secret boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Donor profiles (public accounts, separate from dq_admin_users)
CREATE TABLE IF NOT EXISTS public.dq_donor_profiles (
  auth_user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  default_address jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Email delivery log
CREATE TABLE IF NOT EXISTS public.dq_email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id uuid REFERENCES public.dq_donations(id) ON DELETE SET NULL,
  template text NOT NULL,
  recipient text NOT NULL,
  resend_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dq_email_log_donation_id_idx ON public.dq_email_log (donation_id);

-- Extend donations
ALTER TABLE public.dq_donations
  ADD COLUMN IF NOT EXISTS donor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS paypal_order_id text,
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS email_receipt_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS dq_donations_donor_user_id_idx ON public.dq_donations (donor_user_id);
CREATE INDEX IF NOT EXISTS dq_donations_donor_email_idx ON public.dq_donations (donor_email);

-- RLS
ALTER TABLE public.dq_integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_donor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dq_email_log ENABLE ROW LEVEL SECURITY;

-- Integration settings: admin only (server uses service role for checkout)
CREATE POLICY "dq_admin_read_integration_settings" ON public.dq_integration_settings
  FOR SELECT TO authenticated
  USING (dq_is_admin());

CREATE POLICY "dq_admin_write_integration_settings" ON public.dq_integration_settings
  FOR ALL TO authenticated
  USING (dq_is_admin())
  WITH CHECK (dq_is_admin());

-- Donor profiles: users manage own row
CREATE POLICY "dq_donor_read_own_profile" ON public.dq_donor_profiles
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY "dq_donor_insert_own_profile" ON public.dq_donor_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = auth_user_id);

CREATE POLICY "dq_donor_update_own_profile" ON public.dq_donor_profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = auth_user_id)
  WITH CHECK ((SELECT auth.uid()) = auth_user_id);

-- Donors read own donations by user id or verified email match
CREATE POLICY "dq_donor_read_own_donations" ON public.dq_donations
  FOR SELECT TO authenticated
  USING (
    donor_user_id = (SELECT auth.uid())
    OR (
      donor_user_id IS NULL
      AND lower(donor_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

-- Email log: admin only
CREATE POLICY "dq_admin_all_email_log" ON public.dq_email_log
  FOR ALL TO authenticated
  USING (dq_is_admin())
  WITH CHECK (dq_is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dq_integration_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dq_donor_profiles TO authenticated;
GRANT SELECT ON public.dq_donations TO authenticated;
GRANT ALL ON public.dq_email_log TO authenticated;

-- Seed default integration toggles (non-secret)
INSERT INTO public.dq_integration_settings (key, value, is_secret) VALUES
  ('payment_stripe_enabled', 'true', false),
  ('payment_paypal_enabled', 'false', false),
  ('stripe_mode', 'test', false),
  ('paypal_mode', 'sandbox', false),
  ('email_from_name', 'Donate Quran', false),
  ('email_from_address', '', false),
  ('email_admin_notify', '', false)
ON CONFLICT (key) DO NOTHING;
