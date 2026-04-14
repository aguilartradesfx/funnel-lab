-- ============================================================
-- FunnelLab — Historial de chat IA por proyecto
-- ============================================================

-- ── Mensajes de chat ─────────────────────────────────────────
create table if not exists ai_chat_messages (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  credits_used    int default 0,
  action_type     text, -- 'chat', 'analyze', 'generate_funnel', 'summary', 'suggestions'
  created_at      timestamptz default now()
);

create index if not exists idx_ai_chat_project
  on ai_chat_messages(project_id, created_at);

-- ── Resúmenes de conversación (auto cada 10 mensajes) ────────
create table if not exists ai_chat_summaries (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references projects(id) on delete cascade,
  summary             text not null,
  messages_summarized int not null,
  created_at          timestamptz default now()
);

-- ── RLS ──────────────────────────────────────────────────────
alter table ai_chat_messages enable row level security;
alter table ai_chat_summaries enable row level security;

-- Mensajes: solo el dueño del proyecto puede ver/insertar
create policy "ai_chat_messages_owner" on ai_chat_messages
  for all using (
    user_id = auth.uid()
    and project_id in (
      select id from projects where owner_id = auth.uid()
    )
  );

-- Resúmenes: solo el dueño del proyecto
create policy "ai_chat_summaries_owner" on ai_chat_summaries
  for all using (
    project_id in (
      select id from projects where owner_id = auth.uid()
    )
  );
