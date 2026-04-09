import { cn } from '@/shared/utils/cn';
import { LayoutGrid, List, CalendarDays } from 'lucide-react';

export type ViewType = 'list' | 'calendar' | 'kanban';

interface ViewToggleProps {
  view: ViewType;
  onChange: (view: ViewType) => void;
  views?: ViewType[];
  className?: string;
}

const VIEW_OPTIONS: { id: ViewType; label: string; icon: typeof List }[] = [
  { id: 'list', label: 'Lista', icon: List },
  { id: 'calendar', label: 'Calendário', icon: CalendarDays },
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
];

export function ViewToggle({ view, onChange, views, className }: ViewToggleProps) {
  const filteredOptions = views ? VIEW_OPTIONS.filter(o => views.includes(o.id)) : VIEW_OPTIONS;
  return (
    <div className={cn('flex items-center p-1 glass-subtle rounded-lg', className)}>
      {filteredOptions.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300',
              view === option.id
                ? 'bg-primary/15 text-primary'
                : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
