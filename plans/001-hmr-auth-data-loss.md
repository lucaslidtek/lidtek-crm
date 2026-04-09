# Plan 001 — HMR causa Kanban vazio (Lidtek CRM)

## Descrição

Após qualquer hot-reload do Vite (HMR), todos os dados somem: leads, projetos, tarefas.
O CRM fica com Kanban vazio e o usuário precisa recarregar a página para ver os dados.
Bloqueia completamente o desenvolvimento iterativo no projeto.

## Módulo Afetado

- **Auth & Infraestrutura** — transversal, afeta M1 (CRM), M2 (Projetos), M3 (Tarefas), M4 (Dashboard)
- Funcionalidades: `F01` (Funil de Vendas), `F03` (Funil de Desenvolvimento), `F06` (Tarefas), `F07` (Dashboard)

---

## Arquivos

### [MODIFY] `src/app/providers/AuthProvider.tsx`

**O que muda:**  
`isLoading` passa a **sempre iniciar como `true`** (independente do cache localStorage).
Antes: `useState(() => !localStorage.getItem(AUTH_STORAGE_KEY))` — iniciava `false` quando havia cache.  
Depois: `useState(true)` — sempre aguarda `getSession()` completar antes de liberar o Store.

**Por que:** O Store usa `authLoading` do `useAuth()` como sinal para disparar `refreshAll()`.
Se `authLoading = false` prematuramente, o Store faz queries antes do JWT estar em memória → vazio.

### [MODIFY] `src/shared/lib/store.tsx`

**O que muda:**
1. Remove `import { supabase }` — não mais usa `getSession()` próprio
2. Adiciona `import { useAuth }` — dependência direta no AuthProvider
3. `StoreProvider` usa `useAuth()` para saber quando buscar dados
4. `useEffect` aguarda `authLoading === false && isAuthenticated === true`
5. `fetchedRef` previne double-fetch durante o mesmo ciclo de auth
6. `refreshAll()` serializa a primeira query (`users.list`) para estabilizar o token

---

## Dados / State

| Contexto | Campo | Antes | Depois |
|---|---|---|---|
| `AuthProvider` | `isLoading` | `false` se tem cache localStorage | Sempre `true` até `getSession()` |
| `StoreProvider` | Trigger de fetch | `onAuthStateChange` + `getSession()` próprio | `useAuth().isAuthenticated` |
| `StoreProvider` | Queries | 4 em paralelo simultâneas | 1 serializada + 3 em paralelo |

---

## Cenários

### Happy path — HMR normal
1. Dev salva um arquivo → Vite HMR
2. `StoreProvider` desmonta/remonta → `fetchedRef.current = false`
3. `AuthProvider` NÃO remonta (está acima na árvore)
4. `isAuthenticated = true` (do `getSession()` já feito) + `authLoading = false`
5. `useEffect` roda → `fetchedRef.current = false` → chama `refreshAll()`
6. `users.list()` primeiro → token estabilizado → `leads + projects + tasks` em paralelo
7. ✅ Dados aparecem após ~300ms (sem F5)

### Happy path — Primeiro acesso (login)
1. `getSession()` do AuthProvider retorna a sessão
2. `isLoading = false`, `isAuthenticated = true`
3. Store detecta via `useEffect` → `refreshAll()`
4. ✅ Igual a antes

### Happy path — Logout
1. Usuário clica "sair" → `supabase.auth.signOut()`
2. AuthProvider: `setUser(null)` → `isAuthenticated = false`
3. Store `useEffect` detecta → limpa todos os arrays + `fetchedRef = false`
4. ✅ Estado limpo, redirect para /login

### Edge case — Token expirado durante desenvolvimento
1. JWT expira enquanto dev está trabalhando
2. HMR → `refreshAll()` → `users.list()` → Supabase renova o token automaticamente (1 request)
3. `leads + projects + tasks` em paralelo com token renovado
4. ✅ Resolvido pela serialização da primeira query

### Edge case — Double-fetch por re-render do React
1. `isAuthenticated` e `authLoading` mudam ao mesmo tempo → potencial 2x render
2. `fetchedRef.current` previne o segundo `refreshAll()` no mesmo ciclo
3. ✅ Seguro

---

## Design / UX

Sem mudanças visuais permanentes.
- **Antes do fix:** HMR → Kanban vazio indefinidamente
- **Depois do fix:** HMR → spinner de ~300ms (getSession) → Kanban com dados

O spinner de ~300ms é aceitável, pois o `PrivateRoute` já mostrava spinner enquanto `isLoading=true`.
Com o cache localStorage, o `user` já está disponível instantaneamente (sem flash de login).

---

## Checklist de Implementação

- [x] Grep: confirmar que `supabase` não é mais importado no `store.tsx`
- [x] Confirmar que `useAuth()` pode ser usado dentro de `StoreProvider` (está abaixo de `AuthProvider` na árvore)
- [x] Verificar que `refreshAll()` ainda funciona quando chamado manualmente (ex: após criar lead)
- [x] Confirmar que o `fetchedRef` não bloqueia re-fetches explícitos das actions
- [x] HMR fast-path adicionado no `AuthProvider` (resolve `isLoading` imediatamente se há cache)
- [x] TypeScript sem erros novos nos arquivos modificados
- [ ] **VERIFY:** editar arquivo qualquer → Kanban mantém os cards (Fase 5)

## Verificação Final (Fase 5)

```bash
# No terminal do projeto
npm run dev
# Abrir http://localhost:5173, logar, ver leads no CRM
# Editar src/index.css ou qualquer componente
# Confirmar: leads ainda aparecem SEM F5
# Confirmar: atualizar um lead → persiste no Supabase
```
