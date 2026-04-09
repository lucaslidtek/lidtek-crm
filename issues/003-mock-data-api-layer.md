# Issue 003 — Mock Data e API Layer

**Módulo:** Infraestrutura
**Prioridade:** Alta
**Dependências:** Nenhuma (pode rodar em paralelo com 002)

## Descrição

Criar dados mock realistas (leads, projetos, tarefas, usuários) e uma camada de API com interface Promise-based e persistência em localStorage. A interface deve ser idêntica ao que seria uma API real, facilitando o swap futuro.

## Arquivos

- `[NEW]` `src/shared/data/mockUsers.ts` — 4-5 usuários (um por persona do PRD)
- `[NEW]` `src/shared/data/mockLeads.ts` — 12-15 leads distribuídos pelas 8 etapas
- `[NEW]` `src/shared/data/mockProjects.ts` — 6-8 projetos (mix recorrentes/únicos) com sprints
- `[NEW]` `src/shared/data/mockTasks.ts` — 15-20 tarefas dos 3 tipos, mix de status/prioridade
- `[NEW]` `src/shared/lib/mockApi.ts` — CRUD completo (leads, projects, sprints, tasks)
- `[NEW]` `src/shared/lib/store.ts` — Context API para estado global + sync localStorage
- `[NEW]` `src/shared/types/models.ts` — interfaces TypeScript (Lead, Project, Sprint, Task, User)
