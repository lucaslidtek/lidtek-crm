import { useState, useCallback, useRef, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  closestCenter as _closestCenter,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { Plus } from 'lucide-react';
import type { StageConfig } from '@/shared/lib/constants';

interface KanbanBoardProps<T extends { id: string }> {
  columns: (StageConfig & { isDefault?: boolean })[];
  items: Record<string, T[]>;
  onMoveItem: (itemId: string, fromColumn: string, toColumn: string) => void;
  renderCard: (item: T) => ReactNode;
  onCardClick?: (item: T) => void;
  onChangeOrder?: (items: Record<string, T[]>) => void;
  onAddColumn?: () => void;
  onEditColumn?: (columnId: string) => void;
  onDeleteColumn?: (columnId: string) => void;
}

// Custom collision detection: prioritize pointerWithin, fallback to rectIntersection
const multiCollisionDetection: CollisionDetection = (args) => {
  // First check if pointer is within a droppable
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;

  // Fallback to rect intersection
  return rectIntersection(args);
};

export function KanbanBoard<T extends { id: string }>({
  columns,
  items: externalItems,
  onMoveItem,
  renderCard,
  onCardClick,
  onChangeOrder,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
}: KanbanBoardProps<T>) {
  const [activeItem, setActiveItem] = useState<T | null>(null);
  // Local copy of items for real-time reordering during drag
  const [localItems, setLocalItems] = useState<Record<string, T[]> | null>(null);
  const dragFromColumn = useRef<string>('');

  // Use localItems during drag, externalItems otherwise
  const displayItems = localItems ?? externalItems;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  // Find which column contains a given item id
  const findColumn = useCallback((id: string, itemsMap: Record<string, T[]>): string | null => {
    // Check if id is a column id
    if (itemsMap[id]) return id;
    // Search through all columns
    for (const [columnId, columnItems] of Object.entries(itemsMap)) {
      if (columnItems.some(item => item.id === id)) return columnId;
    }
    return null;
  }, []);

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const id = String(active.id);

    // Snapshot items for local manipulation
    setLocalItems(structuredClone(externalItems));

    // Find active item and remember source column
    for (const [columnId, columnItems] of Object.entries(externalItems)) {
      const item = columnItems.find(i => i.id === id);
      if (item) {
        setActiveItem(item);
        dragFromColumn.current = columnId;
        break;
      }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over || !localItems) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeColumn = findColumn(activeId, localItems);
    let overColumn = findColumn(overId, localItems);

    if (!activeColumn || !overColumn) return;
    if (activeColumn === overColumn) return; // Same column — sortable handles it

    // Move item from one column to another in real-time
    setLocalItems(prev => {
      if (!prev) return prev;
      const sourceItems = [...prev[activeColumn]!];
      const destItems = [...prev[overColumn!]!];

      const activeIndex = sourceItems.findIndex(i => i.id === activeId);
      if (activeIndex === -1) return prev;

      const [movedItem] = sourceItems.splice(activeIndex, 1);

      // Determine insertion index in destination
      const overIndex = destItems.findIndex(i => i.id === overId);
      if (overIndex >= 0) {
        destItems.splice(overIndex, 0, movedItem!);
      } else {
        // Dropped on column itself — add to end
        destItems.push(movedItem!);
      }

      return {
        ...prev,
        [activeColumn]: sourceItems,
        [overColumn!]: destItems,
      };
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    const activeId = String(active.id);

    if (!over) {
      setActiveItem(null);
      setLocalItems(null);
      dragFromColumn.current = '';
      return;
    }

    const overId = String(over.id);
    let finalItems = localItems ? { ...localItems } : { ...externalItems };

    const activeColumn = findColumn(activeId, finalItems);
    const overColumn = findColumn(overId, finalItems);

    if (activeColumn && overColumn) {
      // Como o handleDragOver já move o item entre colunas, no handleDragEnd 
      // ambos estarão na mesma coluna base. Fazemos um arrayMove final para definir exata posição.
      if (activeColumn === overColumn) {
        const columnArr = [...finalItems[activeColumn]!];
        const activeIndex = columnArr.findIndex(i => i.id === activeId);
        const overIndex = columnArr.findIndex(i => i.id === overId);

        if (activeIndex !== overIndex && overIndex !== -1 && activeIndex !== -1) {
          finalItems[activeColumn] = arrayMove(columnArr, activeIndex, overIndex);
        }
      }

      // Dispara o callback para o parent atualizar sua array achatada com a ordem Trello-like final
      if (onChangeOrder) {
        onChangeOrder(finalItems);
      }

      // Se mudou de coluna em relação a COLUNA ORIGINAL (dragFromColumn)
      const currentFinalColumn = findColumn(activeId, finalItems);
      if (currentFinalColumn && currentFinalColumn !== dragFromColumn.current) {
        onMoveItem(activeId, dragFromColumn.current, currentFinalColumn);
      }
    }

    // Reset state
    setActiveItem(null);
    setLocalItems(null);
    dragFromColumn.current = '';
  }

  function handleDragCancel() {
    setActiveItem(null);
    setLocalItems(null);
    dragFromColumn.current = '';
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={multiCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex items-start gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.label}
            count={displayItems[column.id]?.length ?? 0}
            color={column.color}
            onCardClick={onCardClick}
            renderCard={renderCard}
            items={displayItems[column.id] ?? []}
            onEdit={onEditColumn ? () => onEditColumn(column.id) : undefined}
            onDelete={onDeleteColumn ? () => onDeleteColumn(column.id) : undefined}
            isDefault={column.isDefault}
          />
        ))}

        {/* Add Column Button */}
        {onAddColumn && (
          <button
            onClick={onAddColumn}
            className="flex-shrink-0 w-[300px] h-[120px] flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-primary/40 hover:bg-primary/5 text-zinc-400 hover:text-primary transition-all duration-200 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium">Nova Coluna</span>
          </button>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <div className="w-[284px] cursor-grabbing opacity-90 shadow-xl shadow-black/25 rounded-lg">
            <div className="glass rounded-lg p-3">
              {renderCard(activeItem)}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
