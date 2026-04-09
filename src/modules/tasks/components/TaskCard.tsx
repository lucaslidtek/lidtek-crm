import { Calendar } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { PriorityBadge, TaskTypeBadge, Badge } from '@/shared/components/ui/Badge';
import { useStore } from '@/shared/lib/store';
import type { Task } from '@/shared/types/models';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
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
      'space-y-2.5',
      isOverdue && 'border-l-[3px] border-destructive -ml-4 pl-[13px]',
      isDueSoon && !isOverdue && 'border-l-[3px] border-warning -ml-4 pl-[13px]',
    )}>
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
