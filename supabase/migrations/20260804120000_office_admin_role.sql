-- Add office_admin role (must commit before the value is usable in policies)
ALTER TYPE public.dq_admin_role ADD VALUE IF NOT EXISTS 'office_admin';
