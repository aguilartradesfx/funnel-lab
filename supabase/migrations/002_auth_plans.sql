-- ============================================================
-- FunnelLab — Migración 002: Planes, créditos y mejoras
-- Ejecutar DESPUÉS de 001_initial.sql
-- ============================================================

-- ── Agregar columna updated_at a scenarios ────────────────────
alter table scenarios add column if not exists updated_at timestamptz default now();

drop trigger if exists scenarios_updated_at on scenarios;
create trigger scenarios_updated_at
  before update on scenarios
  for each row execute function update_updated_at();

-- ── Planes del usuario ────────────────────────────────────────
create table if not exists user_plans (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users on delete cascade unique not null,
  plan                  text not null default 'starter'
                          check (plan in ('starter', 'pro', 'agency')),
  monthly_credits_total int not null default 0,
  monthly_credits_used  int not null default 0,
  pack_credits          int not null default 0,
  current_period_start  timestamptz default now(),
  current_period_end    timestamptz default (now() + interval '30 days'),
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

drop trigger if exists user_plans_updated_at on user_plans;
create trigger user_plans_updated_at
  before update on user_plans
  for each row execute function update_updated_at();

-- ── Historial de consumo de créditos ──────────────────────────
create table if not exists credit_usage_log (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references auth.users on delete cascade not null,
  action           text not null,
  credits_consumed int not null,
  source           text not null check (source in ('monthly', 'pack')),
  metadata         jsonb default '{}',
  created_at       timestamptz default now()
);

-- ── Compras de packs de créditos ──────────────────────────────
create table if not exists credit_pack_purchases (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users on delete cascade not null,
  pack_size       int not null,
  price           numeric not null,
  credits_granted int not null,
  payment_id      text,
  created_at      timestamptz default now()
);

-- ── Row Level Security ────────────────────────────────────────
alter table user_plans            enable row level security;
alter table credit_usage_log      enable row level security;
alter table credit_pack_purchases enable row level security;

create policy "user_plans_select_own"
  on user_plans for select using (auth.uid() = user_id);

create policy "user_plans_update_own"
  on user_plans for update using (auth.uid() = user_id);

create policy "credit_log_select_own"
  on credit_usage_log for select using (auth.uid() = user_id);

create policy "credit_purchases_select_own"
  on credit_pack_purchases for select using (auth.uid() = user_id);

-- ── Trigger mejorado: crea perfil + plan al registrar usuario ──
-- Reemplaza la función existente
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Crear perfil
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      ''
    ),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;

  -- Crear plan inicial (pro con 150 créditos para testing)
  insert into public.user_plans (
    user_id,
    plan,
    monthly_credits_total,
    monthly_credits_used,
    pack_credits,
    current_period_start,
    current_period_end
  )
  values (
    new.id,
    'pro',
    150,
    0,
    0,
    now(),
    now() + interval '30 days'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- El trigger on_auth_user_created ya existe desde 001, no hace falta recrearlo
-- Si necesitás recrearlo manualmente:
-- drop trigger if exists on_auth_user_created on auth.users;
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute function public.handle_new_user();
