-- Submissions access for office_admin + form reply email history columns

CREATE OR REPLACE FUNCTION public.dq_can_manage_submissions()
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

REVOKE ALL ON FUNCTION public.dq_can_manage_submissions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.dq_can_manage_submissions() TO authenticated;

DROP POLICY IF EXISTS "dq_admin_read_submissions" ON public.dq_form_submissions;
DROP POLICY IF EXISTS "dq_admin_read_form_submissions" ON public.dq_form_submissions;
DROP POLICY IF EXISTS "dq_admin_update_submissions" ON public.dq_form_submissions;
DROP POLICY IF EXISTS "dq_admin_delete_submissions" ON public.dq_form_submissions;

CREATE POLICY "dq_admin_read_submissions" ON public.dq_form_submissions
  FOR SELECT TO authenticated
  USING (dq_can_manage_submissions());

CREATE POLICY "dq_admin_update_submissions" ON public.dq_form_submissions
  FOR UPDATE TO authenticated
  USING (dq_can_manage_submissions())
  WITH CHECK (dq_can_manage_submissions());

CREATE POLICY "dq_admin_delete_submissions" ON public.dq_form_submissions
  FOR DELETE TO authenticated
  USING (dq_is_admin());

ALTER TABLE public.dq_email_log
  ADD COLUMN IF NOT EXISTS submission_id uuid REFERENCES public.dq_form_submissions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS body_text text,
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS dq_email_log_submission_id_idx
  ON public.dq_email_log (submission_id)
  WHERE submission_id IS NOT NULL;

DROP POLICY IF EXISTS "dq_office_admin_read_form_reply_log" ON public.dq_email_log;

CREATE POLICY "dq_office_admin_read_form_reply_log" ON public.dq_email_log
  FOR SELECT TO authenticated
  USING (
    template = 'form_reply'
    AND EXISTS (
      SELECT 1 FROM public.dq_admin_users
      WHERE auth_user_id = auth.uid()
        AND is_active = true
        AND role = 'office_admin'
    )
  );
