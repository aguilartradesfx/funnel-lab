-- ============================================================
-- FunnelLab — Campos adicionales en profiles + onboarding
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone              text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name       text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_size          text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS industry           text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_provider      text DEFAULT 'email';

-- ── Trigger mejorado: extrae nombre y apellido por separado ──
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_full_name  text;
  v_first_name text;
  v_last_name  text;
  v_provider   text;
  v_space_pos  int;
BEGIN
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  );

  -- Detectar proveedor
  v_provider := COALESCE(new.raw_app_meta_data->>'provider', 'email');

  -- Separar nombre y apellido si viene como full_name
  v_space_pos := POSITION(' ' IN TRIM(v_full_name));
  IF v_space_pos > 0 THEN
    v_first_name := TRIM(SUBSTRING(v_full_name FROM 1 FOR v_space_pos));
    v_last_name  := TRIM(SUBSTRING(v_full_name FROM v_space_pos + 1));
  ELSE
    v_first_name := TRIM(v_full_name);
    v_last_name  := '';
  END IF;

  INSERT INTO profiles (id, full_name, last_name, avatar_url, auth_provider)
  VALUES (
    new.id,
    v_first_name,
    v_last_name,
    new.raw_user_meta_data->>'avatar_url',
    v_provider
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
