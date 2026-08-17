-- Per-admin last-viewed cursors for donations/submissions inbox badges.

CREATE TYPE public.dq_admin_inbox AS ENUM ('donations', 'submissions');

CREATE TABLE public.dq_admin_inbox_cursors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES public.dq_admin_users(id) ON DELETE CASCADE,
  inbox public.dq_admin_inbox NOT NULL,
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_user_id, inbox)
);

CREATE INDEX IF NOT EXISTS dq_admin_inbox_cursors_admin_user_id_idx
  ON public.dq_admin_inbox_cursors (admin_user_id);

CREATE INDEX IF NOT EXISTS dq_form_submissions_created_at_idx
  ON public.dq_form_submissions (created_at DESC);

CREATE INDEX IF NOT EXISTS dq_donations_created_at_idx
  ON public.dq_donations (created_at DESC);

ALTER TABLE public.dq_admin_inbox_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dq_admin_read_own_inbox_cursors" ON public.dq_admin_inbox_cursors
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dq_admin_users au
      WHERE au.id = admin_user_id
        AND au.auth_user_id = auth.uid()
        AND au.is_active = true
    )
  );

CREATE POLICY "dq_admin_write_own_inbox_cursors" ON public.dq_admin_inbox_cursors
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.dq_admin_users au
      WHERE au.id = admin_user_id
        AND au.auth_user_id = auth.uid()
        AND au.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.dq_admin_users au
      WHERE au.id = admin_user_id
        AND au.auth_user_id = auth.uid()
        AND au.is_active = true
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dq_admin_inbox_cursors TO authenticated;

CREATE OR REPLACE FUNCTION public.dq_get_inbox_missed_counts()
RETURNS TABLE (donations bigint, submissions bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
  v_donations_viewed timestamptz;
  v_submissions_viewed timestamptz;
  v_donations_count bigint := 0;
  v_submissions_count bigint := 0;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint;
    RETURN;
  END IF;

  SELECT au.id INTO v_admin_id
  FROM public.dq_admin_users au
  WHERE au.auth_user_id = auth.uid()
    AND au.is_active = true
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RETURN QUERY SELECT 0::bigint, 0::bigint;
    RETURN;
  END IF;

  SELECT c.last_viewed_at INTO v_donations_viewed
  FROM public.dq_admin_inbox_cursors c
  WHERE c.admin_user_id = v_admin_id
    AND c.inbox = 'donations';

  SELECT c.last_viewed_at INTO v_submissions_viewed
  FROM public.dq_admin_inbox_cursors c
  WHERE c.admin_user_id = v_admin_id
    AND c.inbox = 'submissions';

  IF dq_can_manage_donations() THEN
    SELECT count(*) INTO v_donations_count
    FROM public.dq_donations d
    WHERE d.created_at > COALESCE(v_donations_viewed, '1970-01-01'::timestamptz);
  END IF;

  IF dq_can_manage_submissions() THEN
    SELECT count(*) INTO v_submissions_count
    FROM public.dq_form_submissions s
    WHERE s.created_at > COALESCE(v_submissions_viewed, '1970-01-01'::timestamptz);
  END IF;

  RETURN QUERY SELECT v_donations_count, v_submissions_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.dq_mark_inbox_viewed(p_inbox public.dq_admin_inbox)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  SELECT au.id INTO v_admin_id
  FROM public.dq_admin_users au
  WHERE au.auth_user_id = auth.uid()
    AND au.is_active = true
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    RETURN;
  END IF;

  IF p_inbox = 'donations' AND NOT dq_can_manage_donations() THEN
    RETURN;
  END IF;

  IF p_inbox = 'submissions' AND NOT dq_can_manage_submissions() THEN
    RETURN;
  END IF;

  INSERT INTO public.dq_admin_inbox_cursors (admin_user_id, inbox, last_viewed_at, updated_at)
  VALUES (v_admin_id, p_inbox, now(), now())
  ON CONFLICT (admin_user_id, inbox)
  DO UPDATE SET last_viewed_at = now(), updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.dq_get_inbox_missed_counts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dq_get_inbox_missed_counts() TO authenticated;

REVOKE ALL ON FUNCTION public.dq_mark_inbox_viewed(public.dq_admin_inbox) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dq_mark_inbox_viewed(public.dq_admin_inbox) TO authenticated;
