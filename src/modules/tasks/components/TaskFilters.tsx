import { cn } from '@/shared/utils/cn';
import type { TaskType, TaskPriority } from '@/shared/types/models';

interface TaskFiltersProps {
  type: TaskType | 'all';
  priority: TaskPriority | 'all';
  onTypeChange: (type: TaskType | 'all') => void;
  onPriorityChange: (priority: TaskPriority | 'all') => void;
}

const TYPE_OPTIONS: { id: TaskType | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'project', label: 'Projeto' },
  { id: 'sales', label: 'Vendas' },
  { id: 'standalone', label: 'Avulsa' },
];

const PRIORITY_OPTIONS: { id: TaskPriority | 'all'; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'high', label: 'Alta' },
  { id: 'medium', label: 'Média' },
  { id: 'low', label: 'Baixa' },
];

export function TaskFilters({ type, priority, onTypeChange, onPriorityChange }: TaskFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Type Filter */}
      <div className="flex items-center gap-1 p-1 glass-subtle rounded-xl">
        {TYPE_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onTypeChange(option.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300',
              type === option.id
                ? 'bg-primary/15 text-primary'
                : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Priority Filter */}
      <div className="flex items-center gap-1 p-1 glass-subtle rounded-lg">
        {PRIORITY_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onPriorityChange(option.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300',
              priority === option.id
                ? 'bg-primary/15 text-primary'
                : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
