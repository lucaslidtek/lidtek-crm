import { useState, useMemo } from 'react';
import type { Project, Sprint } from '@/shared/types/models';
import { cn } from '@/shared/utils/cn';
import { ChevronLeft, ChevronRight, Check, Clock, Briefcase } from 'lucide-react';
import { Badge } from '@/shared/components/ui/Badge';
import { PROJECT_STAGES, getStageLabel, getStageColor } from '@/shared/lib/constants';

interface ProjectCalendarViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const COL_START_CLASSES = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
];

interface SprintEvent {
  sprint: Sprint;
  project: Project;
  type: 'start' | 'end';
}

export function ProjectCalendarView({ projects, onProjectClick }: ProjectCalendarViewProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState<Date>(today);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDay(today);
  };

  // Build days of month array
  const days = useMemo(() => {
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();

    const result: Date[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      result.push(new Date(currentYear, currentMonth, d));
    }
    return result;
  }, [currentMonth, currentYear]);

  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Build sprint events map: "YYYY-MM-DD" => events
  const eventsByDay = useMemo(() => {
    const map = new Map<string, SprintEvent[]>();

    for (const project of projects) {
      for (const sprint of project.sprints) {
        // Use dueDate (previsão) as the primary calendar date for active sprints
        if (sprint.dueDate && sprint.status !== 'completed') {
          const dueD = new Date(sprint.dueDate);
          const dueKey = formatDateKey(dueD);
          if (dueD.getMonth() === currentMonth && dueD.getFullYear() === currentYear) {
            if (!map.has(dueKey)) map.set(dueKey, []);
            map.get(dueKey)!.push({ sprint, project, type: 'start' });
          }
        } else if (!sprint.dueDate && sprint.status !== 'completed') {
          // Fallback to startDate if no dueDate set
          const startDate = new Date(sprint.startDate);
          const startKey = formatDateKey(startDate);
          if (startDate.getMonth() === currentMonth && startDate.getFullYear() === currentYear) {
            if (!map.has(startKey)) map.set(startKey, []);
            map.get(startKey)!.push({ sprint, project, type: 'start' });
          }
        }

        // Completed sprints show on their endDate
        if (sprint.endDate && sprint.status === 'completed') {
          const endDate = new Date(sprint.endDate);
          const endKey = formatDateKey(endDate);
          if (endDate.getMonth() === currentMonth && endDate.getFullYear() === currentYear) {
            if (!map.has(endKey)) map.set(endKey, []);
            map.get(endKey)!.push({ sprint, project, type: 'end' });
          }
        }
      }
    }

    return map;
  }, [projects, currentMonth, currentYear]);

  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    const key = formatDateKey(selectedDay);
    return eventsByDay.get(key) ?? [];
  }, [selectedDay, eventsByDay]);

  const isTodayDate = (day: Date) =>
    day.getDate() === today.getDate() &&
    day.getMonth() === today.getMonth() &&
    day.getFullYear() === today.getFullYear();

  const isSelected = (day: Date) =>
    day.getDate() === selectedDay.getDate() &&
    day.getMonth() === selectedDay.getMonth() &&
    day.getFullYear() === selectedDay.getFullYear();

  const endOfMonthDate = new Date(currentYear, currentMonth + 1, 0);

  return (
    <div className="flex h-full flex-col animate-fade-in bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* ═══ Header ═══ */}
      <header className="flex flex-none items-center justify-between border-b border-border-subtle px-6 py-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-base font-semibold leading-6 text-foreground">
            {MONTH_NAMES[currentMonth]}, {currentYear}
          </h1>
          <p className="mt-0.5 text-sm text-foreground-muted">
            {formatDateShort(new Date(currentYear, currentMonth, 1))} — {formatDateShort(endOfMonthDate)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Nav group */}
          <div className="flex items-center rounded-lg overflow-hidden border border-border-subtle">
            <button
              onClick={goToPrevMonth}
              className="flex items-center justify-center h-9 w-9 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border-r border-border-subtle"
            >
              <ChevronLeft className="w-4 h-4 text-foreground-muted" />
            </button>
            <button
              onClick={goToToday}
              className="h-9 px-4 text-xs font-semibold text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border-r border-border-subtle"
            >
              Hoje
            </button>
            <button
              onClick={goToNextMonth}
              className="flex items-center justify-center h-9 w-9 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══ Calendar Grid ═══ */}
      <div className="flex flex-auto flex-col overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border-subtle text-center text-[10px] font-semibold uppercase tracking-wider leading-6 text-foreground-muted">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={cn(
                'py-2.5',
                idx < 6 && 'border-r border-border-subtle',
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="flex flex-auto text-xs leading-6 text-foreground-muted">
          <div className="grid w-full grid-cols-7 grid-rows-6">
            {days.map((day, dayIdx) => {
              const key = formatDateKey(day);
              const events = eventsByDay.get(key) ?? [];
              const todayFlag = isTodayDate(day);
              const selectedFlag = isSelected(day);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'flex flex-col border-b border-r border-border-subtle/50 px-2.5 py-2 text-left transition-colors cursor-pointer min-h-[110px]',
                    'hover:bg-black/[0.03] dark:hover:bg-white/[0.03]',
                    selectedFlag && 'bg-primary/[0.04] dark:bg-primary/[0.06]',
                    dayIdx === 0 && COL_START_CLASSES[firstDayOfWeek],
                    (selectedFlag || todayFlag) && 'font-semibold',
                  )}
                >
                  {/* Day number */}
                  <time
                    dateTime={key}
                    className={cn(
                      'ml-auto flex size-7 items-center justify-center rounded-full text-xs',
                      selectedFlag && todayFlag && 'bg-primary text-white',
                      selectedFlag && !todayFlag && 'bg-primary text-white',
                      !selectedFlag && todayFlag && 'text-primary font-bold',
                    )}
                  >
                    {day.getDate()}
                  </time>

                  {/* Sprint event pills */}
                  <div className="mt-1 flex-1 space-y-0.5 overflow-hidden">
                    {events.slice(0, 3).map((event, eIdx) => (
                      <div
                        key={`${event.sprint.id}-${event.type}-${eIdx}`}
                        onClick={(e) => { e.stopPropagation(); onProjectClick(event.project); }}
                        className={cn(
                          'w-full truncate rounded px-1.5 py-0.5 text-[10px] font-medium cursor-pointer transition-all hover:brightness-110',
                          event.type === 'end' || event.sprint.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-primary/15 text-primary',
                        )}
                        title={`${event.project.clientName} — ${event.sprint.name}`}
                      >
                        {event.project.clientName.split(' ')[0]}: {event.sprint.name}
                      </div>
                    ))}
                    {events.length > 3 && (
                      <span className="text-[9px] text-foreground-muted/60 font-medium pl-1">
                        +{events.length - 3} mais
                      </span>
                    )}
                  </div>

                  {/* Event dots for days with events but showing pills already covers it */}
                  {events.length > 0 && events.length <= 0 && (
                    <div className="mt-auto flex gap-0.5 flex-wrap-reverse">
                      {events.map((event, eIdx) => (
                        <div
                          key={`dot-${event.sprint.id}-${eIdx}`}
                          className={cn(
                            'size-1.5 rounded-full',
                            event.sprint.status === 'completed' ? 'bg-emerald-500' : 'bg-primary',
                          )}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Selected Day Schedule Panel ═══ */}
      <div className="border-t border-border-subtle px-6 py-4 flex-none">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            Sprints em {selectedDay.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          {selectedDayEvents.length > 0 && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
              {selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'sprint' : 'sprints'}
            </span>
          )}
        </div>

        {selectedDayEvents.length > 0 ? (
          <div className="space-y-1.5">
            {selectedDayEvents.map((event, idx) => {
              const isCompleted = event.sprint.status === 'completed' || event.type === 'end';
              const stageColor = getStageColor(PROJECT_STAGES, event.sprint.stage);
              const stageLabel = getStageLabel(PROJECT_STAGES, event.sprint.stage);

              return (
                <button
                  key={`${event.sprint.id}-${event.type}-${idx}`}
                  onClick={() => onProjectClick(event.project)}
                  className="group flex items-center gap-3 w-full text-left rounded-xl px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {/* Status icon */}
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    isCompleted ? 'bg-emerald-500/15' : 'bg-primary/15',
                  )}>
                    {isCompleted ? (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-primary" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                      {event.sprint.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-[11px] text-foreground-muted">
                        <Briefcase className="w-3 h-3" />
                        {event.project.clientName}
                      </span>
                      <span className="text-foreground-muted/30">·</span>
                      <span className="text-[11px] text-foreground-muted">
                        {event.type === 'start' ? 'Previsão' : 'Concluída'}
                      </span>
                    </div>
                  </div>

                  {/* Stage badge */}
                  <Badge color={stageColor}>{stageLabel}</Badge>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-foreground-muted/60 py-2">
            Nenhuma sprint nesta data.
          </p>
        )}
      </div>
    </div>
  );
}


// ─── Helpers ─────────────────────────────────────────

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
}
