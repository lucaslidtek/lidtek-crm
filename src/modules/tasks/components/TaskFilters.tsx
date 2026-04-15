import { cn } from '@/shared/utils/cn';
import type { TaskType, TaskPriority } from '@/shared/types/models';
import { useAuth } from '@/app/providers/AuthProvider';
import { useStore } from '@/shared/lib/store';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/DropdownMenu';
import { ChevronDown, Check } from 'lucide-react';

interface TaskFiltersProps {
  type: TaskType | 'all';
  priority: TaskPriority | 'all';
  ownerId: string | 'all';
  onTypeChange: (type: TaskType | 'all') => void;
  onPriorityChange: (priority: TaskPriority | 'all') => void;
  onOwnerChange: (ownerId: string | 'all') => void;
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

export function TaskFilters({ type, priority, ownerId, onTypeChange, onPriorityChange, onOwnerChange }: TaskFiltersProps) {
  const { user } = useAuth();
  const { users } = useStore();
  const isAdmin = user?.role === 'admin';

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

      {/* Owner Filter */}
      <div className="flex items-center gap-1 p-1 glass-subtle rounded-lg">
        {isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(
              'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300 flex items-center gap-1.5 outline-none',
              ownerId !== 'all' 
                ? 'bg-primary/15 text-primary' 
                : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
            )}>
              {ownerId === 'all' 
                ? 'Todos Responsáveis' 
                : ownerId === user?.id 
                  ? 'Minhas Tarefas' 
                  : users.find(u => u.id === ownerId)?.name || 'Selecionado'}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onOwnerChange('all')} className="justify-between">
                Todas
                {ownerId === 'all' && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOwnerChange(user?.id || '')} className="justify-between">
                Minhas Tarefas
                {ownerId === user?.id && <Check className="w-4 h-4 text-primary" />}
              </DropdownMenuItem>
              <div className="my-1 h-px bg-border-subtle" />
              {users.filter(u => u.id !== user?.id).map(u => (
                <DropdownMenuItem key={u.id} onClick={() => onOwnerChange(u.id)} className="justify-between">
                  {u.name}
                  {ownerId === u.id && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <button
              onClick={() => onOwnerChange('all')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300',
                ownerId === 'all'
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              Todas
            </button>
            <button
              onClick={() => onOwnerChange(user?.id || '')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-300',
                ownerId === user?.id
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              Minhas Tarefas
            </button>
          </>
        )}
      </div>
    </div>
  );
}
