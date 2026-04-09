# Plan 006 — Funil de Desenvolvimento / Projetos (M2)

## Descrição
Tela de projetos com Kanban por etapa/sprint. Filtro por tipo (Recorrentes / Únicos / Todos). Cards com badge de tipo, sprint atual, responsável. Drawer com timeline de sprints. Modal para criar/editar sprint.

## Módulo
M2 (Projetos) — F03, F05

## Arquivos

#### [NEW] `src/modules/projects/pages/ProjectsKanban.tsx`
- Barra de ação: título + filtro por tipo (3 botões toggle: Todos/Recorrentes/Únicos) + botão "Nova Sprint"
- Instancia `KanbanBoard` com colunas = `PROJECT_STAGES`
- Agrupa projetos por `currentSprint.stage`
- Filtro por tipo: filtra localmente os dados passados ao KanbanBoard
- Click no card → abre `ProjectDetailDrawer`

#### [NEW] `src/modules/projects/components/ProjectCard.tsx`
- Conteúdo:
  - **Nome do cliente** (h4 bold)
  - **Badge tipo**: recorrente (emerald) / único (blue-light)
  - **Sprint atual** (nome truncado, text-xs)
  - **Responsável** (avatar initials)
  - **Próxima entrega** (date, text-xs, ícone Calendar)

#### [NEW] `src/modules/projects/components/ProjectDetailDrawer.tsx`
- Drawer lateral direito, mesmo estilo do LeadDetailDrawer
- Conteúdo:
  - Header: nome cliente, badge tipo, badge status
  - Dados: contato, responsável, data criação
  - Timeline de Sprints: lista vertical com sprints (ativa destacada, passadas com check)
  - Tarefas da sprint ativa: lista das tasks vinculadas

#### [NEW] `src/modules/projects/components/SprintDialog.tsx`
- Dialog (modal) para criar/editar sprint:
  - Campos: Nome (obrigatório), Etapa (select com PROJECT_STAGES), Data início, Data fim (opcional)
  - Select de projeto (se criando de fora do contexto)
  - Botões: "Cancelar", "Salvar Sprint"

#### [NEW] `src/modules/projects/hooks/useProjects.ts`
- `useProjects(filterType?)` → `{ projects, projectsByStage, createSprint, updateSprint }`

#### [MODIFY] `src/app/Router.tsx`
- Substituir placeholder `ProjectsPage` por `ProjectsKanban`

## Cenários
- **Happy path:** Abrir /projects → ver 8 projetos no Kanban → filtrar por "Recorrentes" → ver apenas 4
- **Sprint:** Clicar card → drawer → ver timeline sprints → clicar "Nova Sprint" → form → sprint criada → card atualiza etapa
- **Tipos diferenciados:** Badges de cor diferente para recorrente vs único

## Checklist
- [ ] ProjectsKanban com KanbanBoard + stages + filtro tipo
- [ ] ProjectCard com badge tipo, sprint, responsável
- [ ] ProjectDetailDrawer com timeline de sprints
- [ ] SprintDialog com form de sprint
- [ ] useProjects hook
- [ ] Substituir placeholder no Router
