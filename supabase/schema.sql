-- =============================================
-- LIDTEK CRM - Complete Schema
-- Execute in Supabase SQL Editor for project: symera (kwybsuniuehqddpjqpwl)
-- =============================================

-- 1. Ensure profiles table has all required columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. LEADS TABLE
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  phone TEXT,
  origin TEXT NOT NULL DEFAULT 'Outros',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT DEFAULT '',
  stage TEXT NOT NULL DEFAULT 'prospecting',
  next_contact_date TIMESTAMPTZ,
  estimated_value NUMERIC(12,2),
  billing_type TEXT,
  billing_cycle TEXT,
  solution_type TEXT,
  loss_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INTERACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_contact TEXT,
  client_phone TEXT,
  type TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'active',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  current_sprint_id UUID,
  next_delivery_date TIMESTAMPTZ,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SPRINTS TABLE
CREATE TABLE IF NOT EXISTS public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'onboarding',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CRM TASKS TABLE (named crm_tasks to avoid conflict with existing tasks table)
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'standalone',
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Enable RLS on all CRM tables
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies: Authenticated users can do everything
-- LEADS
DROP POLICY IF EXISTS "leads_select" ON public.leads;
CREATE POLICY "leads_select" ON public.leads FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
CREATE POLICY "leads_insert" ON public.leads FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "leads_update" ON public.leads;
CREATE POLICY "leads_update" ON public.leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "leads_delete" ON public.leads;
CREATE POLICY "leads_delete" ON public.leads FOR DELETE TO authenticated USING (true);

-- INTERACTIONS
DROP POLICY IF EXISTS "interactions_all" ON public.interactions;
CREATE POLICY "interactions_all" ON public.interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PROJECTS
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (true);

-- SPRINTS
DROP POLICY IF EXISTS "sprints_all" ON public.sprints;
CREATE POLICY "sprints_all" ON public.sprints FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CRM_TASKS
DROP POLICY IF EXISTS "crm_tasks_all" ON public.crm_tasks;
CREATE POLICY "crm_tasks_all" ON public.crm_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Verify - show all tables
SELECT table_name, 
  (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;
