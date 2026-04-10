-- ============================================
-- RLS POLICIES — Lidtek CRM & Gestão de Projetos
-- Executar no Supabase SQL Editor (Dashboard > SQL Editor)
--
-- Modelo de permissões:
--   - SELECT: todos os usuários autenticados veem tudo
--   - INSERT/UPDATE/DELETE: admin e gestor têm acesso total
--   - Colaborador: INSERT livre, UPDATE/DELETE apenas nos próprios (owner_id = auth.uid())
--   - Leitura: somente SELECT
-- ============================================

-- ─────────────────────────────────────────────
-- 0. Helper: get_user_role()
-- Busca o role do usuário atual na tabela profiles.
-- SECURITY DEFINER + STABLE evita recursão infinita em RLS.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(role, 'collaborator')
  FROM public.profiles
  WHERE id = auth.uid()
$$;

-- ─────────────────────────────────────────────
-- 1. ENABLE RLS em todas as tabelas
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks        ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 2. PROFILES
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- Todos os autenticados podem ver todos os perfis (necessário para mostrar avatares/nomes)
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Apenas admin pode inserir perfis manualmente (trigger usa SECURITY DEFINER, não precisa de policy)
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'admin'
    OR id = auth.uid() -- permite inserir o próprio perfil
  );

-- Usuário edita o próprio perfil; admin edita qualquer um
CREATE POLICY "profiles_update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR public.get_user_role() = 'admin'
  )
  WITH CHECK (
    id = auth.uid()
    OR public.get_user_role() = 'admin'
  );

-- Somente admin pode deletar perfis
CREATE POLICY "profiles_delete"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ─────────────────────────────────────────────
-- 3. LEADS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;

-- Todos os autenticados veem todos os leads
CREATE POLICY "leads_select"
  ON public.leads FOR SELECT
  TO authenticated
  USING (true);

-- Admin, gestor e colaborador podem criar leads
CREATE POLICY "leads_insert"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor', 'collaborator')
  );

-- Admin/gestor editam qualquer lead; colaborador edita apenas os seus
CREATE POLICY "leads_update"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'gestor')
    OR owner_id = auth.uid()
  )
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor')
    OR owner_id = auth.uid()
  );

-- Somente admin e gestor deletam leads
CREATE POLICY "leads_delete"
  ON public.leads FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- ─────────────────────────────────────────────
-- 4. INTERACTIONS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "interactions_select" ON public.interactions;
DROP POLICY IF EXISTS "interactions_insert" ON public.interactions;
DROP POLICY IF EXISTS "interactions_update" ON public.interactions;
DROP POLICY IF EXISTS "interactions_delete" ON public.interactions;

CREATE POLICY "interactions_select"
  ON public.interactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "interactions_insert"
  ON public.interactions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor', 'collaborator')
  );

CREATE POLICY "interactions_update"
  ON public.interactions FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'gestor')
    OR user_id = auth.uid()
  )
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor')
    OR user_id = auth.uid()
  );

CREATE POLICY "interactions_delete"
  ON public.interactions FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- ─────────────────────────────────────────────
-- 5. PROJECTS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;

CREATE POLICY "projects_select"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "projects_insert"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor')
  );

CREATE POLICY "projects_update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'gestor')
    OR owner_id = auth.uid()
  )
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor')
    OR owner_id = auth.uid()
  );

CREATE POLICY "projects_delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- ─────────────────────────────────────────────
-- 6. SPRINTS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "sprints_select" ON public.sprints;
DROP POLICY IF EXISTS "sprints_insert" ON public.sprints;
DROP POLICY IF EXISTS "sprints_update" ON public.sprints;
DROP POLICY IF EXISTS "sprints_delete" ON public.sprints;

CREATE POLICY "sprints_select"
  ON public.sprints FOR SELECT
  TO authenticated
  USING (true);

-- Sprints são criadas via o projeto — somente admin/gestor (ou owner do projeto via trigger)
CREATE POLICY "sprints_insert"
  ON public.sprints FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor')
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "sprints_update"
  ON public.sprints FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'gestor')
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor')
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "sprints_delete"
  ON public.sprints FOR DELETE
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'gestor')
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id
        AND p.owner_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- 7. TASKS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;

CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (true);

-- Todos podem criar tarefas (inclusive colaboradores)
CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor', 'collaborator')
  );

-- Admin/gestor editam qualquer tarefa; colaborador edita apenas as suas
CREATE POLICY "tasks_update"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    public.get_user_role() IN ('admin', 'gestor')
    OR owner_id = auth.uid()
  )
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor')
    OR owner_id = auth.uid()
  );

-- Somente admin/gestor deletam tarefas
CREATE POLICY "tasks_delete"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- ─────────────────────────────────────────────
-- VERIFICAÇÃO: Listar policies criadas
-- ─────────────────────────────────────────────
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
