import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/shared/utils/cn';
import type { ReactNode } from 'react';

interface KanbanCardProps {
  id: string;
  children: ReactNode;
  onClick?: () => void;
}

export function KanbanCard({ id, children, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? undefined,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="rounded-lg bg-black/10 dark:bg-white/5"
      >
        <div className="opacity-0 pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'glass rounded-lg p-3 overflow-hidden',
        'cursor-grab active:cursor-grabbing',
        'transition-shadow duration-200',
        'hover:shadow-md hover:bg-black/[0.03] dark:hover:bg-white/[0.03]',
        isDragging && 'shadow-lg',
      )}
    >
      {children}
    </div>
  );
}
