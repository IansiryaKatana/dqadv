-- Create a working Supabase auth user + dq owner row.
-- Run in Supabase SQL Editor. Change email/password below.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$
DECLARE
  v_email    text := 'hello@iankatana.com';
  v_password text := 'ChangeMe123!';
  v_user_id  uuid := gen_random_uuid();
BEGIN
  -- Remove broken rows for this email
  DELETE FROM public.dq_admin_users WHERE lower(email) = lower(v_email);
  DELETE FROM auth.identities
  WHERE user_id IN (SELECT id FROM auth.users WHERE lower(email) = lower(v_email));
  DELETE FROM auth.users WHERE lower(email) = lower(v_email);

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    email_change_confirm_status,
    is_sso_user,
    is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt(v_password, extensions.gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    '',
    0,
    false,
    false
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.dq_admin_users (auth_user_id, email, role, is_active)
  VALUES (v_user_id, v_email, 'owner', true);

  RAISE NOTICE 'Owner created: % (id: %)', v_email, v_user_id;
END $$;

-- Fix any existing users broken by earlier scripts (safe to run)
UPDATE auth.users
SET email_change_confirm_status = 0
WHERE email_change_confirm_status IS NULL;

SELECT id, auth_user_id, email, role, is_active
FROM public.dq_admin_users
WHERE email = 'hello@iankatana.com';
