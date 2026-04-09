# Issue 004 — Kanban Board Genérico (dnd-kit)

**Módulo:** Shared
**Prioridade:** Alta
**Dependências:** 002

## Descrição

Criar componente de Kanban Board reutilizável com drag-and-drop via @dnd-kit. Recebe colunas e cards genéricos (via render props ou slots), suporta scroll horizontal, e fornece feedback visual durante drag (ghost element, drop zone iluminada). Será instanciado por M1, M2 e M3.

## Arquivos

- `[NEW]` `src/shared/components/kanban/KanbanBoard.tsx` — container com DndContext, scroll horizontal
- `[NEW]` `src/shared/components/kanban/KanbanColumn.tsx` — coluna droppable, cabeçalho com título + contagem + cor
- `[NEW]` `src/shared/components/kanban/KanbanCard.tsx` — card draggable genérico, glass effect, slot para conteúdo
