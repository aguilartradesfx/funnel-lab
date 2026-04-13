-- ============================================================
-- Funnel Simulator Pro — Migración inicial
-- ============================================================

-- ── Perfiles de usuario ──────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz default now()
);

-- ── Proyectos ────────────────────────────────────────────────
create table if not exists projects (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid references profiles(id) on delete cascade,
  title       text not null default 'Mi Funnel',
  description text default '',
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Escenarios (variantes A/B) ───────────────────────────────
create table if not exists scenarios (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references projects(id) on delete cascade,
  name         text not null default 'Principal',
  is_default   boolean default false,
  canvas_state jsonb default '{}',
  created_at   timestamptz default now()
);

-- ── Nodos del funnel ─────────────────────────────────────────
create type funnel_node_type as enum (
  'trafficSource', 'landingPage', 'salesPage', 'checkout',
  'upsell', 'downsell', 'orderBump', 'emailSequence',
  'whatsappSms', 'webinarVsl', 'retargeting', 'appointment',
  'split', 'result'
);

create table if not exists funnel_nodes (
  id          uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios(id) on delete cascade,
  type        funnel_node_type not null,
  label       text not null,
  position_x  float not null default 0,
  position_y  float not null default 0,
  config      jsonb not null default '{}',
  created_at  timestamptz default now()
);

-- ── Conexiones entre nodos ───────────────────────────────────
create type path_type as enum ('yes', 'no', 'default', 'branch-0', 'branch-1', 'branch-2', 'branch-3');

create table if not exists funnel_connections (
  id             uuid primary key default gen_random_uuid(),
  scenario_id    uuid references scenarios(id) on delete cascade,
  source_node_id uuid references funnel_nodes(id) on delete cascade,
  target_node_id uuid references funnel_nodes(id) on delete cascade,
  path_type      path_type not null default 'default',
  source_handle  text,
  target_handle  text
);

-- ── Resultados de simulación ──────────────────────────────────
create table if not exists simulation_results (
  id          uuid primary key default gen_random_uuid(),
  scenario_id uuid references scenarios(id) on delete cascade,
  results     jsonb not null,
  created_at  timestamptz default now()
);

-- ── Colaboradores ────────────────────────────────────────────
create type collaborator_role as enum ('editor', 'viewer');

create table if not exists project_collaborators (
  project_id uuid references projects(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  role       collaborator_role not null default 'viewer',
  invited_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- ── Comentarios en nodos ─────────────────────────────────────
create table if not exists node_comments (
  id         uuid primary key default gen_random_uuid(),
  node_id    uuid references funnel_nodes(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

-- ── Blueprints públicos ───────────────────────────────────────
create table if not exists blueprints (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  category    text not null default 'general',
  tags        text[] default '{}',
  funnel_data jsonb not null,
  created_at  timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles             enable row level security;
alter table projects             enable row level security;
alter table scenarios            enable row level security;
alter table funnel_nodes         enable row level security;
alter table funnel_connections   enable row level security;
alter table simulation_results   enable row level security;
alter table project_collaborators enable row level security;
alter table node_comments        enable row level security;
alter table blueprints           enable row level security;

-- Profiles: cada usuario ve y edita su propio perfil
create policy "profiles_select_own"  on profiles for select  using (auth.uid() = id);
create policy "profiles_update_own"  on profiles for update  using (auth.uid() = id);
create policy "profiles_insert_own"  on profiles for insert  with check (auth.uid() = id);

-- Projects: dueño + colaboradores pueden ver; solo dueño puede modificar
create policy "projects_select" on projects for select
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from project_collaborators
      where project_id = projects.id and user_id = auth.uid()
    )
  );

create policy "projects_insert" on projects for insert
  with check (owner_id = auth.uid());

create policy "projects_update" on projects for update
  using (owner_id = auth.uid());

create policy "projects_delete" on projects for delete
  using (owner_id = auth.uid());

-- Scenarios: hereda acceso del proyecto
create policy "scenarios_select" on scenarios for select
  using (
    exists (
      select 1 from projects p
      where p.id = scenarios.project_id
        and (
          p.owner_id = auth.uid()
          or exists (
            select 1 from project_collaborators pc
            where pc.project_id = p.id and pc.user_id = auth.uid()
          )
        )
    )
  );

create policy "scenarios_insert" on scenarios for insert
  with check (
    exists (
      select 1 from projects p
      where p.id = scenarios.project_id and p.owner_id = auth.uid()
    )
  );

create policy "scenarios_update" on scenarios for update
  using (
    exists (
      select 1 from projects p
      left join project_collaborators pc on pc.project_id = p.id and pc.user_id = auth.uid()
      where p.id = scenarios.project_id
        and (p.owner_id = auth.uid() or pc.role = 'editor')
    )
  );

-- Blueprints: públicos para lectura
create policy "blueprints_select_all" on blueprints for select using (true);

-- ============================================================
-- Función: actualizar updated_at automáticamente
-- ============================================================

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

-- ============================================================
-- Función: crear perfil automáticamente al registrar usuario
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
