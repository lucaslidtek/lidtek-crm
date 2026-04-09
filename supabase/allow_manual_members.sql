-- ============================================
-- MIGRAÇÃO: Permitir membros sem conta de auth
-- Executa no Supabase SQL Editor
-- ============================================
-- Esta abordagem é segura: apenas REMOVE a FK constraint que liga
-- profiles.id → auth.users. A tabela e todos os dados são preservados.
-- As FKs de leads/projects/tasks/interactions → profiles continuam intactas.
-- ============================================

-- PASSO 1: Verificar o nome da constraint (rode isso primeiro para confirmar)
-- SELECT conname
-- FROM pg_constraint
-- WHERE conrelid = 'public.profiles'::regclass
--   AND contype = 'f';

-- PASSO 2: Remover a FK constraint (profiles.id → auth.users)
-- O Supabase cria essa constraint com o nome "profiles_id_fkey"
DO $$
DECLARE
  constraint_name text;
BEGIN
  -- Descobre o nome da FK que aponta para auth.users
  SELECT conname INTO constraint_name
  FROM pg_constraint c
  JOIN pg_class r ON r.oid = c.conrelid
  JOIN pg_namespace n ON n.oid = r.relnamespace
  WHERE n.nspname = 'public'
    AND r.relname = 'profiles'
    AND c.contype = 'f'
    AND c.confrelid = (
      SELECT oid FROM pg_class
      WHERE relname = 'users'
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
    );

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', constraint_name);
    RAISE NOTICE 'Constraint removida: %', constraint_name;
  ELSE
    RAISE NOTICE 'Nenhuma FK para auth.users encontrada em profiles.';
  END IF;
END $$;

-- PASSO 3: Garantir que o ID tem valor padrão (UUID auto-gerado)
ALTER TABLE public.profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- PASSO 4: Atualizar o trigger com ON CONFLICT para segurança
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, initials, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário'),
    COALESCE(new.email, ''),
    UPPER(
      COALESCE(
        LEFT(new.raw_user_meta_data->>'full_name', 1) ||
        COALESCE(LEFT(SPLIT_PART(new.raw_user_meta_data->>'full_name', ' ', 2), 1), ''),
        LEFT(COALESCE(new.email, 'U'), 2)
      )
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
