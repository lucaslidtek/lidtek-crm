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

### Tarefas Ad-Hoc

#### T-AD-10: Hotfix — TaskEditDialog fica travado em "Salvando..." (Realtime race condition)
**Tipo:** Ad-hoc — solicitada em 2026-04-22
**Descrição:** Ao salvar uma tarefa, o botão fica eternamente em "Salvando..." e o modal não fecha. Os dados são salvos no banco, mas o estado `loading` fica preso em `true`. Root cause: o Realtime subscription dispara `scheduleTasksRefresh()` ~600ms após o UPDATE no banco. Isso chama `setTasks()` no store, causando re-render do componente pai que passa um novo objeto `task` (nova referência) ao `TaskEditDialog`. O `useEffect` do dialog detecta a mudança e executa, resetando o form — **porém sem chamar `setLoading(false)`**. Se isso acontecer enquanto o `await updateTask()` ainda está pendente (esperando `refreshTasks()`), o estado de loading fica dessincronizado. Além disso, não há timeout de segurança no `updateTask` do store — se a promise travar, o dialog fica preso para sempre.
**Critérios de aceite:**
- [ ] Modal fecha normalmente após salvar uma tarefa
- [ ] Botão "Salvando..." não fica preso após re-abrir o dialog
- [ ] Se updateTask demorar mais de 10s, o usuário recebe mensagem de erro (timeout)
- [ ] Dados continuam sendo salvos corretamente
**Arquivos modificados:** `src/modules/tasks/components/TaskEditDialog.tsx`, `src/shared/lib/store.tsx`
**Sensores rodados:** [x] type-check (0 erros novos, erros pré-existentes documentados) [ ] lint
**Status:** ✅ Concluído

---

