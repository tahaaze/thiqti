-- Thiqti - Auth migration
-- Users + email verification codes.
-- PostgreSQL 16 (local docker + Neon cloud)

-- Upgrade the existing Auth stub to a full users table.
-- The stub only has `id UUID`; production uses Supabase Auth which manages
-- its own users table. Here we keep it minimal and self-contained so we can
-- own auth without Supabase.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  -- Add columns if they don't exist yet (idempotent upgrade of the stub).
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'email') THEN
    ALTER TABLE auth.users ADD COLUMN email VARCHAR(255);
    ALTER TABLE auth.users ADD COLUMN password_hash TEXT;
    ALTER TABLE auth.users ADD COLUMN full_name VARCHAR(200);
    ALTER TABLE auth.users ADD COLUMN phone VARCHAR(20);
    ALTER TABLE auth.users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE auth.users ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    ALTER TABLE auth.users ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Unique index on email (case-insensitive) so a given address can be used once.
CREATE UNIQUE INDEX IF NOT EXISTS uq_auth_users_email_lower ON auth.users (lower(email));

-- Le stub original (auth.users) définissait id UUID PRIMARY KEY sans défaut.
-- On ajoute le défaut pour générer les id à l'insertion.
ALTER TABLE auth.users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Email verification codes.
CREATE TABLE IF NOT EXISTS auth.verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code VARCHAR(10) NOT NULL,
  purpose VARCHAR(20) NOT NULL DEFAULT 'email_verification',
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_user ON auth.verification_codes(user_id, purpose);
