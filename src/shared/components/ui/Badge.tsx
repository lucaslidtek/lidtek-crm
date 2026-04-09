import { cn } from '@/shared/utils/cn';
import type { TaskStatus, TaskPriority, TaskType, ProjectType } from '@/shared/types/models';

type BadgeVariant =
  | 'default'
  // Status
  | 'todo' | 'in_progress' | 'done' | 'blocked'
  // Priority
  | 'high' | 'medium' | 'low'
  // Task type
  | 'project' | 'sales' | 'standalone'
  // Project type
  | 'recurring' | 'oneshot';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
  color?: string; // override color
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-foreground-muted',
  // Status
  todo: 'bg-muted/50 text-muted-foreground',
  in_progress: 'bg-primary/15 text-primary',
  done: 'bg-success/15 text-success',
  blocked: 'bg-destructive/15 text-destructive',
  // Priority
  high: 'bg-destructive/15 text-destructive',
  medium: 'bg-warning/15 text-warning',
  low: 'bg-muted/50 text-muted-foreground',
  // Task type
  project: 'bg-primary/15 text-primary',
  sales: 'bg-blue-light/15 text-blue-light',
  standalone: 'bg-muted/50 text-muted-foreground',
  // Project type
  recurring: 'bg-success/15 text-success',
  oneshot: 'bg-blue-light/15 text-blue-light',
};

const dotColors: Partial<Record<BadgeVariant, string>> = {
  todo: 'bg-muted-foreground',
  in_progress: 'bg-primary',
  done: 'bg-success',
  blocked: 'bg-destructive',
  high: 'bg-destructive',
  medium: 'bg-warning',
  low: 'bg-muted-foreground',
};

export function Badge({ variant = 'default', children, className, dot, color }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5',
        'text-[10px] font-semibold uppercase tracking-wider rounded-full',
        'whitespace-nowrap',
        variantStyles[variant],
        className,
      )}
      style={color ? { backgroundColor: `${color}20`, color } : undefined}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant] || 'bg-current')} />
      )}
      {children}
    </span>
  );
}

// --- Convenience helpers ---
export function StatusBadge({ status }: { status: TaskStatus }) {
  const labels: Record<TaskStatus, string> = {
    todo: 'A fazer', in_progress: 'Em andamento', done: 'Concluída', blocked: 'Bloqueada',
  };
  return <Badge variant={status} dot>{labels[status]}</Badge>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const labels: Record<TaskPriority, string> = { high: 'Alta', medium: 'Média', low: 'Baixa' };
  return <Badge variant={priority}>{labels[priority]}</Badge>;
}

export function TaskTypeBadge({ type }: { type: TaskType }) {
  const labels: Record<TaskType, string> = { project: 'Projeto', sales: 'Vendas', standalone: 'Avulsa' };
  return <Badge variant={type}>{labels[type]}</Badge>;
}

export function ProjectTypeBadge({ type }: { type: ProjectType }) {
  const labels: Record<ProjectType, string> = { recurring: 'Recorrente', oneshot: 'Único' };
  return <Badge variant={type}>{labels[type]}</Badge>;
}
