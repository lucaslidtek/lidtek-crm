# Plan 010-015 — Integração Supabase Completa

**Issues cobertas:** 010, 011, 012, 013, 014, 015
**Módulos afetados:** Infraestrutura, Auth, Store (todo o app se beneficia)

---

## Descrição

Migrar o Lidtek CRM de mock data (localStorage + arrays em memória) para Supabase PostgreSQL + Auth (Google OAuth). A arquitetura foi projetada para que o swap seja cirúrgico: a UI continua consumindo `useStore()` sem mudanças — apenas o backend da `api` muda internamente.

---

## Arquivos

### Issue 010 — Infra Setup

| Ação | Arquivo | O que muda |
|------|---------|------------|
| **[NEW]** | `.env` | `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` |
| **[MODIFY]** | `package.json` | Adicionar `@supabase/supabase-js` |
| **[NEW]** | `src/shared/lib/supabase.ts` | `createClient(url, anonKey)` — singleton do client |

> `.gitignore` já inclui `.env` — nenhuma mudança necessária.

---

### Issue 011 — Database Schema

| Ação | Arquivo | O que muda |
|------|---------|------------|
| **[NEW]** | `supabase/schema.sql` | DDL completa: 6 tabelas + FK + trigger `on_auth_user_created` |
| **[NEW]** | `supabase/disable_rls.sql` | `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` para todas |

#### Schema detalhado

