import { Calendar, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { PriorityBadge, TaskTypeBadge, Badge } from '@/shared/components/ui/Badge';
import { useStore } from '@/shared/lib/store';
import type { Task } from '@/shared/types/models';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const { getUserById, leads, projects } = useStore();
  const owner = getUserById(task.ownerId);

  // Overdue logic
  const now = Date.now();
  const dueTime = task.dueDate ? new Date(task.dueDate).getTime() : null;
  const isOverdue = dueTime && dueTime < now && task.status !== 'done';
  const isDueSoon = dueTime && !isOverdue && (dueTime - now) < 48 * 3600000 && task.status !== 'done';

  // Linked entity
  let linkedName = '';
  if (task.projectId) {
    const project = projects.find(p => p.id === task.projectId);
    linkedName = project?.clientName ?? '';
  } else if (task.leadId) {
    const lead = leads.find(l => l.id === task.leadId);
    linkedName = lead?.name ?? '';
  }

  return (
    <div className={cn(
      'space-y-2.5 group/task relative',
      isOverdue && 'border-l-[3px] border-destructive -ml-4 pl-[13px]',
      isDueSoon && !isOverdue && 'border-l-[3px] border-warning -ml-4 pl-[13px]',
    )}>
      {/* Action buttons — top-right, visible on hover */}
      {(onEdit || onDelete) && (
        <div className="absolute -top-1 -right-1 flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity z-10">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-primary hover:border-primary/40 transition-all cursor-pointer shadow-sm"
              title="Editar tarefa"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task); }}
              className="w-6 h-6 rounded-md flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-800 transition-all cursor-pointer shadow-sm"
              title="Excluir tarefa"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-medium text-foreground leading-tight line-clamp-2">
        {task.title}
      </h4>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <PriorityBadge priority={task.priority} />
        <TaskTypeBadge type={task.type} />
        {isOverdue && <Badge variant="blocked">Atrasada</Badge>}
        {isDueSoon && !isOverdue && <Badge variant="medium">Em 48h</Badge>}
      </div>

      {/* Linked entity */}
      {linkedName && (
        <p className="text-[10px] text-foreground-muted/60 truncate">
          ↳ {linkedName}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-0.5">
        {owner && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary">{owner.initials}</span>
            </div>
            <span className="text-[10px] text-foreground-muted">{owner.name.split(' ')[0]}</span>
          </div>
        )}
        {task.dueDate && (
          <div className={cn(
            'flex items-center gap-1 text-[10px]',
            isOverdue ? 'text-destructive font-semibold' : isDueSoon ? 'text-warning font-semibold' : 'text-foreground-muted',
          )}>
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}
