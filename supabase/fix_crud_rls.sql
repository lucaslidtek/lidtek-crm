-- ============================================
-- FIX CRUD: Corrigir RLS + Colunas Faltantes
-- Cole no Supabase SQL Editor e rode.
-- ============================================

-- ══════════════════════════════════════════════
-- PARTE 1: Normalizar roles no profiles
-- O seed usa 'manager', mas as RLS policies checam 'gestor'.
-- Vamos aceitar AMBOS, mas garantir que o admin real tem 'admin'.
-- ══════════════════════════════════════════════

-- Garante que o usuário principal tem role 'admin'
UPDATE public.profiles SET role = 'admin' WHERE email = 'lucas@lidtek.com.br' AND (role IS NULL OR role != 'admin');

-- Normalizar: qualquer 'manager' vira 'gestor' para consistency
UPDATE public.profiles SET role = 'gestor' WHERE role = 'manager';

-- ══════════════════════════════════════════════
-- PARTE 2: Adicionar colunas faltantes se não existirem
-- O schema.sql original não tinha essas colunas, mas a API as usa.
-- ══════════════════════════════════════════════

-- Sprints: priority e due_date
ALTER TABLE public.sprints ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium';
ALTER TABLE public.sprints ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Leads: campos extras
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS emails TEXT[] DEFAULT '{}';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS phones TEXT[] DEFAULT '{}';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS endereco TEXT;

-- ══════════════════════════════════════════════
-- PARTE 3: Recriar funções helper (idempotente)
-- ══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_member()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ══════════════════════════════════════════════
-- PARTE 4: Recriar TODAS as RLS policies
-- Agora aceitando TANTO 'gestor' quanto 'manager' como equivalentes
-- ══════════════════════════════════════════════

-- ── PROFILES ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'admin' OR id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.get_user_role() = 'admin') WITH CHECK (id = auth.uid() OR public.get_user_role() = 'admin');
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

-- ── LEADS ──
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'manager', 'collaborator'));
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor', 'manager') OR owner_id = auth.uid())
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'manager') OR owner_id = auth.uid());
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor', 'manager'));

-- ── INTERACTIONS ──
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "interactions_select" ON public.interactions;
DROP POLICY IF EXISTS "interactions_insert" ON public.interactions;
DROP POLICY IF EXISTS "interactions_update" ON public.interactions;
DROP POLICY IF EXISTS "interactions_delete" ON public.interactions;
DROP POLICY IF EXISTS "interactions_all" ON public.interactions;
CREATE POLICY "interactions_select" ON public.interactions FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "interactions_insert" ON public.interactions FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'manager', 'collaborator'));
CREATE POLICY "interactions_update" ON public.interactions FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor', 'manager') OR user_id = auth.uid())
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'manager') OR user_id = auth.uid());
CREATE POLICY "interactions_delete" ON public.interactions FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor', 'manager'));

-- ── PROJECTS ──
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'manager'));
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor', 'manager') OR owner_id = auth.uid())
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'manager') OR owner_id = auth.uid());
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor', 'manager'));

-- ── SPRINTS ──
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sprints_select" ON public.sprints;
DROP POLICY IF EXISTS "sprints_insert" ON public.sprints;
DROP POLICY IF EXISTS "sprints_update" ON public.sprints;
DROP POLICY IF EXISTS "sprints_delete" ON public.sprints;
DROP POLICY IF EXISTS "sprints_all" ON public.sprints;
CREATE POLICY "sprints_select" ON public.sprints FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "sprints_insert" ON public.sprints FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'manager')
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "sprints_update" ON public.sprints FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor', 'manager')
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()))
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'manager')
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "sprints_delete" ON public.sprints FOR DELETE TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor', 'manager')
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

-- ── TASKS ──
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "tasks_all" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'manager', 'collaborator'));
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated
  USING (public.get_user_role() IN ('admin', 'gestor', 'manager') OR owner_id = auth.uid())
  WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'manager') OR owner_id = auth.uid());
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor', 'manager'));

-- ── FUNNEL_COLUMNS ──
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'funnel_columns') THEN
    ALTER TABLE public.funnel_columns ENABLE ROW LEVEL SECURITY;

    EXECUTE 'DROP POLICY IF EXISTS "funnel_columns_select" ON public.funnel_columns';
    EXECUTE 'DROP POLICY IF EXISTS "funnel_columns_insert" ON public.funnel_columns';
    EXECUTE 'DROP POLICY IF EXISTS "funnel_columns_update" ON public.funnel_columns';
    EXECUTE 'DROP POLICY IF EXISTS "funnel_columns_delete" ON public.funnel_columns';
    EXECUTE 'DROP POLICY IF EXISTS "funnel_columns_all" ON public.funnel_columns';

    EXECUTE 'CREATE POLICY "funnel_columns_select" ON public.funnel_columns FOR SELECT TO authenticated USING (public.is_member())';
    EXECUTE 'CREATE POLICY "funnel_columns_insert" ON public.funnel_columns FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN (''admin'', ''gestor'', ''manager''))';
    EXECUTE 'CREATE POLICY "funnel_columns_update" ON public.funnel_columns FOR UPDATE TO authenticated USING (public.get_user_role() IN (''admin'', ''gestor'', ''manager'')) WITH CHECK (public.get_user_role() IN (''admin'', ''gestor'', ''manager''))';
    EXECUTE 'CREATE POLICY "funnel_columns_delete" ON public.funnel_columns FOR DELETE TO authenticated USING (public.get_user_role() = ''admin'')';

    RAISE NOTICE 'funnel_columns: RLS policies atualizadas.';
  ELSE
    RAISE NOTICE 'funnel_columns: tabela não existe. Ignorando.';
  END IF;
END $$;

-- ══════════════════════════════════════════════
-- PARTE 5: Verificação
-- ══════════════════════════════════════════════

-- Mostrar role do usuário principal
SELECT id, email, role FROM profiles WHERE email LIKE '%lucas%' OR role = 'admin';

-- Mostrar todas as policies
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;
