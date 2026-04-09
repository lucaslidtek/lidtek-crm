# Issue 013 — API Layer Supabase (substituir mockApi)

**Prioridade:** Alta (Core)
**Dependências:** 010, 011
**Escopo:** Data layer

## Descrição

Criar `supabaseApi.ts` que implementa a **mesma interface** que `mockApi.ts` — ou seja, `api.leads.list()`, `api.leads.create()`, `api.projects.update()`, etc. — mas internamente usa o Supabase Client para queries reais. Após isso, trocar a linha de import no `store.tsx` de `mockApi` para `supabaseApi` (1 linha).

## Entregáveis

- `src/shared/lib/supabaseApi.ts` → implementação completa:
  - `api.users.*` (list, getById, getCurrent, create, update, delete)
  - `api.leads.*` (list, getById, create, update, updateStage, delete) — com JOIN de `interactions`
  - `api.projects.*` (list, getById, create, update) — com JOIN de `sprints`
  - `api.sprints.*` (create, update, complete, delete)
  - `api.tasks.*` (list, getById, create, update, updateStatus, delete)
- `src/shared/lib/store.tsx` → trocar import para `supabaseApi`

## Cenários

- **Happy path:** Leads carregam do Supabase com interações embeddadas
- **Edge case:** Tabela vazia → deve retornar array vazio, não erro
- **Edge case:** Criação de sprint → deve atualizar `current_sprint_id` do project