```sql
-- 1. profiles (vinculado a auth.users)
create table profiles (
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
create table leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  phone text,
  origin text not null,
  owner_id uuid references profiles(id),
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

-- 3. interactions
create table interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,
  type text not null,
  content text not null,
  date timestamptz not null,
  user_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- 4. projects
create table projects (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_contact text not null,
  client_phone text,
  type text not null,
  status text not null default 'active',
  owner_id uuid references profiles(id),
  current_sprint_id uuid,
  next_delivery_date timestamptz,
  lead_id uuid references leads(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. sprints
create table sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  stage text not null,
  start_date timestamptz not null,
  end_date timestamptz,
  status text not null default 'active',
  created_at timestamptz default now()
);

alter table projects
  add constraint fk_current_sprint
  foreign key (current_sprint_id) references sprints(id) on delete set null;

-- 6. tasks
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null,
  status text not null default 'todo',
  priority text not null default 'medium',
  owner_id uuid references profiles(id),
  due_date timestamptz,
  tags text[] default '{}',
  project_id uuid references projects(id) on delete set null,
  sprint_id uuid references sprints(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

#### Trigger de auto-criação de profile

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, initials, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário'),
    new.email,
    upper(
      coalesce(
        left(new.raw_user_meta_data->>'full_name', 1) ||
        left(split_part(new.raw_user_meta_data->>'full_name', ' ', 2), 1),
        left(new.email, 2)
      )
    ),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

---

### Issue 012 — Seed Data

| Ação | Arquivo | O que muda |
|------|---------|------------|
| **[NEW]** | `supabase/seed.sql` | INSERTs para profiles, leads, interactions, projects, sprints, tasks |

#### Mapeamento de IDs

Vou gerar UUIDs determinísticos usando namespace v5 ou simplesmente UUIDs fixos:

```
-- Users
user-1 → '00000000-0000-0000-0000-000000000001'
user-2 → '00000000-0000-0000-0000-000000000002'
...
-- Leads
lead-1 → '10000000-0000-0000-0000-000000000001'
lead-2 → '10000000-0000-0000-0000-000000000002'
...
-- Projects
proj-1 → '20000000-0000-0000-0000-000000000001'
...
-- Sprints
spr-1a → '30000000-0000-0000-0000-00000000001a'
...
-- Tasks
task-p1 → '40000000-0000-0000-0000-0000000000p1'
...
```

**Nota:** Os profiles do seed NÃO terão correspondência em `auth.users` (são dados demo). Para contornar:
- Remover a FK `references auth.users(id)` do seed, ou
- Inserir diretamente na tabela profiles sem FK check (mais prático com RLS desabilitado)

---

### Issue 013 — Supabase API Layer

| Ação | Arquivo | O que muda |
|------|---------|------------|
| **[NEW]** | `src/shared/lib/supabaseApi.ts` | Implementação completa da mesma interface de `mockApi.ts` |
| **[MODIFY]** | `src/shared/lib/store.tsx` | L3: `import { api } from './mockApi'` → `import { api } from './supabaseApi'` |

#### Mapeamento campo a campo (camelCase → snake_case)

O Supabase retorna `snake_case`. A API layer vai converter para `camelCase` para manter compatibilidade com os types existentes.

| TypeScript (camelCase) | Supabase (snake_case) |
|------------------------|-----------------------|
| `ownerId` | `owner_id` |
| `clientName` | `client_name` |
| `clientContact` | `client_contact` |
| `clientPhone` | `client_phone` |
| `currentSprintId` | `current_sprint_id` |
| `nextDeliveryDate` | `next_delivery_date` |
| `nextContactDate` | `next_contact_date` |
| `estimatedValue` | `estimated_value` |
| `billingType` | `billing_type` |
| `billingCycle` | `billing_cycle` |
| `solutionType` | `solution_type` |
| `lossReason` | `loss_reason` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| `startDate` | `start_date` |
| `endDate` | `end_date` |
| `projectId` | `project_id` |
| `sprintId` | `sprint_id` |
| `leadId` | `lead_id` |
| `dueDate` | `due_date` |
| `avatarUrl` | `avatar_url` |
| `userId` | `user_id` |

#### Implementação por domínio

**`api.users`:**
- `list()` → `supabase.from('profiles').select('*')` → mapear para `User[]`
- `getById(id)` → `supabase.from('profiles').select('*').eq('id', id).single()`
- `getCurrent()` → `supabase.auth.getUser()` → buscar profile correspondente
- `create(input)` → `supabase.from('profiles').insert(...)` (gera initials automaticamente)
- `update(id, updates)` → `supabase.from('profiles').update(...).eq('id', id)`
- `delete(id)` → `supabase.from('profiles').delete().eq('id', id)`

**`api.leads`:**
- `list()` → `supabase.from('leads').select('*, interactions(*)').order('created_at', { ascending: false })` → reconstituir `interactions[]` e calcular `taskIds` buscando tasks com `lead_id`
- `create(input)` → `supabase.from('leads').insert(...)` (sem interactions/taskIds — são derivados)
- `update(id, updates)` → `supabase.from('leads').update(...).eq('id', id)`
- `updateStage(id, stage)` → chama `update(id, { stage })`
- `delete(id)` → `supabase.from('leads').delete().eq('id', id)` (cascade deleta interactions)

**`api.projects`:**
- `list()` → `supabase.from('projects').select('*, sprints(*)').order('created_at', { ascending: false })` → reconstituir `sprints[]` e calcular `taskIds`
- `create(input)` → `supabase.from('projects').insert(...)`
- `update(id, updates)` → `supabase.from('projects').update(...).eq('id', id)`

**`api.sprints`:**
- `create(projectId, input)` → INSERT sprint + UPDATE `projects.current_sprint_id`
- `update(sprintId, updates)` → `supabase.from('sprints').update(...).eq('id', sprintId)`
- `complete(sprintId)` → `update(sprintId, { status: 'completed', end_date: now })` 
- `delete(sprintId)` → DELETE sprint + recalcular `current_sprint_id` do project pai

**`api.tasks`:**
- `list()` → `supabase.from('tasks').select('*').order('created_at', { ascending: false })`
- `create(input)` → `supabase.from('tasks').insert(...)`
- `update(id, updates)` → `supabase.from('tasks').update(...).eq('id', id)`
- `updateStatus(id, status)` → chama `update(id, { status })`
- `delete(id)` → `supabase.from('tasks').delete().eq('id', id)`

#### Helpers

```typescript
// Converte snake_case do Supabase → camelCase do TypeScript
function toCamelCase<T>(obj: Record<string, any>): T { ... }
function toSnakeCase(obj: Record<string, any>): Record<string, any> { ... }
```

---

### Issue 014 — Auth Google OAuth

| Ação | Arquivo | O que muda |
|------|---------|------------|
| **[MODIFY]** | `src/app/providers/AuthProvider.tsx` | Rewrite completo — de mock para Supabase Auth |
| **[MODIFY]** | `src/modules/auth/pages/Login.tsx` | `handleLogin` → `signInWithOAuth({ provider: 'google' })` |
| **[MODIFY]** | `src/app/PrivateRoute.tsx` | Adicionar `isLoading` state |

#### AuthProvider — novo código

```typescript
// Novo fluxo:
// 1. onMount → supabase.auth.getSession() para restaurar sessão
// 2. supabase.auth.onAuthStateChange() → listener permanente
// 3. Quando user autentica → buscar/criar profile via api.users.getCurrent()
// 4. login() → supabase.auth.signInWithOAuth({ provider: 'google' })
// 5. logout() → supabase.auth.signOut()

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;        // NOVO — para async session check
  login: () => void;
  logout: () => void;
}
```

#### Login.tsx — mudanças mínimas

O botão "Entrar com Google" já existe visualmente. A única mudança é:
- `handleLogin` → `login()` do AuthProvider (que agora chama Supabase)
- Remover `setLocation('/')` — o redirect é feito pelo `onAuthStateChange` + `useEffect`

#### PrivateRoute — adicionar loading

```typescript
export function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;   // NOVO
  if (!isAuthenticated) return <Redirect to="/login" />;
  
  return <>{children}</>;
}
```

---

### Issue 015 — Verificação

| Ação | Arquivo | O que muda |
|------|---------|------------|
| **[MODIFY]** | `src/references/ARCHITECTURE.md` | Seção "Backend" atualizada de "Mock" para "Supabase" |

---

## Dados (Modelos)

Os types em `src/shared/types/models.ts` **NÃO mudam**. Todos os IDs já são `string` (uuid é string). Os campos são os mesmos. A conversão `camelCase ↔ snake_case` é responsabilidade da API layer.

---

## Cenários

### Happy Path
1. Dev roda `npm run dev` → app abre na `/login`
2. Clica "Entrar com Google" → redirect para Google OAuth
3. Volta autenticado → Dashboard carrega com dados do Supabase
4. Navega para `/crm` → Kanban com leads reais do banco
5. Cria novo lead → persiste no Supabase → aparece após refresh

### Edge Cases
- **Primeiro login:** Trigger cria profile automaticamente
- **Banco vazio (sem seed):** Todas as listas retornam `[]` — UI mostra empty states existentes
- **Supabase offline:** Erros são tratados no `supabaseApi` — retorna arrays vazios como fallback
- **Sprint delete:** Recalcula `current_sprint_id` do project pai
- **Lead com interactions:** CASCADE delete nas interactions ao deletar lead

---

## Design

Nenhuma mudança visual. O design system (glassmorphism, tokens, tipografia) não é afetado. A única mudança de UI visível é que o login realmente redireciona para o Google.

---

## Checklist

### 010 — Infra Setup
- [ ] Instalar `@supabase/supabase-js`
- [ ] Criar `.env` com credenciais
- [ ] Criar `src/shared/lib/supabase.ts`

### 011 — Database Schema
- [ ] Criar `supabase/schema.sql`
- [ ] Criar `supabase/disable_rls.sql`
- [ ] Executar no Supabase Dashboard

### 012 — Seed Data
- [ ] Criar `supabase/seed.sql` com todos os mock data convertidos
- [ ] Executar no Supabase Dashboard

### 013 — API Layer
- [ ] Criar `src/shared/lib/supabaseApi.ts` com toda a interface
- [ ] Helpers de `toCamelCase` / `toSnakeCase`
- [ ] Trocar import no `store.tsx`
- [ ] Testar que `npm run build` compila

### 014 — Auth Google OAuth
- [ ] Rewrite `AuthProvider.tsx` com Supabase Auth
- [ ] Atualizar `Login.tsx`
- [ ] Atualizar `PrivateRoute.tsx` com loading state
- [ ] Configurar Google OAuth no Supabase Dashboard

### 015 — Verificação
- [ ] Login via Google funciona
- [ ] Dashboard carrega dados do Supabase
- [ ] CRUD no CRM persiste após refresh
- [ ] Atualizar `ARCHITECTURE.md`
- [ ] `npm run build` sem erros
