# Plan 007 — Gestão de Tarefas (M3)

## Descrição
Tela de tarefas com Kanban por status (A fazer / Em andamento / Concluída / Bloqueada). Filtros por tipo, prioridade, responsável. Modal de criação rápida. Alertas visuais de vencimento.

## Módulo
M3 (Tarefas) — F06

## Arquivos

#### [NEW] `src/modules/tasks/pages/TasksKanban.tsx`
- Barra de ação: título + `TaskFilters` + botão "Nova Tarefa"
- Instancia `KanbanBoard` com colunas = `TASK_STATUSES`
- Agrupa tarefas por `status`
- Filtra por tipo/prioridade/responsável antes de passar ao KanbanBoard
- `onMoveItem` → `api.tasks.updateStatus()`
- Click no card → abre `TaskCreateDialog` em modo edição (futuro) ou apenas move

#### [NEW] `src/modules/tasks/components/TaskCard.tsx`
- Conteúdo:
  - **Título** (text-sm font-medium)
  - **Badge prioridade**: alta (vermelho), média (amarelo), baixa (cinza)
  - **Badge tipo**: projeto (primary), vendas (blue-light), avulsa (muted)
  - **Responsável** (avatar initials, text-xs)
  - **Prazo** (date, text-xs)
  - **Vínculo** (se tarefa de projeto/vendas: nome do projeto ou lead, text-xs muted)
  - **Alerta vencimento**:
    - Vencida: borda left vermelha + badge "ATRASADA"
    - 48h: borda left amarela + badge "EM 48H"

#### [NEW] `src/modules/tasks/components/TaskCreateDialog.tsx`
- Dialog rápido (meta: < 20 segundos para criar):
  - Campos: Título (obrigatório), Tipo (select: projeto/vendas/avulsa), Prioridade (select), Responsável (select), Prazo (date), Descrição (textarea, opcional)
  - Se tipo = projeto: select de projeto/sprint
  - Se tipo = vendas: select de lead
  - Botões: "Cancelar", "Criar Tarefa"

#### [NEW] `src/modules/tasks/components/TaskFilters.tsx`
- Barra horizontal de filtros:
  - Tipo: botões toggle (Todos / Projeto / Vendas / Avulsa)
  - Prioridade: botões toggle (Todas / Alta / Média / Baixa)
  - Responsável: select dropdown
- Filtros são estado local do componente pai (TasksKanban)

#### [NEW] `src/modules/tasks/hooks/useTasks.ts`
- `useTasks(filters?)` → `{ tasks, tasksByStatus, createTask, updateTask, moveTask }`

#### [MODIFY] `src/app/Router.tsx`
- Substituir placeholder `TasksPage` por `TasksKanban`

## Design
- Cards de tarefa mais compactos que leads/projetos (menos padding)
- Alertas de vencimento: borda esquerda colorida (3px) + badge no card
- Filtros: botões toggle com estado ativo = `bg-primary/15 text-primary`

## Cenários
- **Happy path:** Abrir /tasks → ver 20 tarefas no Kanban → arrastar tarefa de "A fazer" pra "Em andamento"
- **Filtrar:** Clicar "Projeto" → ver apenas tarefas de projeto → clicar "Alta" → ver apenas alta prioridade de projeto
- **Criar rápida:** Clicar "Nova Tarefa" → preencher título + tipo + prioridade → Criar → card aparece no "A fazer"
- **Alertas:** Task vencida = borda vermelha + "ATRASADA". Task vencendo em 48h = borda amarela

## Checklist
- [ ] TasksKanban com KanbanBoard + 4 colunas de status
- [ ] TaskCard com badges + alerta vencimento
- [ ] TaskCreateDialog com form rápido
- [ ] TaskFilters com toggles
- [ ] useTasks hook
- [ ] Substituir placeholder no Router
