import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/shared/utils/cn';
import { KanbanCard } from './KanbanCard';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface KanbanColumnProps<T extends { id: string }> {
  id: string;
  title: string;
  count: number;
  color: string;
  items: T[];
  renderCard: (item: T) => ReactNode;
  onCardClick?: (item: T) => void;
}

export function KanbanColumn<T extends { id: string }>({
  id,
  title,
  count,
  color,
  items,
  renderCard,
  onCardClick,
}: KanbanColumnProps<T>) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const [collapsed, setCollapsed] = useState(false);

  // ── Collapsed state ──
  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        className="flex-shrink-0 w-[42px] glass-subtle rounded-xl cursor-pointer group hover:w-[48px] transition-all duration-300"
        onClick={() => setCollapsed(false)}
      >
        <div className="flex flex-col items-center py-3 gap-2">
          <ChevronRight className="w-3.5 h-3.5 text-foreground-muted group-hover:text-foreground transition-colors" />
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-[10px] font-bold text-foreground-muted bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-full">
            {count}
          </span>
          <span className="[writing-mode:vertical-rl] text-[11px] font-semibold text-foreground-muted tracking-tight rotate-180">
            {title}
          </span>
        </div>
      </div>
    );
  }

  // ── Expanded state ──
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-[300px] flex flex-col',
        'glass-subtle rounded-xl',
        'transition-colors duration-200',
        isOver && 'ring-2 ring-primary/20 bg-primary/5',
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCollapsed(true)}
            className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Colapsar coluna"
          >
            <ChevronRight className="w-3.5 h-3.5 text-foreground-muted rotate-90" />
          </button>
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="text-sm font-semibold text-foreground tracking-tight">
            {title}
          </h3>
        </div>
        <span className="text-xs font-medium text-foreground-muted bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>

      {/* Cards container */}
      <div className="flex-1 p-2 overflow-y-auto max-h-[calc(100vh-220px)] min-h-[80px]">
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <KanbanCard
                key={item.id}
                id={item.id}
                onClick={() => onCardClick?.(item)}
              >
                {renderCard(item)}
              </KanbanCard>
            ))}
            {items.length === 0 && (
              <div className={cn(
                'flex items-center justify-center h-20 rounded-lg border-2 border-dashed',
                'text-foreground-muted/30 text-xs',
                isOver ? 'border-primary/30 bg-primary/5' : 'border-transparent',
              )}>
                {isOver ? 'Soltar aqui' : ''}
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
