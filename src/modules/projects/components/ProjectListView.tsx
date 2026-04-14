import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '@/shared/lib/store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import type { Project, Sprint, ProjectStage, SprintPriority } from '@/shared/types/models';
import { Badge, ProjectTypeBadge } from '@/shared/components/ui/Badge';
import { PROJECT_STAGES, TASK_STATUSES, getStageLabel, getStageColor } from '@/shared/lib/constants';
import type { TaskStatus } from '@/shared/types/models';
import { Briefcase, ChevronDown, Plus, Check, Clock, CalendarDays, Trash2, ArrowUp, ArrowRight, ArrowDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { DatePicker } from '@/shared/components/ui/DatePicker';

interface ProjectListViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

const PRIORITY_CONFIG: Record<SprintPriority, { label: string; color: string; icon: typeof ArrowUp }> = {
  high: { label: 'Alta', color: 'text-red-500', icon: ArrowUp },
  medium: { label: 'Média', color: 'text-amber-500', icon: ArrowRight },
  low: { label: 'Baixa', color: 'text-blue-500', icon: ArrowDown },
};

export function ProjectListView({ projects, onProjectClick }: ProjectListViewProps) {
  const { getUserById, createSprint, completeSprint, updateSprint, deleteSprint, tasks, moveTaskStatus } = useStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const isMobile = useIsMobile();

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-3 animate-fade-in">
      {projects.map((project) => {
        const owners = project.ownerIds.map(id => getUserById(id)).filter(Boolean);
        const currentSprint = project.sprints.find(s => s.id === project.currentSprintId);
        const completedCount = project.sprints.filter(s => s.status === 'completed').length;
        const isExpanded = expandedIds.has(project.id);

        return (
          <div
            key={project.id}
            className="glass rounded-xl overflow-hidden transition-all duration-300"
          >
            {/* ── Main Row ── */}
            {isMobile ? (
              /* ── Mobile: stacked layout ── */
              <div
                className="px-4 py-3"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Top: icon + name + badge → taps open project detail */}
                <div
                  className="flex items-start gap-3 press-scale"
                  onClick={() => onProjectClick(project)}
                >
                  <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center flex-shrink-0 text-foreground-muted mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground leading-snug line-clamp-2">
                      {project.clientName}
                    </p>
                    {project.clientContact && (
                      <p className="text-[11px] text-foreground-muted truncate mt-0.5">{project.clientContact}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <ProjectTypeBadge type={project.type} />
                  </div>
                </div>

                {/* Bottom row: sprint info → taps expand/collapse sprints */}
                <div
                  className="flex items-center gap-2 mt-2.5 ml-11 press-scale"
                  onClick={() => toggleExpand(project.id)}
                >
                  {/* Current sprint — full visible */}
                  <div className="flex-1 min-w-0">
                    {currentSprint ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                        <span className="text-xs font-medium text-foreground leading-snug line-clamp-2">
                          {currentSprint.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-foreground-muted/50">Sem sprint ativa</span>
                    )}
                  </div>

                  {/* Sprint counter */}
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-xs text-foreground-muted flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="font-medium">{completedCount}</span>
                    <span className="text-foreground-muted/50">/</span>
                    <span>{project.sprints.length}</span>
                  </div>

                  {/* Owners */}
                  {owners.length > 0 && (
                    <div className="flex items-center -space-x-1.5 flex-shrink-0">
                      {owners.slice(0, 3).map((o, i) => (
                        <div key={i} className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary border-2 border-white dark:border-zinc-900" title={o!.name}>
                          {o!.initials}
                        </div>
                      ))}
                      {owners.length > 3 && (
                        <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-foreground-muted border-2 border-white dark:border-zinc-900">
                          +{owners.length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Expand chevron */}
                  <ChevronDown className={cn(
                    'w-4 h-4 text-foreground-muted transition-transform duration-300 flex-shrink-0',
                    isExpanded && 'rotate-180'
                  )} />
                </div>
              </div>
            ) : (
              /* ── Desktop: horizontal row ── */
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                onClick={() => toggleExpand(project.id)}
              >
                {/* Expand Arrow */}
                <button className="flex-shrink-0 p-0.5 text-foreground-muted">
                  <ChevronDown className={cn(
                    'w-4 h-4 transition-transform duration-300',
                    isExpanded && 'rotate-180'
                  )} />
                </button>

                {/* Icon */}
                <div className="w-9 h-9 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center flex-shrink-0 text-foreground-muted group-hover:text-primary transition-colors">
                  <Briefcase className="w-4 h-4" />
                </div>

                {/* 2-Line Layout Container */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  {/* Line 1: Name & Type */}
                  <div className="flex items-center gap-2">
                    <p
                      className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); onProjectClick(project); }}
                    >
                      {project.clientName}
                    </p>
                    <ProjectTypeBadge type={project.type} />
                  </div>

                  {/* Line 2: Contact, Active Sprint, Metric */}
                  <div className="flex items-center flex-wrap gap-2 text-[11.5px] text-foreground-muted truncate">
                    {project.clientContact && (
                      <>
                        <span className="truncate max-w-[120px]">{project.clientContact}</span>
                        <span>•</span>
                      </>
                    )}
                    
                    {/* Current Sprint */}
                    {currentSprint ? (
                      <div className="flex items-center gap-1.5 max-w-[200px] truncate">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                        <span className="font-medium text-foreground truncate">{currentSprint.name}</span>
                      </div>
                    ) : (
                      <span className="opacity-50">Sem sprint ativa</span>
                    )}
                    <span>•</span>

                    {/* Counter */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                       <Check className="w-3 h-3 text-emerald-500" />
                       <span className="font-medium">{completedCount}</span>
                       <span className="opacity-50">/</span>
                       <span>{project.sprints.length} sprints</span>
                    </div>

                    {/* Move Owners here! */}
                    {owners.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex items-center -space-x-1 flex-shrink-0">
                          {owners.slice(0, 3).map((o, i) => (
                            <div key={i} className="w-[18px] h-[18px] rounded-md bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary border border-white dark:border-zinc-900" title={o!.name}>
                              {o!.initials}
                            </div>
                          ))}
                          {owners.length > 3 && (
                            <div className="w-[18px] h-[18px] rounded-md bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[8px] font-bold text-foreground-muted border border-white dark:border-zinc-900">
                              +{owners.length - 3}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* New: Progress Bar (Anchored Right) */}
                <div className="flex-shrink-0 w-28 hidden md:flex flex-col gap-1 mx-2">
                  <div className="flex justify-between items-center text-[9px] font-semibold text-foreground-muted uppercase tracking-wider">
                    <span>Progresso</span>
                    <span>{project.sprints.length ? Math.round((completedCount / project.sprints.length) * 100) : 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out" 
                      style={{ width: `${project.sprints.length ? Math.round((completedCount / project.sprints.length) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── Expanded: Sprint List ── */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  animate={{ height: 'auto', opacity: 1, overflow: 'visible' }}
                  exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className={cn(
                    'border-t border-border-subtle py-3 bg-black/3 dark:bg-white/[0.02]',
                    isMobile ? 'px-3' : 'px-5',
                  )}>
                    <div className="space-y-1">
                      {/* Sort: active first, then completed newest first */}
                      {[...project.sprints]
                        .sort((a, b) => {
                          if (a.status === 'active' && b.status !== 'active') return -1;
                          if (a.status !== 'active' && b.status === 'active') return 1;
                          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
                        })
                        .map((sprint) => (
                          <SprintRow
                            key={sprint.id}
                            sprint={sprint}
                            isActive={sprint.id === project.currentSprintId}
                            onComplete={() => completeSprint(sprint.id)}
                            onUpdate={(updates) => updateSprint(sprint.id, updates)}
                            onDelete={() => deleteSprint(sprint.id)}
                            isMobile={isMobile}
                            linkedTaskStatus={tasks.find(t => t.sprintId === sprint.id)?.status}
                            linkedTaskId={tasks.find(t => t.sprintId === sprint.id)?.id}
                            onTaskStatusChange={(taskId, status) => moveTaskStatus(taskId, status)}
                          />
                        ))
                      }
                    </div>

                    {/* Add Sprint */}
                    <AddSprintRow projectId={project.id} onAdd={createSprint} isMobile={isMobile} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {projects.length === 0 && (
        <div className="glass rounded-xl px-6 py-12 text-center text-sm text-foreground-muted">
          Nenhum projeto encontrado.
        </div>
      )}
    </div>
  );
}


// ─── Sprint Row ───────────────────────────────────────

function SprintRow({ sprint, isActive, onComplete, onUpdate, onDelete, isMobile, linkedTaskStatus, linkedTaskId, onTaskStatusChange }: {
  sprint: Sprint;
  isActive: boolean;
  onComplete: () => void;
  onUpdate: (updates: Partial<Sprint>) => void;
  onDelete: () => void;
  isMobile: boolean;
  linkedTaskStatus?: TaskStatus;
  linkedTaskId?: string;
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void;
}) {
  const isCompleted = sprint.status === 'completed';
  const stageColor = getStageColor(PROJECT_STAGES, sprint.stage);
  const stageLabel = getStageLabel(PROJECT_STAGES, sprint.stage);
  const currentPriority = sprint.priority ?? 'medium';
  const priorityCfg = PRIORITY_CONFIG[currentPriority];
  const PriorityIcon = priorityCfg.icon;
  const [completing, setCompleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(sprint.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted || completing) return;
    setCompleting(true);
    try {
      await onComplete();
    } finally {
      setCompleting(false);
    }
  };

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== sprint.name) {
      onUpdate({ name: trimmed });
    } else {
      setDraft(sprint.name);
    }
    setEditing(false);
  };

  const cancelRename = () => {
    setDraft(sprint.name);
    setEditing(false);
  };

  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [pickerPos, setPickerPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const priorityBtnRef = useRef<HTMLButtonElement>(null);

  const openPriorityPicker = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) return;
    if (priorityBtnRef.current) {
      const rect = priorityBtnRef.current.getBoundingClientRect();
      setPickerPos({ top: rect.bottom + 4, left: rect.left });
    }
    setShowPriorityPicker(prev => !prev);
  }, [isCompleted]);

  // Close priority picker on outside click or scroll
  useEffect(() => {
    if (!showPriorityPicker) return;
    const close = () => setShowPriorityPicker(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [showPriorityPicker]);

  const selectPriority = (p: SprintPriority) => {
    onUpdate({ priority: p });
    setShowPriorityPicker(false);
  };

  const priorityPopover = showPriorityPicker ? createPortal(
    <div
      className="fixed z-[9999] glass rounded-lg border border-border-subtle shadow-xl p-1 min-w-[130px] animate-fade-in"
      style={{ top: pickerPos.top, left: pickerPos.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {(['high', 'medium', 'low'] as SprintPriority[]).map((p) => {
        const cfg = PRIORITY_CONFIG[p];
        const Icon = cfg.icon;
        const isSelected = currentPriority === p;
        return (
          <button
            key={p}
            onClick={(e) => { e.stopPropagation(); selectPriority(p); }}
            className={cn(
              'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer',
              isSelected
                ? p === 'high'
                  ? 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                  : p === 'medium'
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                    : 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {cfg.label}
            {isSelected && <Check className="w-3 h-3 ml-auto" />}
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  const handleDateChange = (val: string | undefined) => {
    onUpdate({ dueDate: val || undefined });
  };

  // --- Status popover (linked task status) ---
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [statusPickerPos, setStatusPickerPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const statusBtnRef = useRef<HTMLButtonElement>(null);

  const currentStatus = linkedTaskStatus ?? 'todo';
  const statusCfg = TASK_STATUSES.find(s => s.id === currentStatus) ?? { id: 'todo', label: 'A Fazer', color: '#A3A3A3' };

  const openStatusPicker = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted || !linkedTaskId) return;
    if (statusBtnRef.current) {
      const rect = statusBtnRef.current.getBoundingClientRect();
      setStatusPickerPos({ top: rect.bottom + 4, left: rect.left });
    }
    setShowStatusPicker(prev => !prev);
  }, [isCompleted, linkedTaskId]);

  useEffect(() => {
    if (!showStatusPicker) return;
    const close = () => setShowStatusPicker(false);
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [showStatusPicker]);

  const selectStatus = (status: TaskStatus) => {
    if (linkedTaskId && onTaskStatusChange) {
      onTaskStatusChange(linkedTaskId, status);
    }
    setShowStatusPicker(false);
  };

  const statusPopover = showStatusPicker ? createPortal(
    <div
      className="fixed z-[9999] glass rounded-lg border border-border-subtle shadow-xl p-1 min-w-[140px] animate-fade-in"
      style={{ top: statusPickerPos.top, left: statusPickerPos.left }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {TASK_STATUSES.map((s) => {
        const isSelected = currentStatus === s.id;
        return (
          <button
            key={s.id}
            onClick={(e) => { e.stopPropagation(); selectStatus(s.id as TaskStatus); }}
            className={cn(
              'flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer',
              isSelected
                ? 'bg-black/5 dark:bg-white/5 text-foreground'
                : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            )}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            {s.label}
            {isSelected && <Check className="w-3 h-3 ml-auto" />}
          </button>
        );
      })}
    </div>,
    document.body
  ) : null;

  if (isMobile) {
    return (
      <div className={cn(
        'rounded-lg px-2.5 py-2.5 transition-all duration-200 group/sprint',
        isActive
          ? 'bg-violet-50/80 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30'
          : isCompleted
            ? 'opacity-60'
            : '',
      )}>
        {/* Row 1: checkbox + name + delete */}
        <div className="flex items-start gap-2.5">
          <button
            onClick={handleComplete}
            disabled={isCompleted || completing}
            className={cn(
              'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-all border',
              isCompleted
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'border-zinc-300 dark:border-zinc-600',
              completing && 'animate-pulse',
            )}
          >
            {isCompleted && <Check className="w-3 h-3" />}
          </button>

          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') cancelRename();
              }}
              className="text-sm font-medium flex-1 min-w-0 bg-transparent outline-none border-b border-primary/40 focus:border-primary text-foreground py-0.5"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={cn(
                'text-sm flex-1 min-w-0 leading-snug',
                isCompleted
                  ? 'line-through text-foreground-muted'
                  : 'font-medium text-foreground',
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (!isCompleted) {
                  setDraft(sprint.name);
                  setEditing(true);
                }
              }}
            >
              {sprint.name}
            </span>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-zinc-400 press-scale"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Row 2: badges + date */}
        <div className="flex items-center gap-1.5 mt-1.5 ml-[30px] flex-wrap">
          {/* Priority — custom popover (portal) */}
          <div className="relative flex-shrink-0">
            <button
              ref={priorityBtnRef}
              onClick={openPriorityPicker}
              disabled={isCompleted}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border transition-all cursor-pointer',
                currentPriority === 'high' && 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30',
                currentPriority === 'medium' && 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30',
                currentPriority === 'low' && 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30',
                isCompleted && 'opacity-50 cursor-default',
              )}
            >
              <PriorityIcon className="w-3 h-3" />
              {priorityCfg.label}
              <ChevronDown className={cn('w-2.5 h-2.5 transition-transform', showPriorityPicker && 'rotate-180')} />
            </button>
            {priorityPopover}
          </div>
          <Badge color={stageColor}>{stageLabel}</Badge>
          {/* Task status — clickable popover */}
          {linkedTaskId && !isCompleted && (
            <div className="relative flex-shrink-0">
              <button
                ref={statusBtnRef}
                onClick={openStatusPicker}
                disabled={isCompleted}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border transition-all cursor-pointer',
                  'border-zinc-200 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5',
                  isCompleted && 'opacity-50 cursor-default',
                )}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusCfg.color }} />
                {statusCfg.label}
                <ChevronDown className={cn('w-2.5 h-2.5 transition-transform', showStatusPicker && 'rotate-180')} />
              </button>
              {statusPopover}
            </div>
          )}
          {/* Due date — custom DatePicker */}
          {!isCompleted && (
            <DatePicker
              value={sprint.dueDate ? new Date(sprint.dueDate).toISOString().slice(0, 10) : undefined}
              onChange={handleDateChange}
              disabled={isCompleted}
              variant={sprint.dueDate && new Date(sprint.dueDate) < new Date() ? 'badge-overdue' : sprint.dueDate ? 'badge-upcoming' : 'compact'}
              placeholder="+ Prazo"
            />
          )}
          {sprint.endDate && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-500">
              <Check className="w-3 h-3" />
              {new Date(sprint.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      'flex flex-col gap-1 px-3 py-2.5 rounded-lg transition-all duration-200 group/sprint',
      isActive
        ? 'bg-violet-50/80 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30'
        : isCompleted
          ? 'opacity-60 hover:opacity-80'
          : 'hover:bg-black/5 dark:hover:bg-white/5',
    )}>
      {/* Line 1: Identity & Actions */}
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          disabled={isCompleted || completing}
          className={cn(
            'w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all cursor-pointer border',
            isCompleted
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-zinc-300 dark:border-zinc-600 hover:border-primary dark:hover:border-primary',
            completing && 'animate-pulse',
          )}
        >
          {isCompleted && <Check className="w-3 h-3" />}
        </button>

        {/* Sprint name (double-click to edit) */}
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') cancelRename();
            }}
            className="text-sm font-medium flex-1 min-w-0 bg-transparent outline-none border-b border-primary/40 focus:border-primary text-foreground py-0.5 transition-colors"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={cn(
              'text-sm flex-1 min-w-0 truncate',
              isCompleted
                ? 'line-through text-foreground-muted'
                : 'font-medium text-foreground',
              !isCompleted && 'cursor-text hover:text-primary/80 transition-colors',
            )}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!isCompleted) {
                setDraft(sprint.name);
                setEditing(true);
              }
            }}
            title="Duplo clique para editar"
          >
            {sprint.name}
          </span>
        )}

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover/sprint:opacity-100 transition-all cursor-pointer"
          title="Excluir sprint"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Line 2: Metadata (Status, Priority, Stage, Dates) */}
      <div className="flex items-center ml-[32px] flex-wrap">
        {/* Left side: Badges */}
        <div className="flex items-center gap-2 flex-grow">
          {/* Task status — clickable popover */}
          {linkedTaskId && !isCompleted && (
            <div className="relative flex-shrink-0">
              <button
                ref={statusBtnRef}
                onClick={openStatusPicker}
                disabled={isCompleted}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border transition-all cursor-pointer',
                  'border-zinc-200 dark:border-zinc-700 hover:bg-black/5 dark:hover:bg-white/5',
                  isCompleted && 'opacity-50 cursor-default',
                )}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusCfg.color }} />
                <span className="hidden sm:inline">{statusCfg.label}</span>
                <ChevronDown className={cn('w-2.5 h-2.5 transition-transform', showStatusPicker && 'rotate-180')} />
              </button>
              {statusPopover}
            </div>
          )}

          {/* Priority — custom popover (portal) */}
          <div className="relative flex-shrink-0">
            <button
              ref={priorityBtnRef}
              onClick={openPriorityPicker}
              disabled={isCompleted}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider border transition-all cursor-pointer',
                currentPriority === 'high' && 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30',
                currentPriority === 'medium' && 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30',
                currentPriority === 'low' && 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30',
                isCompleted && 'opacity-50 cursor-default',
              )}
            >
              <PriorityIcon className="w-3 h-3" />
              <span className="hidden sm:inline">{priorityCfg.label}</span>
              <ChevronDown className={cn('w-2.5 h-2.5 transition-transform', showPriorityPicker && 'rotate-180')} />
            </button>
            {priorityPopover}
          </div>

          {/* Stage badge - adjusted down scale slightly to match new priority size */}
          <div className="scale-90 origin-left flex-shrink-0">
            <Badge color={stageColor}>{stageLabel}</Badge>
          </div>
        </div>

        {/* Right side: Dates */}
        <div className="flex items-center gap-3 text-[10px] text-foreground-muted flex-shrink-0 ml-auto pr-8">
          {!isCompleted && (
            <DatePicker
              value={sprint.dueDate ? new Date(sprint.dueDate).toISOString().slice(0, 10) : undefined}
              onChange={handleDateChange}
              disabled={isCompleted}
              variant={sprint.dueDate && new Date(sprint.dueDate) < new Date() ? 'badge-overdue' : sprint.dueDate ? 'badge-upcoming' : 'compact'}
              placeholder="+ Prazo"
            />
          )}
          {sprint.endDate && (
            <span className="flex items-center gap-1 text-emerald-500" title="Data de conclusão">
              <Check className="w-3 h-3" />
              {new Date(sprint.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── Add Sprint Row ───────────────────────────────────

function AddSprintRow({ projectId, onAdd, isMobile }: {
  projectId: string;
  onAdd: (projectId: string, data: { name: string; stage: ProjectStage; priority: SprintPriority; startDate: string; dueDate?: string; status: 'active' }) => Promise<void>;
  isMobile: boolean;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [priority, setPriority] = useState<SprintPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  const today = new Date();
  const placeholder = `Ajustes reunião de ${today.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;

  const handleSave = async () => {
    const finalName = name.trim() || placeholder;
    setSaving(true);
    try {
      await onAdd(projectId, {
        name: finalName,
        stage: 'development',
        priority,
        startDate: new Date().toISOString(),
        dueDate: dueDate || undefined,
        status: 'active',
      });
      setName('');
      setPriority('medium');
      setDueDate('');
      setIsAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setPriority('medium');
    setDueDate('');
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 px-3 py-2 mt-1 text-xs font-medium text-foreground-muted hover:text-primary transition-colors cursor-pointer rounded-lg hover:bg-black/5 dark:hover:bg-white/5 w-full"
      >
        <Plus className="w-3.5 h-3.5" />
        Nova Sprint
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 px-3 py-3 rounded-lg bg-black/[0.03] dark:bg-white/[0.03] border border-dashed border-border-subtle">
      {/* Row 1: Name input */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md border border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center flex-shrink-0">
          <Clock className="w-3 h-3 text-foreground-muted" />
        </div>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-foreground-muted/50 border-b border-primary/30 focus:border-primary transition-colors py-0.5"
          disabled={saving}
        />
      </div>

      {/* Row 2: Priority + Due Date */}
      <div className={cn('gap-3 pl-7', isMobile ? 'space-y-2' : 'flex items-center')}>
        {/* Priority selector */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-foreground-muted mr-1">Prioridade:</span>
          {(['high', 'medium', 'low'] as SprintPriority[]).map((p) => {
            const cfg = PRIORITY_CONFIG[p];
            const Icon = cfg.icon;
            const isSelected = priority === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                className={cn(
                  'flex items-center gap-0.5 px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer border',
                  isSelected
                    ? p === 'high'
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                      : p === 'medium'
                        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                        : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-foreground-muted/60 hover:text-foreground-muted hover:bg-black/5 dark:hover:bg-white/5',
                )}
                title={cfg.label}
              >
                <Icon className="w-3 h-3" />
                {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Separator (desktop only) */}
        {!isMobile && <div className="h-4 w-px bg-border-subtle" />}

        {/* Due date — custom DatePicker */}
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-foreground-muted" />
          <span className="text-[9px] font-semibold uppercase tracking-wider text-foreground-muted">Previsão:</span>
          <DatePicker
            value={dueDate || undefined}
            onChange={(v) => setDueDate(v || '')}
            disabled={saving}
            placeholder="+ Prazo"
          />
        </div>
      </div>

      {/* Row 3: Actions */}
      <div className="flex items-center gap-2 pl-7 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-lg bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/25 transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? '...' : 'Criar Sprint'}
        </button>
        <button
          onClick={handleCancel}
          className="px-3 py-1.5 text-[10px] text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
