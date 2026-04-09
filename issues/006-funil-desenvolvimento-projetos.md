# Issue 006 — Funil de Desenvolvimento / Projetos (M2)

**Módulo:** M2 (Projetos)
**Prioridade:** Alta
**Dependências:** 003, 004

## Descrição

Implementar a tela de projetos com Kanban por etapa/sprint. Filtro por tipo (Recorrentes / Únicos / Todos). Card com nome do cliente, tipo (badge colorido), sprint atual, responsável. Drawer de detalhes com timeline de sprints. Modal para criar/editar sprint.

## Arquivos

- `[NEW]` `src/modules/projects/pages/ProjectsKanban.tsx` — Kanban com filtro por tipo no topo
- `[NEW]` `src/modules/projects/components/ProjectCard.tsx` — cliente, tipo badge, sprint, responsável, entrega
- `[NEW]` `src/modules/projects/components/ProjectDetailDrawer.tsx` — drawer com histórico de sprints
- `[NEW]` `src/modules/projects/components/SprintDialog.tsx` — modal criar/editar sprint
- `[NEW]` `src/modules/projects/hooks/useProjects.ts` — hook consumindo mockApi.projects
- `[MODIFY]` `src/app/Router.tsx` — substituir placeholder Projetos