#### T-AD-09: Feature — Persistência de Filtros e Visões
**Tipo:** Ad-hoc — solicitada em 2026-04-17
**Descrição:** Quando mudávamos filtros e visualizações nas páginas Kanban (CRM, Tasks, Projects) e trocávamos de página, o estado voltava ao padrão por ser mantido apenas em \`useState\`. Criado o hook \`useLocalStorage\` (uma camada reactiva sobre localStorage) e aplicado nas páginas para manter \`view\`, filtros e estágios do grid/list.
**Critérios de aceite:**
- [x] O usuário volta para a tela de CRM, Projetos ou Tarefas e mantém: filtros ativados, abas, e o tipo de visualização.
- [x] Sincronização multi-aba nativa baseada no StorageEvent dentro do novo hook \`useLocalStorage\`
**Arquivos modificados:** \`src/shared/hooks/useLocalStorage.ts\`, \`src/modules/tasks/pages/TasksKanban.tsx\`, \`src/modules/projects/pages/ProjectsPage.tsx\`, \`src/modules/crm/pages/CrmKanban.tsx\`
**Sensores rodados:** [x] type-check (0 erros novos)
**Status:** ✅ Concluído

---

#### T-AD-08: Feature — SprintRow mostra badge "Hoje" / "Atrasada" no DatePicker da sprint
**Tipo:** Ad-hoc — solicitada em 2026-04-17 11:05
**Descrição:** O `DatePicker` no `SprintRow` usa `new Date(sprint.dueDate) < new Date()` para escolher o variant, com o mesmo bug de timezone. Além disso, não existe variant "hoje". Corrigir usando `toLocalNoon()` e adicionar variant `badge-today` no DatePicker.
**Critérios de aceite:**
- [x] Sprint com dueDate = hoje mostra badge de cor âmbar ("Hoje" ou similar)
- [x] Sprint com dueDate passado mostra badge vermelho ("Atrasada")
- [x] Fix de timezone aplicado em ambos os renders (desktop e mobile)
**Arquivos modificados:** `src/modules/projects/components/ProjectListView.tsx`
**Sensores rodados:** [ ] type-check
**Status:** ✅ Concluído

---

#### T-AD-07: Feature — Tarefas do dia destacadas no Dashboard e TaskCard
**Tipo:** Ad-hoc — solicitada em 2026-04-17 11:01
**Descrição:** Tarefas com `dueDate` = hoje devem ter tratamento visual próprio. No Dashboard, aparecem no banner como "N tarefa(s) para hoje". No TaskCard, exibem badge "Hoje" com barra lateral âmbar.
**Critérios de aceite:**
- [x] Dashboard: banner mostra "N tarefa(s) para hoje" separado das atrasadas
- [x] TaskCard: badge "Hoje" com cor âmbar, barra lateral âmbar
- [x] Date label no footer âmbar quando for hoje
**Arquivos modificados:** `src/modules/dashboard/pages/Dashboard.tsx`, `src/modules/tasks/components/TaskCard.tsx`
**Sensores rodados:** [ ] type-check [ ] lint
**Status:** ✅ Concluído

---

#### T-AD-06: Hotfix — Dashboard mostra "1 tarefa atrasada" incorretamente (timezone offset)
**Tipo:** Ad-hoc — solicitada em 2026-04-17 10:54
**Descrição:** O filtro `overdueTasks` compara `new Date(t.dueDate) < now` onde `t.dueDate = '2026-04-17'` é interpretado como `2026-04-17T00:00:00Z` = `2026-04-16T21:00:00-03:00`, ficando no passado durante o dia 17/04. A tarefa "Inscrição Feira Hospitalar" com dueDate 17/04 aparece como atrasada apesar de estar no prazo. O mesmo padrão de fix de timezone (`split('T')[0] + 'T12:00:00'`) já usado na *exibição* da data deve ser aplicado na *comparação*.
**Root Cause:** Datas `YYYY-MM-DD` do banco são interpretadas como UTC midnight, que no fuso -03:00 corresponde ao dia anterior. A comparação `< now` resulta em falso positivo quando a data de vencimento é o dia atual.
**Critérios de aceite:**
- [x] Tarefas com dueDate igual ao dia atual **não** aparecem como atrasadas no banner do Dashboard
- [x] Tarefas com dueDate do dia anterior ou anterior ainda aparecem como atrasadas
- [x] O banner "atenção pendente" some quando não há tarefas genuinamente atrasadas
**Arquivos modificados:** `src/modules/dashboard/pages/Dashboard.tsx`
**Sensores rodados:** [ ] type-check [ ] lint
**Status:** ✅ Concluído

---

#### T-AD-05: Hotfix — Login Google redireciona de volta para tela de login (race condition + migration wipe)
**Tipo:** Ad-hoc — solicitada em 2026-04-17 09:28
**Descrição:** Após login com Google, o usuário é redirecionado de volta para `/login` ao invés de entrar no sistema. Root causes identificados: (1) O bloco de migração (`AUTH_MIGRATION_KEY`) apaga o `AUTH_STORAGE_KEY` a cada chamada inicial, zerando o cache de sessão — isso faz o `isLoading` iniciar como `true`; (2) Após o redirect OAuth, `resolveLoading()` é chamado antes do `setUser()` atualizar o estado React, causando um frame em que `isLoading=false` + `isAuthenticated=false` → `PrivateRoute` redireciona para `/login`; (3) O `flowType: 'implicit'` foi declarado mas o redirect URI não estava configurado para o hash fragment.
**Root Cause:** Race condition em `resolveLoading()` vs `setUser()` + migration code que zera o cache de sessão desnecessariamente.
**Critérios de aceite:**
- [ ] Login com Google funciona consistentemente — entra no dashboard sem redirect de volta
- [ ] Sessão persiste após commits/HMR (não é resetada por código de migração)
- [ ] Sessão persiste após reload de página
- [ ] `PrivateRoute` não redireciona para login enquanto auth está sendo processado
**Arquivos modificados:** `src/app/providers/AuthProvider.tsx`, `src/app/PrivateRoute.tsx`, `src/shared/lib/supabase.ts`
**Sensores rodados:** [x] type-check (0 erros novos) [ ] lint [ ] build
**Status:** ✅ Concluído

---

#### T-AD-04: Hotfix — Timeout ao salvar tarefa (RLS UPDATE blocks admin via owner_id check)
**Tipo:** Ad-hoc — solicitada em 2026-04-16 21:05
**Descrição:** Lucas (admin) não consegue salvar tarefas criadas por outros usuários. O `tasks_update` RLS verifica `owner_id = auth.uid()` mas tasks antigas têm `owner_id` com IDs pré-migração. A condição `get_user_role() = 'admin'` deveria bastar, mas a policy `with_check` também avalia `owner_id` no UPDATE. O timeout de 10s no `updateTask` dispara porque o UPDATE não retorna nenhuma linha (RLS silenciosamente bloqueia → `.single()` trava esperando). Fix: Atualizar a policy RLS `tasks_update` para usar `is_member()` como USING (semelhante ao SELECT) e manter admin/gestor com acesso total no WITH CHECK.
**Root Cause:** `tasks_update` policy tem `with_check` que falha para admins editando tasks de outros porque `owner_id` (campo legado) não coincide com `auth.uid()`.
**Critérios de aceite:**
- [x] Lucas consegue salvar tarefas de Rafael (e qualquer outro membro) sem timeout
- [x] RLS continua protegendo: apenas membros autenticados podem atualizar tasks
- [x] Admins/gestores podem editar qualquer task
- [x] Collaborators só editam suas próprias tasks
**Arquivos modificados:** Supabase RLS policy (migration SQL)
**Sensores rodados:** [x] migration aplicada com sucesso [ ] type-check [ ] lint [ ] testes [ ] build
**Status:** ✅ Concluído

---

#### T-AD-03: Realtime — Sprints/Projects/Tasks aparecem em tempo real para todos os usuários
**Tipo:** Ad-hoc — solicitada em 2026-04-16 17:43
**Descrição:** Quando um usuário cria uma sprint ou task, os outros usuários conectados não veem a mudança sem recarregar. Isso ocorre porque o store usa apenas fetch inicial + visibilitychange. É necessário adicionar subscriptions Supabase Realtime nos channels de `projects` e `tasks` para disparar refreshes no store de todos os clientes conectados automaticamente.
**Root Cause:** Store não possui Supabase Realtime subscriptions — depende apenas de fetch manual e visibilitychange.
**Critérios de aceite:**
- [x] Quando usuário A cria uma sprint, usuário B vê a sprint aparecer sem recarregar (<3s)
- [x] Quando usuário A cria uma task, usuário B vê a task aparecer sem recarregar
- [x] Quando usuário A deleta/atualiza sprint ou task, usuário B reflete a mudança
- [x] Subscriptions são limpas corretamente no unmount (sem memory leak)
- [x] Subscriptions só ficam ativas quando o usuário está autenticado
**Arquivos modificados:** `src/shared/lib/store.tsx`
**Sensores rodados:** [x] type-check (0 erros novos) [ ] lint [ ] testes [ ] build
**Status:** ✅ Concluído

---


#### T-AD-02: Hotfix — Dialog "Criando..." travado (FK mismatch de profile IDs)
**Tipo:** Ad-hoc — solicitada em 2026-04-16 17:24
**Descrição:** O Rafael (e demais usuários) têm `profiles.id` diferente do `auth.uid()`. Quando o front manda `owner_id = currentUser.id` (auth UID), o INSERT falha com FK violation porque `profiles.id` ≠ `auth.uid()`. O dialog fica travado em "Criando..." porque o erro não é visível.
**Root Cause:** Profile IDs criados manualmente não coincidem com auth.uid() do Supabase.
**Critérios de aceite:**
- [x] `profiles.id` do Rafael e demais usuários atualizados para coincidir com `auth.uid()`
- [x] Todos os registros (leads, tasks, projects) com owner_id atualizados em cascade
- [x] `createLead` e `createTask` passam a funcionar para as contas afetadas
- [x] Timeout de 15s adicionado ao `createLead` e `createTask` (igual ao createSprint) para evitar hang infinito
**Sensores rodados:** [x] type-check (0 erros novos) [ ] lint [ ] testes [ ] build
**Status:** ✅ Concluído

---

#### T-AD-01: Limpeza de Débito Técnico (TSC)
**Tipo:** Ad-hoc — solicitada em 2026-04-15 17:22
**Descrição:** Corrigir 6 erros de TypeScript pré-existentes identificados pelo sensor harness:check.
**Critérios de aceite:**
- [x] npm run harness:check retorna exit code 0
- [x] Nenhum erro de tipo remanescente nos arquivos afetados
**Sensores rodados:** [x] type-check [ ] lint [ ] testes [ ] build
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
