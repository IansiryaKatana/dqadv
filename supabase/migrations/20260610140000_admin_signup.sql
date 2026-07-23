-- Admin signup: bootstrap first owner/admin and secure self-registration RPC.

CREATE OR REPLACE FUNCTION public.dq_can_bootstrap_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.dq_admin_users
    WHERE is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.dq_register_admin_user(p_role public.dq_admin_role)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
  v_admin_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.dq_admin_users
    WHERE auth_user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'This account is already registered as an admin';
  END IF;

  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RAISE EXCEPTION 'User email not found';
  END IF;

  IF public.dq_can_bootstrap_admin() THEN
    IF p_role NOT IN ('owner', 'admin') THEN
      RAISE EXCEPTION 'Bootstrap signup only allows owner or admin roles';
    END IF;
  ELSE
    RAISE EXCEPTION 'Admin signup is closed. Ask an existing owner or admin to create your account.';
  END IF;

  INSERT INTO public.dq_admin_users (auth_user_id, email, role, is_active)
  VALUES (v_user_id, v_email, p_role, true)
  RETURNING id INTO v_admin_id;

  RETURN v_admin_id;
END;
$$;

REVOKE ALL ON FUNCTION public.dq_can_bootstrap_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dq_can_bootstrap_admin() TO anon, authenticated;

REVOKE ALL ON FUNCTION public.dq_register_admin_user(public.dq_admin_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dq_register_admin_user(public.dq_admin_role) TO authenticated;

-- Let signed-in users read their own admin row (needed to verify access after registration).
DROP POLICY IF EXISTS "dq_admin_read_own_row" ON public.dq_admin_users;
CREATE POLICY "dq_admin_read_own_row" ON public.dq_admin_users
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());
