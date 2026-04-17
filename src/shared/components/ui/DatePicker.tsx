import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface DatePickerProps {
  value?: string; // ISO date string or YYYY-MM-DD
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'default' | 'compact' | 'badge-overdue' | 'badge-today' | 'badge-upcoming' | 'field';
  label?: string;
  className?: string;
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function DatePicker({
  value,
  onChange,
  placeholder = '+ Prazo',
  disabled = false,
  variant = 'default',
  label,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Calendar state
  const parsedDate = value ? new Date(value + (value.length === 10 ? 'T12:00:00' : '')) : null;
  const today = new Date();
  const [viewYear, setViewYear] = useState(parsedDate?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsedDate?.getMonth() ?? today.getMonth());

  // Reset view when value changes
  useEffect(() => {
    if (parsedDate) {
      setViewYear(parsedDate.getFullYear());
      setViewMonth(parsedDate.getMonth());
    }
  }, [value]);

  // Position the panel
  useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const panelWidth = 280;
      const panelHeight = 320;

      let top = rect.bottom + 6;
      let left = rect.left;

      // Keep within viewport
      if (left + panelWidth > window.innerWidth - 12) {
        left = window.innerWidth - panelWidth - 12;
      }
      if (top + panelHeight > window.innerHeight - 12) {
        top = rect.top - panelHeight - 6;
      }

      setPos({ top, left });
    }
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleScroll = () => setOpen(false);
    document.addEventListener('mousedown', handleClick);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  const handleSelect = useCallback((day: number) => {
    const selected = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(selected);
    setOpen(false);
  }, [viewYear, viewMonth, onChange]);

  const handleClear = useCallback(() => {
    onChange(undefined);
    setOpen(false);
  }, [onChange]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  // Build grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const selectedDay = parsedDate && parsedDate.getFullYear() === viewYear && parsedDate.getMonth() === viewMonth
    ? parsedDate.getDate() : null;
  const isToday = (day: number) =>
    today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

  // Format display
  const displayText = parsedDate
    ? variant === 'badge-today'
      ? 'HOJE'
      : variant === 'field'
        ? parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : variant === 'default'
          ? parsedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          : parsedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '')
    : placeholder;

  // Variant styles for trigger
  const toLocalNoon = (d: Date) => {
    const str = d.toISOString().split('T')[0];
    return new Date(str + 'T12:00:00');
  };
  const todayNoon = toLocalNoon(today);
  const parsedNoon = parsedDate ? toLocalNoon(parsedDate) : null;
  const todayStr = today.toISOString().split('T')[0];
  const valueStr = value ? value.split('T')[0] : null;
  const isOverdue = parsedNoon && parsedNoon < todayNoon;
  const isDateToday = valueStr === todayStr;
  const triggerStyles = cn(
    'flex items-center gap-1.5 cursor-pointer transition-all rounded-md text-[10px] font-medium group/date relative',
    variant === 'compact' && 'px-2 py-1',
    variant === 'default' && 'px-2.5 py-1 text-xs border',
    variant === 'field' && [
      'w-full px-4 py-2.5 rounded-lg text-sm text-left',
      'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
      'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
      !parsedDate && 'text-foreground-muted/50',
    ],
    (variant === 'badge-overdue' || (variant === 'default' && isOverdue && parsedDate)) &&
      'text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 px-2 h-[22px] py-0 text-[9px] uppercase tracking-wider',
    variant === 'badge-today' &&
      'text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 px-2 h-[22px] py-0 text-[9px] uppercase tracking-wider',
    (variant === 'badge-upcoming' || (variant === 'default' && parsedDate && !isOverdue && !isDateToday)) &&
      'text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2 h-[22px] py-0 text-[9px] uppercase tracking-wider',
    !parsedDate && variant !== 'compact' && variant !== 'field' &&
      'border border-dashed border-zinc-300 dark:border-zinc-600 text-foreground-muted/60 hover:text-foreground-muted hover:border-primary/40 hover:bg-primary/5',
    !parsedDate && variant === 'compact' &&
      'text-foreground-muted/50 hover:text-foreground-muted border border-dashed border-zinc-300 dark:border-zinc-600 hover:border-primary/40 hover:bg-primary/5',
    disabled && 'opacity-50 cursor-default',
    className,
  );



  return (
    <>
      {label && (
        <label className="label-style text-foreground-muted block mb-1.5">{label}</label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); if (!disabled) setOpen(o => !o); }}
        className={triggerStyles}
        title={parsedDate ? `Prazo: ${parsedDate.toLocaleDateString('pt-BR')}` : 'Definir prazo'}
      >
        <CalendarDays className={cn('flex-shrink-0', variant === 'field' ? 'w-4 h-4 text-foreground-muted' : 'w-3 h-3')} />
        <span>{displayText}</span>
      </button>

      {open && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, pointerEvents: 'auto' }}
          className="animate-fade-in"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="w-[280px] bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={prevMonth}
                className="w-7 h-7 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 text-foreground-muted" />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                {MONTHS_PT[viewMonth]} {viewYear}
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="w-7 h-7 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 text-foreground-muted" />
              </button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 px-3 pt-2">
              {WEEKDAYS.map((d, i) => (
                <div key={i} className="text-center text-[9px] font-bold uppercase tracking-widest text-foreground-muted/50 py-1.5">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 px-3 pb-2">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selected = selectedDay === day;
                const todayMark = isToday(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelect(day)}
                    className={cn(
                      'w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all cursor-pointer',
                      selected
                        ? 'bg-primary text-white shadow-sm scale-105'
                        : todayMark
                          ? 'bg-primary/10 text-primary font-bold ring-1 ring-primary/30'
                          : 'text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:scale-105',
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] text-foreground-muted hover:text-red-500 transition-colors cursor-pointer font-medium"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSelect(today.getDate());
                  setViewMonth(today.getMonth());
                  setViewYear(today.getFullYear());
                }}
                className="text-[10px] text-primary hover:text-primary/80 transition-colors cursor-pointer font-semibold"
              >
                Hoje
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
