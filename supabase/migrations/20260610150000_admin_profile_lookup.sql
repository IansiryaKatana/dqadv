-- Reliable admin profile lookup: bypasses RLS and auto-links email-only rows.

CREATE OR REPLACE FUNCTION public.dq_get_my_admin_profile()
RETURNS TABLE (role public.dq_admin_role, is_active boolean)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_email text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT u.email INTO v_email
  FROM auth.users u
  WHERE u.id = v_user_id;

  IF v_email IS NOT NULL THEN
    UPDATE public.dq_admin_users au
    SET auth_user_id = v_user_id, updated_at = now()
    WHERE au.auth_user_id IS NULL
      AND lower(au.email) = lower(v_email);
  END IF;

  RETURN QUERY
  SELECT au.role, au.is_active
  FROM public.dq_admin_users au
  WHERE au.auth_user_id = v_user_id
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.dq_get_my_admin_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dq_get_my_admin_profile() TO authenticated;
