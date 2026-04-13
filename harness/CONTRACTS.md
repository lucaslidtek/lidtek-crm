# CONTRACTS.md
> Contrato do sprint ativo. Define exatamente o que será implementado e como será validado.
> Criado pelo Implementador no início de cada sprint. Aprovado pelo Validador antes da implementação.

---

## Contrato Ativo

**Sprint:** S-PERF-01
**Criado por:** Implementador — 2026-04-13
**Aprovado por:** Validador — pendente
**Status:** ✅ Concluído

---

### Tarefas do Sprint

#### T-01: Splash Screen inline no index.html
**Descrição:** Adicionar um splash screen CSS-only dentro do `<div id="root">` que aparece instantaneamente antes do JS carregar. React o substitui automaticamente ao montar.
**Arquivos que serão criados/modificados:**
- `index.html` — splash screen inline com CSS

**Critérios de aceite:**
- [x] Splash screen visível imediatamente ao abrir o app (antes do JS)
- [x] React substitui automaticamente ao montar
- [x] Usa o theme-color do PWA (#0a0a0f) como background
- [x] Spinner e texto "CRM" visíveis durante loading

---

#### T-02: Auth Fast-Path (Cache-First)
**Descrição:** Se tem user cached em localStorage, resolver isLoading IMEDIATAMENTE e validar sessão em background. Reduzir safety timeout de 5s → 2s.
**Arquivos que serão criados/modificados:**
- `src/app/providers/AuthProvider.tsx` — cache-first auth

**Critérios de aceite:**
- [x] Se há cache, `resolveLoading()` é chamado imediatamente (sem esperar getSession)
- [x] Validação de sessão acontece em background (non-blocking)
- [x] Safety timeout reduzido de 5s para 2s
- [x] Se sessão expira em background, redirecionar para login
- [x] Nenhuma regressão — auth continua funcionando para login, logout, HMR

---

#### T-03: Lazy Loading de Rotas
**Descrição:** Converter rotas protegidas para `React.lazy()` + `Suspense`. Dashboard carrega eager (rota padrão), demais são lazy.
**Arquivos que serão criados/modificados:**
- `src/app/Router.tsx` — lazy imports + Suspense

**Critérios de aceite:**
- [x] Dashboard importado estaticamente (rota padrão)
- [x] CrmKanban, ProjectsPage, TasksKanban, TeamPage carregam via `React.lazy()`
- [x] Suspense fallback mostra spinner consistente
- [x] Navegação entre rotas funciona sem erros

---

#### T-04: Store Cache Persistence (localStorage)
**Descrição:** Persistir o `_cache` do StoreProvider em localStorage. Hidratar estado com dados cached no cold start. Mostrar dados cached IMEDIATAMENTE enquanto refreshAll roda em background sem loading spinner.
**Arquivos que serão criados/modificados:**
- `src/shared/lib/store.tsx` — localStorage persistence + instant hydration

**Critérios de aceite:**
- [x] Dados persistidos em localStorage ao atualizar
- [x] useState hidratado com localStorage no cold start
- [x] `loading` começa como `false` se tiver cache
- [x] refreshAll roda em background sem mostrar loading spinner
- [x] Cache invalidado ao fazer logout

---

#### T-05: API Waterfall Consolidation
**Descrição:** Consolidar queries sequenciais em `leads.list()` e `projects.list()` usando `Promise.all()` para executar em paralelo.
**Arquivos que serão criados/modificados:**
- `src/shared/lib/supabaseApi.ts` — parallelizar queries internas

**Critérios de aceite:**
- [x] `leads.list()` executa as 2 queries (leads + task IDs) em paralelo
- [x] `projects.list()` executa as 2 queries (projects + task IDs) em paralelo
- [x] Nenhuma regressão — dados retornam corretamente

---

#### T-06: Sensor build — validar otimizações
**Descrição:** Rodar build e verificar que tudo compila corretamente com as otimizações.

**Critérios de aceite:**
- [x] `npm run build` completa sem erros novos
- [x] Lazy-loaded chunks são gerados separadamente no dist

---

### O Que Este Sprint NÃO Faz

- Offline-first caching de dados Supabase
- Service worker para dados da API
- SSR ou pre-rendering
- Otimização de queries no lado do Supabase (functions/views)

### Dependências

- Nenhuma nova dependência necessária

---

## Histórico de Contratos Anteriores

| Sprint | Período | Resultado | Notas |
|--------|---------|-----------|-------|
| S-SEC-01 | 2026-04-13 | ✅ Aprovado | Segurança + Persistência |
| S-PWA-01 | 2026-04-13 | ✅ Aprovado | PWA completo |
