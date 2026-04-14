import { Briefcase, Calendar, Pencil, Trash2, User } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { PriorityBadge, TaskTypeBadge, Badge } from '@/shared/components/ui/Badge';
import { StatusChip } from '@/modules/tasks/components/StatusChip';
import { useStore } from '@/shared/lib/store';
import type { Task, TaskStatus } from '@/shared/types/models';

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  /** If true, show the interactive StatusChip (used in list/cell view) */
  showStatusChip?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, showStatusChip = false }: TaskCardProps) {
  const { getUserById, leads, projects, moveTaskStatus } = useStore();
  const owners = (task.ownerIds ?? []).map(id => getUserById(id)).filter(Boolean);

  // Overdue logic
  const now = Date.now();
  let safeDateStr = task.dueDate;
  if (safeDateStr) {
    const rawDate = safeDateStr.split('T')[0];
    safeDateStr = rawDate + 'T12:00:00';
  }
  const dueTime = safeDateStr ? new Date(safeDateStr).getTime() : null;
  const isOverdue = dueTime && dueTime < now && task.status !== 'done';
  const isDueSoon = dueTime && !isOverdue && (dueTime - now) < 48 * 3600000 && task.status !== 'done';

  // Linked entity
  let linkedName = '';
  let linkedType: 'project' | 'lead' | null = null;
  if (task.projectId) {
    const project = projects.find(p => p.id === task.projectId);
    linkedName = project?.clientName ?? '';
    linkedType = 'project';
  } else if (task.leadId) {
    const lead = leads.find(l => l.id === task.leadId);
    linkedName = lead?.name ?? '';
    linkedType = 'lead';
  }

  const handleStatusChange = (newStatus: TaskStatus) => {
    moveTaskStatus(task.id, newStatus);
  };

  return (
    <div className={cn(
      'space-y-2 group/task relative',
    )}>
      {/* Absolute edge indicator spanning the container's p-3 bounding box */}
      {isOverdue && (
        <div className="absolute -left-3 -top-3 -bottom-3 w-1 bg-destructive rounded-l-lg" />
      )}
      {isDueSoon && !isOverdue && (
        <div className="absolute -left-3 -top-3 -bottom-3 w-1 bg-warning rounded-l-lg" />
      )}
      
      {/* Action buttons — always visible on mobile, hover on desktop */}
      {(onEdit || onDelete) && (
        <div className="absolute -top-1 -right-1 flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover/task:opacity-100 transition-opacity z-10">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(task); }}
              className="w-7 h-7 sm:w-6 sm:h-6 rounded-md flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-primary hover:border-primary/40 transition-all cursor-pointer shadow-sm press-scale"
              title="Editar tarefa"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(task); }}
              className="w-7 h-7 sm:w-6 sm:h-6 rounded-md flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-800 transition-all cursor-pointer shadow-sm press-scale"
              title="Excluir tarefa"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Top row: linked entity */}
      {linkedName && linkedType && (
        <div className="flex items-center gap-1.5 min-w-0 pr-16 sm:pr-0">
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium truncate max-w-full',
            linkedType === 'project'
              ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
              : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
          )}>
            {linkedType === 'project'
              ? <Briefcase className="w-3 h-3 flex-shrink-0" />
              : <User className="w-3 h-3 flex-shrink-0" />
            }
            <span className="truncate">{linkedName}</span>
          </div>
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-semibold text-foreground leading-snug line-clamp-3 pr-14 sm:pr-0 sm:line-clamp-2">
        {task.title}
      </h4>

      {/* Badges */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {showStatusChip && (
          <StatusChip status={task.status} onStatusChange={handleStatusChange} />
        )}
        <PriorityBadge priority={task.priority} />
        <TaskTypeBadge type={task.type} />
        {isOverdue && <Badge variant="blocked">Atrasada</Badge>}
        {isDueSoon && !isOverdue && <Badge variant="medium">Em 48h</Badge>}
      </div>

      {/* Footer — owners (stacked avatars) + date */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border-subtle/50">
        {owners.length > 0 ? (
          <div className="flex items-center">
            {/* Stacked avatar chips */}
            <div className="flex items-center -space-x-1.5">
              {owners.slice(0, 3).map((owner) => (
                <div
                  key={owner!.id}
                  className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center border border-white dark:border-zinc-900 flex-shrink-0"
                  title={owner!.name}
                >
                  <span className="text-[7px] font-bold text-primary">{owner!.initials}</span>
                </div>
              ))}
              {owners.length > 3 && (
                <div className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border border-white dark:border-zinc-900 flex-shrink-0">
                  <span className="text-[7px] font-bold text-foreground-muted">+{owners.length - 3}</span>
                </div>
              )}
            </div>
            {owners.length === 1 && (
              <span className="text-[11px] text-foreground-muted truncate ml-1.5">
                {owners[0]!.name.split(' ')[0]}
              </span>
            )}
            {owners.length > 1 && (
              <span className="text-[10px] text-foreground-muted ml-1.5">
                {owners.length} pessoas
              </span>
            )}
          </div>
        ) : (
          <div />
        )}
        {task.dueDate && (
          <div className={cn(
            'flex items-center gap-1 text-[11px] flex-shrink-0',
            isOverdue ? 'text-destructive font-semibold' : isDueSoon ? 'text-warning font-semibold' : 'text-foreground-muted',
          )}>
            <Calendar className="w-3 h-3" />
            {new Date(safeDateStr as string).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}
