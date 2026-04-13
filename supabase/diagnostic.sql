-- ============================================
-- DIAGNÓSTICO: Verificar estado das RLS policies
-- Cole e execute no Supabase SQL Editor
-- ============================================

-- 1. Listar TODAS as policies ativas
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 2. Verificar se as funções helper existem
SELECT proname, prosecdef AS security_definer
FROM pg_proc
WHERE proname IN ('is_member', 'get_user_role')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Verificar se RLS está habilitado em cada tabela
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN ('profiles', 'leads', 'interactions', 'projects', 'sprints', 'tasks', 'funnel_columns')
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 4. Verificar se o trigger de auto-criação está ativo
SELECT tgname AS trigger_name, tgenabled AS enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- 5. Testar is_member() para o usuário atual
-- (Isso só funciona se você estiver autenticado via API, não no SQL Editor)
-- SELECT public.is_member();
-- SELECT public.get_user_role();

-- 6. Contar perfis existentes
SELECT COUNT(*) AS total_profiles FROM public.profiles;

-- 7. Listar perfis (verificar se o seu existe)
SELECT id, name, email, role FROM public.profiles ORDER BY name;
