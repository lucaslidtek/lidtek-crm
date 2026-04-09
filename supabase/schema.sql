-- ============================================
-- SCHEMA — Lidtek CRM & Gestão de Projetos
-- Supabase PostgreSQL
-- ============================================

-- 1. profiles (vinculado a auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'collaborator',
  initials text not null default '',
  avatar_url text,
  phone text,
  position text,
  status text not null default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. leads
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  phone text,
  origin text not null,
  owner_id uuid references profiles(id) on delete set null,
  notes text default '',
  stage text not null default 'prospecting',
  next_contact_date timestamptz,
  estimated_value numeric,
  billing_type text,
  billing_cycle text,
  solution_type text,
  loss_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. interactions (extraído do array embeddado em Lead)
create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  type text not null,
  content text not null,
  date timestamptz not null,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_contact text not null,
  client_phone text,
  type text not null,
  status text not null default 'active',
  owner_id uuid references profiles(id) on delete set null,
  current_sprint_id uuid,
  next_delivery_date timestamptz,
  lead_id uuid references leads(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. sprints (extraído do array embeddado em Project)
create table if not exists sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  stage text not null,
  start_date timestamptz not null,
  end_date timestamptz,
  status text not null default 'active',
  created_at timestamptz default now()
);

-- FK circular: projects.current_sprint_id → sprints.id
alter table projects
  add constraint fk_current_sprint
  foreign key (current_sprint_id) references sprints(id) on delete set null;

-- 6. tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null,
  status text not null default 'todo',
  priority text not null default 'medium',
  owner_id uuid references profiles(id) on delete set null,
  due_date timestamptz,
  tags text[] default '{}',
  project_id uuid references projects(id) on delete set null,
  sprint_id uuid references sprints(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- TRIGGER: Auto-create profile on first login
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, initials, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário'),
    coalesce(new.email, ''),
    upper(
      coalesce(
        left(new.raw_user_meta_data->>'full_name', 1) ||
        coalesce(left(split_part(new.raw_user_meta_data->>'full_name', ' ', 2), 1), ''),
        left(coalesce(new.email, 'U'), 2)
      )
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop existing trigger if any, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- INDEXES for common queries
-- ============================================
create index if not exists idx_leads_stage on leads(stage);
create index if not exists idx_leads_owner on leads(owner_id);
create index if not exists idx_interactions_lead on interactions(lead_id);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_projects_owner on projects(owner_id);
create index if not exists idx_sprints_project on sprints(project_id);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_tasks_owner on tasks(owner_id);
create index if not exists idx_tasks_project on tasks(project_id);
create index if not exists idx_tasks_sprint on tasks(sprint_id);
create index if not exists idx_tasks_lead on tasks(lead_id);
