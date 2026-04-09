# Issue 007 — Gestão de Tarefas (M3)

**Módulo:** M3 (Tarefas)
**Prioridade:** Alta
**Dependências:** 003, 004

## Descrição

Implementar a tela de tarefas com Kanban por status (A fazer / Em andamento / Concluída / Bloqueada). Cards com prioridade, responsável, prazo e vínculo (projeto ou lead). Filtros por tipo (projeto/vendas/avulsa), status, prioridade. Modal de criação rápida. Alertas visuais: vencida (vermelho), 48h (amarelo).

## Arquivos

- `[NEW]` `src/modules/tasks/pages/TasksKanban.tsx` — Kanban por status + barra de filtros
- `[NEW]` `src/modules/tasks/components/TaskCard.tsx` — título, prioridade badge, responsável, prazo, vínculo
- `[NEW]` `src/modules/tasks/components/TaskCreateDialog.tsx` — modal rápido de criação
- `[NEW]` `src/modules/tasks/components/TaskFilters.tsx` — filtros por tipo, status, prioridade
- `[NEW]` `src/modules/tasks/hooks/useTasks.ts` — hook consumindo mockApi.tasks
- `[MODIFY]` `src/app/Router.tsx` — substituir placeholder Tarefas
