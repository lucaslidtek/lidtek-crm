# Issue 014 — Auth Google OAuth via Supabase

**Prioridade:** Alta
**Dependências:** 010, 011
**Escopo:** Auth + UI (Login)

## Descrição

Substituir o auth mock por Supabase Auth com Google OAuth. O `AuthProvider` passará a usar `supabase.auth.signInWithOAuth()` e `onAuthStateChange()`. A tela de Login terá o botão "Entrar com Google" real. Ao autenticar, o trigger do banco cria automaticamente o `profiles` row.

## Entregáveis

- `src/app/providers/AuthProvider.tsx` → rewrite com Supabase Auth:
  - `login()` → `signInWithOAuth({ provider: 'google' })`
  - `logout()` → `signOut()`
  - Session listener via `onAuthStateChange`
  - Buscar/mapear `profiles` row após login
- `src/modules/auth/pages/Login.tsx` → botão "Entrar com Google" (mantendo design)
- `src/app/PrivateRoute.tsx` → adicionar loading state para check async

## Cenários

- **Happy path:** Usuário clica "Google" → redireciona → volta autenticado
- **Primeiro login:** Profile é criado automaticamente pelo trigger do banco
- **Sessão expirada:** Redireciona para /login automaticamente
