# Plan 004 — Kanban Board Genérico (dnd-kit)

## Descrição
Componente de Kanban reutilizável com drag-and-drop entre colunas. Usado pelos 3 módulos (M1, M2, M3) com conteúdo customizado via render props.

## Módulo
Shared — suporta F01, F03, F06

## Arquivos

#### [NEW] `src/shared/components/kanban/KanbanBoard.tsx`
```typescript
interface KanbanBoardProps<T> {
  columns: KanbanColumnDef[];
  items: Record<string, T[]>;     // agrupados por column id
  onMoveItem: (itemId: string, fromColumn: string, toColumn: string) => void;
  renderCard: (item: T) => ReactNode;
  onCardClick?: (item: T) => void;
}
```
- `DndContext` do `@dnd-kit/core`
- Sensors: PointerSensor com `activationConstraint: { distance: 5 }` (evita click acidental)
- `DragOverlay` com clone do card sendo arrastado (ghost visual)
- Container com `overflow-x-auto` para scroll horizontal
- Layout: flex horizontal, gap entre colunas

#### [NEW] `src/shared/components/kanban/KanbanColumn.tsx`
```typescript
interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  color: string;            // cor do indicador da etapa
  children: ReactNode;       // cards
}
```
- `useDroppable` do dnd-kit
- Cabeçalho: título + badge com contagem + dot de cor da etapa
- Drop zone: borda iluminada (`border-primary/30`) quando item está sendo arrastado sobre
- Fundo: `glass-subtle` para diferenciar do bg
- Min-width: `280px`, max-width: `320px`

#### [NEW] `src/shared/components/kanban/KanbanCard.tsx`
```typescript
interface KanbanCardProps {
  id: string;
  children: ReactNode;       // conteúdo customizado pelo módulo
  onClick?: () => void;
}
```
- `useSortable` do `@dnd-kit/sortable`
- Wrapper `glass` com `cursor-grab` / `active:cursor-grabbing`
- Hover: `translate-y-[-2px]`, transição `300ms`
- Ao arrastar: `opacity-50` no original, `DragOverlay` com card visível
- `rounded-xl p-4`

## Design
- Glassmorphism sutíl nas colunas (`glass-subtle`)
- Cards com `glass` padrão
- Drop zone highlights com `border-primary/30`
- Smooth transitions via Framer Motion no DragOverlay

## Cenários
- **Happy path:** Drag card de uma coluna para outra → `onMoveItem` chamado → card aparece na nova coluna
- **Edge case:** Drag cancelado (esc / drop fora) → card volta à posição original
- **Edge case:** Coluna vazia → mostra placeholder "Nenhum item"

## Checklist
- [ ] KanbanBoard com DndContext e DragOverlay
- [ ] KanbanColumn com useDroppable e highlight
- [ ] KanbanCard com useSortable e grab cursor
- [ ] Scroll horizontal funcional
- [ ] Placeholder para colunas vazias
