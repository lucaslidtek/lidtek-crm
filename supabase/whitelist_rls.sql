-- ============================================
-- FIX RÁPIDO: Restaurar acesso aos dados
-- Cole EXATAMENTE ISSO no Supabase SQL Editor e rode.
-- Cada bloco é independente — se um falhar, os outros continuam.
-- ============================================

-- ── 1. Recriar funções helper ──
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

-- ── 2. PROFILES ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.get_user_role() = 'admin' OR id = auth.uid());
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() OR public.get_user_role() = 'admin') WITH CHECK (id = auth.uid() OR public.get_user_role() = 'admin');
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (public.get_user_role() = 'admin');

-- ── 3. LEADS ──
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'collaborator'));
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor') OR owner_id = auth.uid()) WITH CHECK (public.get_user_role() IN ('admin', 'gestor') OR owner_id = auth.uid());
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor'));

-- ── 4. INTERACTIONS ──
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "interactions_select" ON public.interactions;
DROP POLICY IF EXISTS "interactions_insert" ON public.interactions;
DROP POLICY IF EXISTS "interactions_update" ON public.interactions;
DROP POLICY IF EXISTS "interactions_delete" ON public.interactions;
DROP POLICY IF EXISTS "interactions_all" ON public.interactions;
CREATE POLICY "interactions_select" ON public.interactions FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "interactions_insert" ON public.interactions FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'collaborator'));
CREATE POLICY "interactions_update" ON public.interactions FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor') OR user_id = auth.uid()) WITH CHECK (public.get_user_role() IN ('admin', 'gestor') OR user_id = auth.uid());
CREATE POLICY "interactions_delete" ON public.interactions FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor'));

-- ── 5. PROJECTS ──
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'gestor'));
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor') OR owner_id = auth.uid()) WITH CHECK (public.get_user_role() IN ('admin', 'gestor') OR owner_id = auth.uid());
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor'));

-- ── 6. SPRINTS ──
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sprints_select" ON public.sprints;
DROP POLICY IF EXISTS "sprints_insert" ON public.sprints;
DROP POLICY IF EXISTS "sprints_update" ON public.sprints;
DROP POLICY IF EXISTS "sprints_delete" ON public.sprints;
DROP POLICY IF EXISTS "sprints_all" ON public.sprints;
CREATE POLICY "sprints_select" ON public.sprints FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "sprints_insert" ON public.sprints FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'gestor') OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "sprints_update" ON public.sprints FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor') OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid())) WITH CHECK (public.get_user_role() IN ('admin', 'gestor') OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));
CREATE POLICY "sprints_delete" ON public.sprints FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor') OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.owner_id = auth.uid()));

-- ── 7. TASKS ──
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_select" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_delete" ON public.tasks;
DROP POLICY IF EXISTS "tasks_all" ON public.tasks;
CREATE POLICY "tasks_select" ON public.tasks FOR SELECT TO authenticated USING (public.is_member());
CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN ('admin', 'gestor', 'collaborator'));
CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor') OR owner_id = auth.uid()) WITH CHECK (public.get_user_role() IN ('admin', 'gestor') OR owner_id = auth.uid());
CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE TO authenticated USING (public.get_user_role() IN ('admin', 'gestor'));

-- ── 8. FUNNEL_COLUMNS (pode não existir — ignora erro) ──
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
    EXECUTE 'CREATE POLICY "funnel_columns_insert" ON public.funnel_columns FOR INSERT TO authenticated WITH CHECK (public.get_user_role() IN (''admin'', ''gestor''))';
    EXECUTE 'CREATE POLICY "funnel_columns_update" ON public.funnel_columns FOR UPDATE TO authenticated USING (public.get_user_role() IN (''admin'', ''gestor'')) WITH CHECK (public.get_user_role() IN (''admin'', ''gestor''))';
    EXECUTE 'CREATE POLICY "funnel_columns_delete" ON public.funnel_columns FOR DELETE TO authenticated USING (public.get_user_role() = ''admin'')';

    RAISE NOTICE 'funnel_columns: RLS policies atualizadas.';
  ELSE
    RAISE NOTICE 'funnel_columns: tabela não existe. Ignorando.';
  END IF;
END $$;

-- ── 9. Remover trigger de auto-criação ──
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ── 10. Verificação final ──
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;
