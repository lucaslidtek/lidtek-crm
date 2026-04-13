-- ============================================
-- WHITELIST RLS — Lidtek CRM
-- Executa no Supabase SQL Editor (Dashboard > SQL Editor)
--
-- Este script substitui as policies permissivas por um modelo
-- de whitelist: APENAS quem tem perfil na tabela profiles
-- pode ler/escrever dados. Qualquer pessoa que autentique
-- via Google mas NÃO tenha perfil será bloqueada pelo banco.
-- ============================================

-- ─────────────────────────────────────────────
-- 0. HELPERS
-- ─────────────────────────────────────────────

-- is_member(): Retorna true apenas se o usuário autenticado
-- tem uma linha na tabela profiles. SECURITY DEFINER para
-- evitar recursão com RLS.
CREATE OR REPLACE FUNCTION public.is_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid()
  )
$$;

-- get_user_role(): Retorna o role do usuário, ou NULL se não
-- existir na tabela profiles. O NULL impede qualquer operação
-- nos checks de role (IN comparisons com NULL = false).
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ─────────────────────────────────────────────
-- 1. ENABLE RLS em todas as tabelas
-- ─────────────────────────────────────────────
ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_columns ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- 2. PROFILES
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;

-- Membros veem todos os perfis (necessário para avatares/nomes)
CREATE POLICY "profiles_select"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_member());

-- Admin pode inserir novos perfis; usuário pode inserir o próprio (bootstrap)
CREATE POLICY "profiles_insert"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() = 'admin'
    OR id = auth.uid()
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

CREATE POLICY "leads_select"
  ON public.leads FOR SELECT
  TO authenticated
  USING (public.is_member());

CREATE POLICY "leads_insert"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor', 'collaborator')
  );

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
DROP POLICY IF EXISTS "interactions_all" ON public.interactions;

CREATE POLICY "interactions_select"
  ON public.interactions FOR SELECT
  TO authenticated
  USING (public.is_member());

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
  USING (public.is_member());

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
DROP POLICY IF EXISTS "sprints_all" ON public.sprints;

CREATE POLICY "sprints_select"
  ON public.sprints FOR SELECT
  TO authenticated
  USING (public.is_member());

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
DROP POLICY IF EXISTS "tasks_all" ON public.tasks;

CREATE POLICY "tasks_select"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (public.is_member());

CREATE POLICY "tasks_insert"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_user_role() IN ('admin', 'gestor', 'collaborator')
  );

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

CREATE POLICY "tasks_delete"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'));

-- ─────────────────────────────────────────────
-- 8. FUNNEL_COLUMNS
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "funnel_columns_select" ON public.funnel_columns;
DROP POLICY IF EXISTS "funnel_columns_insert" ON public.funnel_columns;
DROP POLICY IF EXISTS "funnel_columns_update" ON public.funnel_columns;
DROP POLICY IF EXISTS "funnel_columns_delete" ON public.funnel_columns;
DROP POLICY IF EXISTS "funnel_columns_all" ON public.funnel_columns;

CREATE POLICY "funnel_columns_select"
  ON public.funnel_columns FOR SELECT
  TO authenticated
  USING (public.is_member());

CREATE POLICY "funnel_columns_insert"
  ON public.funnel_columns FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor'));

CREATE POLICY "funnel_columns_update"
  ON public.funnel_columns FOR UPDATE
  TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor'))
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor'));

CREATE POLICY "funnel_columns_delete"
  ON public.funnel_columns FOR DELETE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ─────────────────────────────────────────────
-- 9. NEUTRALIZAR TRIGGER de auto-criação
-- O admin cadastra membros manualmente pela UI.
-- ─────────────────────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Manter a função mas sem trigger ativo — pode ser útil no futuro
-- para logs ou auditoria.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- DESATIVADO: Não cria perfil automaticamente.
  -- O admin adiciona membros pela interface do CRM.
  -- Se quiser reativar no futuro, descomente o INSERT abaixo.
  --
  -- INSERT INTO public.profiles (id, name, email, initials, avatar_url)
  -- VALUES (...)
  -- ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- VERIFICAÇÃO: Listar policies criadas
-- ─────────────────────────────────────────────
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;
