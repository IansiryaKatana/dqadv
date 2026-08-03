-- Fix infinite RLS recursion on dq_admin_users SELECT.
-- dq_admin_manage_admin_users was FOR ALL and re-queried dq_admin_users in USING,
-- which re-entered RLS and returned HTTP 500 from PostgREST.

CREATE OR REPLACE FUNCTION public.dq_can_manage_admins()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.dq_admin_users
    WHERE auth_user_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.dq_can_manage_admins() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dq_can_manage_admins() TO authenticated;

DROP POLICY IF EXISTS "dq_admin_manage_admin_users" ON public.dq_admin_users;

CREATE POLICY "dq_admin_insert_admin_users" ON public.dq_admin_users
  FOR INSERT TO authenticated
  WITH CHECK (public.dq_can_manage_admins());

CREATE POLICY "dq_admin_update_admin_users" ON public.dq_admin_users
  FOR UPDATE TO authenticated
  USING (public.dq_can_manage_admins())
  WITH CHECK (public.dq_can_manage_admins());

CREATE POLICY "dq_admin_delete_admin_users" ON public.dq_admin_users
  FOR DELETE TO authenticated
  USING (public.dq_can_manage_admins());
