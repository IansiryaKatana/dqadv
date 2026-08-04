-- Office admin: donations access + email log insert (defense in depth)

CREATE OR REPLACE FUNCTION public.dq_can_manage_donations()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dq_admin_users
    WHERE auth_user_id = auth.uid()
      AND is_active = true
      AND role IN ('owner', 'admin', 'editor', 'office_admin')
  );
$$;

REVOKE ALL ON FUNCTION public.dq_can_manage_donations() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dq_can_manage_donations() TO authenticated;

DROP POLICY IF EXISTS "dq_admin_all_donations" ON public.dq_donations;

CREATE POLICY "dq_admin_select_donations" ON public.dq_donations
  FOR SELECT TO authenticated
  USING (dq_can_manage_donations());

CREATE POLICY "dq_admin_update_donations" ON public.dq_donations
  FOR UPDATE TO authenticated
  USING (dq_can_manage_donations())
  WITH CHECK (dq_can_manage_donations());

CREATE POLICY "dq_admin_delete_donations" ON public.dq_donations
  FOR DELETE TO authenticated
  USING (dq_can_manage_donations());

DROP POLICY IF EXISTS "dq_office_admin_insert_form_reply_log" ON public.dq_email_log;

CREATE POLICY "dq_office_admin_insert_form_reply_log" ON public.dq_email_log
  FOR INSERT TO authenticated
  WITH CHECK (
    template = 'form_reply'
    AND EXISTS (
      SELECT 1 FROM public.dq_admin_users
      WHERE auth_user_id = auth.uid()
        AND is_active = true
        AND role = 'office_admin'
    )
  );
