# Issue 010 — Setup Infraestrutura Supabase

**Prioridade:** Alta (Bloqueante — todas as issues seguintes dependem)
**Dependências:** Nenhuma
**Escopo:** Configuração base

## Descrição

Instalar o `@supabase/supabase-js`, criar o client Supabase configurado com variáveis de ambiente, e preparar o `.env` com as credenciais do projeto.

## Entregáveis

- `package.json` → adicionar `@supabase/supabase-js`
- `.env` → `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
- `.gitignore` → adicionar `.env` e `.env.local`
- `src/shared/lib/supabase.ts` → instância do client (`createClient`)
