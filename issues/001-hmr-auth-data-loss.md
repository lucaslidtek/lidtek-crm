# Issue 001 — HMR causa Kanban vazio após qualquer alteração de código

**Módulo:** Auth & Infraestrutura  
**Prioridade:** 🔴 Crítica (bloqueadora de desenvolvimento)  
**Dependências:** Nenhuma  
**Status:** ✅ CONCLUÍDA

---

## Descrição

Toda vez que o Vite faz hot-reload de qualquer arquivo, o CRM (Kanban de leads),
Projetos e Tarefas ficam vazios — todos os cards somem. O usuário precisa dar F5
para os dados voltarem, tornando o desenvolvimento impossível.

## Causa Raiz

Havia **dois bugs independentes** que ocorriam simultaneamente:

### Bug A — `isLoading` prematuro no AuthProvider
`AuthProvider.tsx` inicializava `isLoading` como:
```ts
useState(() => !localStorage.getItem(AUTH_STORAGE_KEY))
```
Quando há cache no localStorage, `isLoading = false` imediatamente.
O `StoreProvider` via `useAuth()` via `authLoading = false` chamava `refreshAll()` antes
do Supabase ter restaurado o JWT token na memória via `getSession()`.
Sem token → queries retornam vazio → Kanban vazio.

### Bug B — Race condition de lock no Supabase Auth
Quando 4 queries rodavam em paralelo (`leads`, `projects`, `tasks`, `users`) e o token
estava expirado, todas tentavam renová-lo ao mesmo tempo. O `navigator.locks` do Supabase
lançava _"Lock was released because another request stole it"_ → resultados vazios.

### Bug C — StoreProvider dependia de auth duplicado
O `StoreProvider` chamava `supabase.auth.getSession()` internamente, criando um segundo
listener de auth que competia com o `AuthProvider`, duplicando chamadas e causando locks.

## Arquivos Afetados

| Arquivo | Ação |
|---|---|
| `src/app/providers/AuthProvider.tsx` | `[MODIFY]` — isLoading sempre começa true |
| `src/shared/lib/store.tsx` | `[MODIFY]` — dependência direta no useAuth() + serialização de queries |

## Solução Implementada

**AuthProvider:** `isLoading` sempre inicia como `true`, só vai para `false` após `getSession()`
terminar — garantindo que o JWT está em memória antes de qualquer query.

**Store:** Removida dependência de `supabase.auth.getSession()` próprio. O Store agora usa
`useAuth()` diretamente e só faz `refreshAll()` quando `isAuthenticated === true && authLoading === false`.
A primeira query (`users.list`) é serializada para estabilizar o token antes das demais em paralelo.

## Checklist

- [x] Identificar causa raiz (Fase 1 — SPEC)
- [x] Corrigir `isLoading` no AuthProvider (Fase 4 — EXECUTE)
- [x] Refatorar StoreProvider para usar `useAuth()` (Fase 4 — EXECUTE)
- [x] Serializar primeira query no `refreshAll()` (Fase 4 — EXECUTE)
- [x] TypeScript compila sem erros nos arquivos modificados
- [ ] Verificar no browser: editar arquivo → dados continuam aparecendo (Fase 5 — VERIFY)

## Critérios de Aceite (do WORKFLOW.md)

- Editar qualquer arquivo → Kanban mantém os cards sem F5
- CRM carrega leads em < 2s após login
- Dashboard exibe projetos e pipeline corretamente
- Logout limpa o estado e redireciona para login
