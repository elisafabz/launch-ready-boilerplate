-- Seed test user for local development and E2E tests.
-- Only runs on `supabase db reset` (local only, never in production).

-- Guard: abort if accidentally executed in production
DO $$
BEGIN
  IF current_setting('app.environment', true) = 'production' THEN
    RAISE EXCEPTION 'Seed file must not run in production';
  END IF;
END $$;

-- Rate limiting infrastructure lives in
-- supabase/migrations/00000000000001_rate_limits.sql
-- (supabase db reset runs migrations BEFORE this seed file).

-- GoTrue reads several token columns as non-null strings. A manual insert
-- must set them to '' (not NULL), otherwise password login fails with
-- "Database error querying schema". The identities row is what makes the
-- email provider resolvable for this user.
WITH new_user AS (
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, aud, role,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, phone_change, phone_change_token, reauthentication_token
  ) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'test@example.com',
    crypt('TestPassword123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    'authenticated',
    'authenticated',
    '', '', '', '', '', '', '', ''
  )
  RETURNING id, email
)
INSERT INTO auth.identities (
  id, user_id, provider_id, provider, identity_data,
  last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(), id, id::text, 'email',
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
  now(), now(), now()
FROM new_user;
