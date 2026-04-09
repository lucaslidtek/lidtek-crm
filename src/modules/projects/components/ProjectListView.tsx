import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/shared/lib/store';
import type { Project, Sprint, ProjectStage } from '@/shared/types/models';
import { Badge, ProjectTypeBadge } from '@/shared/components/ui/Badge';
import { PROJECT_STAGES, getStageLabel, getStageColor } from '@/shared/lib/constants';
import { Briefcase, ChevronDown, Plus, Check, Clock, Circle, CalendarDays, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectListViewProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectListView({ projects, onProjectClick }: ProjectListViewProps) {
  const { getUserById, createSprint, completeSprint, updateSprint, deleteSprint } = useStore();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

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
        const owner = getUserById(project.ownerId);
        const currentSprint = project.sprints.find(s => s.id === project.currentSprintId);
        const completedCount = project.sprints.filter(s => s.status === 'completed').length;
        const isExpanded = expandedIds.has(project.id);

        return (
          <div
            key={project.id}
            className="glass rounded-xl overflow-hidden transition-all duration-300"
          >
            {/* ── Main Row ── */}
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

              {/* Client Name + Contact */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); onProjectClick(project); }}
                >
                  {project.clientName}
                </p>
                <p className="text-[11px] text-foreground-muted truncate">{project.clientContact}</p>
              </div>

              {/* Type Badge */}
              <div className="flex-shrink-0">
                <ProjectTypeBadge type={project.type} />
              </div>

              {/* Current Sprint (main highlight) */}
              <div className="flex-shrink-0 max-w-[220px] min-w-[140px]">
                {currentSprint ? (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">{currentSprint.name}</span>
                  </div>
                ) : (
                  <span className="text-xs text-foreground-muted/50">Sem sprint ativa</span>
                )}
              </div>

              {/* Sprint Counter */}
              <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-foreground-muted">
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span className="font-medium">{completedCount}</span>
                  <span className="text-foreground-muted/50">/</span>
                  <span>{project.sprints.length}</span>
                </div>
              </div>

              {/* Owner */}
              <div className="flex-shrink-0 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                  {owner?.initials ?? '?'}
                </div>
                <span className="text-[11px] text-foreground-muted hidden lg:inline">{owner?.name?.split(' ')[0]}</span>
              </div>
            </div>

            {/* ── Expanded: Sprint List ── */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border-subtle px-5 py-3 bg-black/3 dark:bg-white/[0.02]">
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
                            onRename={(newName) => updateSprint(sprint.id, { name: newName })}
                            onDelete={() => deleteSprint(sprint.id)}
                          />
                        ))
                      }
                    </div>

                    {/* Add Sprint */}
                    <AddSprintRow projectId={project.id} onAdd={createSprint} />
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

function SprintRow({ sprint, isActive, onComplete, onRename, onDelete }: {
  sprint: Sprint;
  isActive: boolean;
  onComplete: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}) {
  const isCompleted = sprint.status === 'completed';
  const stageColor = getStageColor(PROJECT_STAGES, sprint.stage);
  const stageLabel = getStageLabel(PROJECT_STAGES, sprint.stage);
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
      onRename(trimmed);
    } else {
      setDraft(sprint.name);
    }
    setEditing(false);
  };

  const cancelRename = () => {
    setDraft(sprint.name);
    setEditing(false);
  };

  return (
    <div className={cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group/sprint',
      isActive
        ? 'bg-violet-50/80 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30'
        : isCompleted
          ? 'opacity-60 hover:opacity-80'
          : 'hover:bg-black/5 dark:hover:bg-white/5',
    )}>
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

      {/* Status indicator */}
      {isActive && !isCompleted && (
        <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
          <Circle className="w-2.5 h-2.5 fill-current" />
          Em andamento
        </div>
      )}

      {/* Stage badge */}
      <Badge color={stageColor}>{stageLabel}</Badge>

      {/* Dates */}
      <div className="flex items-center gap-3 text-[10px] text-foreground-muted flex-shrink-0">
        <span className="flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />
          {new Date(sprint.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
        </span>
        {sprint.endDate && (
          <span className="flex items-center gap-1 text-emerald-500">
            <Check className="w-3 h-3" />
            {new Date(sprint.endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-0 group-hover/sprint:opacity-100 transition-all cursor-pointer"
        title="Excluir sprint"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}


// ─── Add Sprint Row ───────────────────────────────────

function AddSprintRow({ projectId, onAdd }: {
  projectId: string;
  onAdd: (projectId: string, data: { name: string; stage: ProjectStage; startDate: string; status: 'active' }) => Promise<void>;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
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
        startDate: new Date().toISOString(),
        status: 'active',
      });
      setName('');
      setIsAdding(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName('');
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
    <div className="flex items-center gap-2 px-3 py-2 mt-1">
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
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-3 py-1 rounded-lg bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider hover:bg-primary/25 transition-colors cursor-pointer disabled:opacity-50"
      >
        {saving ? '...' : 'Criar'}
      </button>
      <button
        onClick={handleCancel}
        className="px-2 py-1 text-[10px] text-foreground-muted hover:text-foreground transition-colors cursor-pointer"
      >
        Cancelar
      </button>
    </div>
  );
}
