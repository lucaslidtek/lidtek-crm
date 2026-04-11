import { useState, useRef, useEffect } from 'react';
import { X, Check, Clock, Calendar, Briefcase, Tag, Layers, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { ProjectTypeBadge, Badge } from '@/shared/components/ui/Badge';
import { useStore } from '@/shared/lib/store';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { PROJECT_STAGES, getStageLabel, getStageColor } from '@/shared/lib/constants';
import type { Project } from '@/shared/types/models';
import { useLocation } from 'wouter';

interface ProjectDetailDrawerProps {
  project: Project | null;
  onClose: () => void;
}

/* ═══ Section container (GitLab-style) ═══ */
function Section({ title, icon, children, action }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-zinc-400">{icon}</span>
        <h4 className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 flex-1">
          {title}
        </h4>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ═══ Detail row (label:value) ═══ */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 min-w-0 text-xs text-zinc-700 dark:text-zinc-300">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN: ProjectDetailDrawer (inline side panel)
   ═══════════════════════════════════════════════ */
export function ProjectDetailDrawer({ project, onClose }: ProjectDetailDrawerProps) {
  const { getUserById, leads, updateProject, updateLead, updateSprint, completeSprint, deleteSprint, users } = useStore();
  const { canEdit } = usePermissions();
  const [, setLocation] = useLocation();

  // Null-safe derived state
  const editable = project ? canEdit(project.ownerId) : false;
  const linkedLead = project ? leads.find(l => l.id === project.leadId) : undefined;
  const currentSprint = project ? project.sprints.find(s => s.id === project.currentSprintId) : undefined;
  const stageColor = currentSprint ? getStageColor(PROJECT_STAGES, currentSprint.stage) : '#A3A3A3';
  const stageLabel = currentSprint ? getStageLabel(PROJECT_STAGES, currentSprint.stage) : 'Onboarding';


  const handleFieldSave = async (field: string, value: string) => {
    if (!project) return;
    // Client fields are owned by the lead — edit there for single source of truth
    if ((field === 'clientName' || field === 'clientContact' || field === 'clientPhone') && linkedLead) {
      const leadField = field === 'clientName' ? 'name' : field === 'clientContact' ? 'contact' : 'phone';
      if ((linkedLead as any)[leadField] === value) return;
      await updateLead(linkedLead.id, { [leadField]: value });
      return;
    }
    // Generic project field update
    if ((project as any)[field] === value) return;
    await updateProject(project.id, { [field]: value } as Partial<Project>);
  };

  return (
    <AnimatePresence mode="wait">
      {project && (
        <motion.aside
          key={project.id}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 420, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="flex-shrink-0 rounded-xl border border-zinc-200/60 dark:border-zinc-700/40 bg-white dark:bg-zinc-900 overflow-hidden"
          style={{ height: '100%' }}
        >
          <div className="w-[420px] h-full flex flex-col overflow-y-auto">
            {/* ═══ Header ═══ */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <ProjectTypeBadge type={project.type} />
                  <Badge variant={project.status === 'active' ? 'in_progress' : project.status === 'paused' ? 'blocked' : 'done'}>
                    {project.status === 'active' ? 'Ativo' : project.status === 'paused' ? 'Pausado' : 'Concluído'}
                  </Badge>
                  <Badge color={stageColor}>{stageLabel}</Badge>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Project Name */}
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{project.clientName}</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{project.clientContact}</p>
            </div>

            {/* ═══ Body (sections) ═══ */}
            <div className="px-4 pb-4 space-y-3 flex-1">

              {/* Detalhes */}
              <Section title="Detalhes" icon={<Briefcase className="w-3.5 h-3.5" />}>
                <div className="space-y-0.5">
                  <DetailRow label="Responsável">
                    <OwnerSelect
                      ownerId={project.ownerId}
                      users={users}
                      getUserById={getUserById}
                      onSave={(id) => handleFieldSave('ownerId', id)}
                    />
                  </DetailRow>
                  <DetailRow label="Tipo">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateProject(project.id, { type: 'recurring' })}
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer',
                          project.type === 'recurring'
                            ? 'bg-primary/15 text-primary'
                            : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        )}
                      >
                        Recorrente
                      </button>
                      <button
                        onClick={() => updateProject(project.id, { type: 'oneshot' })}
                        className={cn(
                          'px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer',
                          project.type === 'oneshot'
                            ? 'bg-primary/15 text-primary'
                            : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        )}
                      >
                        Único
                      </button>
                    </div>
                  </DetailRow>
                  <DetailRow label="Telefone">
                    <div className="flex items-center gap-1.5">
                      <EditableInline
                        value={project.clientPhone || ''}
                        onSave={(v) => handleFieldSave('clientPhone', v)}
                        placeholder="Adicionar..."
                      />
                      {project.clientPhone && (
                        <a
                          href={`https://wa.me/55${project.clientPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center w-5 h-5 rounded hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WhatsAppIcon className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </DetailRow>
                  <DetailRow label="Status">
                    <div className="flex items-center gap-1">
                      {(['active', 'paused', 'completed'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateProject(project.id, { status: s })}
                          className={cn(
                            'px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer',
                            project.status === s
                              ? s === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : s === 'paused' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          )}
                        >
                          {s === 'active' ? 'Ativo' : s === 'paused' ? 'Pausado' : 'Concluído'}
                        </button>
                      ))}
                    </div>
                  </DetailRow>
                  <DetailRow label="Próx. Entrega">
                    <span className={cn(
                      project.nextDeliveryDate && (new Date(project.nextDeliveryDate).getTime() - Date.now()) < 3 * 86400000
                        ? 'text-red-500 font-medium' : ''
                    )}>
                      {project.nextDeliveryDate ? new Date(project.nextDeliveryDate).toLocaleDateString('pt-BR') : 'Não definida'}
                    </span>
                  </DetailRow>
                  <DetailRow label="Tarefas">
                    <span>{project.taskIds.length} tarefas</span>
                  </DetailRow>
                </div>
              </Section>

              {/* Lead de Origem */}
              {linkedLead && (
                <Section title="Lead de Origem" icon={<Tag className="w-3.5 h-3.5" />}>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{linkedLead.name}</p>
                    </div>
                    <button
                      onClick={() => { onClose(); setLocation('/crm'); }}
                      className="text-[10px] text-primary hover:underline cursor-pointer font-medium flex-shrink-0"
                    >Ver no CRM</button>
                  </div>
                </Section>
              )}

              {/* Sprint Atual */}
              {currentSprint && (
                <Section
                  title="Sprint Atual"
                  icon={<Briefcase className="w-3.5 h-3.5" />}
                  action={editable ? (
                    <button
                      onClick={() => completeSprint(currentSprint.id)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[9px] font-semibold uppercase tracking-wider hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Concluir
                    </button>
                  ) : undefined}
                >
                  <div className="rounded-lg p-3 bg-primary/5 dark:bg-primary/10 border border-primary/10">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-1.5">{currentSprint.name}</p>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(currentSprint.startDate).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {currentSprint.taskIds.length} tarefas
                      </span>
                      {currentSprint.dueDate && (
                        <span className={cn(
                          'flex items-center gap-1',
                          new Date(currentSprint.dueDate).getTime() < Date.now() ? 'text-red-500 font-medium' : ''
                        )}>
                          <Clock className="w-2.5 h-2.5" />
                          Prazo: {new Date(currentSprint.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                </Section>
              )}

              {/* Timeline / Sprints */}
              <Section title="Timeline" icon={<Clock className="w-3.5 h-3.5" />}>
                {project.sprints.length === 0 ? (
                  <p className="text-[10px] text-zinc-400 text-center py-2">Nenhuma sprint.</p>
                ) : (
                  <div className="space-y-1.5">
                    {[...project.sprints].reverse().map((sprint) => {
                      const isActive = sprint.id === project.currentSprintId;
                      const sprintStageColor = getStageColor(PROJECT_STAGES, sprint.stage);
                      return (
                        <TimelineSprintRow
                          key={sprint.id}
                          sprint={sprint}
                          isActive={isActive}
                          stageColor={sprintStageColor}
                          stageLabel={getStageLabel(PROJECT_STAGES, sprint.stage)}
                          onRename={(name) => updateSprint(sprint.id, { name })}
                          onComplete={() => completeSprint(sprint.id)}
                          onDelete={() => deleteSprint(sprint.id)}
                          canEdit={editable}
                        />
                      );
                    })}
                  </div>
                )}
              </Section>

              {/* Meta */}
              <div className="text-[9px] text-zinc-400/60 pt-1 space-y-0.5">
                <p>Criado em {new Date(project.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


/* ─── Editable Inline Text ─── */
function EditableInline({ value, onSave, placeholder }: {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="text-xs bg-transparent outline-none border-b border-primary/40 w-full text-zinc-700 dark:text-zinc-300 py-0.5"
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setDraft(value); setEditing(false); }
        }}
        onBlur={commit}
      />
    );
  }

  return (
    <span
      className="cursor-text hover:text-primary transition-colors truncate"
      onDoubleClick={() => setEditing(true)}
      title="Duplo clique para editar"
    >
      {value || <span className="text-zinc-400 italic">{placeholder}</span>}
    </span>
  );
}


/* ─── Owner Select Dropdown ─── */
function OwnerSelect({ ownerId, users, getUserById, onSave }: {
  ownerId?: string;
  users: { id: string; name: string; initials: string; avatarUrl?: string }[];
  getUserById: (id: string) => { name: string; initials: string; avatarUrl?: string } | undefined;
  onSave: (userId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const owner = ownerId ? getUserById(ownerId) : undefined;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors"
      >
        {owner ? (
          <>
            <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
              {owner.avatarUrl ? (
                <img src={owner.avatarUrl} className="w-4 h-4 rounded-full object-cover" alt="" />
              ) : (
                <span className="text-[7px] font-bold text-primary">{owner.initials}</span>
              )}
            </div>
            <span className="text-xs">{owner.name.split(' ')[0]}</span>
          </>
        ) : (
          <span className="text-xs text-amber-500 italic">Sem responsável</span>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 py-1 max-h-44 overflow-y-auto">
          {users.map((u) => (
            <button
              key={u.id}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-primary/5 transition-colors cursor-pointer',
                u.id === ownerId && 'bg-primary/5 font-medium',
              )}
              onClick={() => { onSave(u.id); setOpen(false); }}
            >
              <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                ) : (
                  <span className="text-[8px] font-bold text-primary">{u.initials}</span>
                )}
              </div>
              <span className="text-zinc-700 dark:text-zinc-300 truncate">{u.name}</span>
              {u.id === ownerId && <Check className="w-3 h-3 text-primary ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


/* ─── Timeline Sprint Row ─── */
function TimelineSprintRow({ sprint, isActive, stageColor, stageLabel, onRename, onComplete, onDelete, canEdit }: {
  sprint: { id: string; name: string; status: string; startDate: string; endDate?: string; stage: string; dueDate?: string };
  isActive: boolean;
  stageColor: string;
  stageLabel: string;
  onRename: (name: string) => void;
  onComplete: () => void;
  onDelete: () => void;
  canEdit?: boolean;
}) {
  const isCompleted = sprint.status === 'completed';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(sprint.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(sprint.name); }, [sprint.name]);
  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== sprint.name) onRename(trimmed);
    else setDraft(sprint.name);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        'p-2 rounded-lg transition-all group/tl relative',
        isActive
          ? 'bg-white dark:bg-zinc-900 border border-primary/20 shadow-sm'
          : isCompleted
            ? 'opacity-60 hover:opacity-90'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
      )}
    >
      <div className="flex items-center gap-2 mb-0.5">
        {isCompleted ? (
          <div className="w-4 h-4 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : canEdit ? (
          <button
            onClick={onComplete}
            className="w-4 h-4 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group/check"
            title="Concluir sprint"
          >
            <Clock className="w-2.5 h-2.5 text-primary group-hover/check:hidden" />
            <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 hidden group-hover/check:block" />
          </button>
        ) : (
          <div className="w-4 h-4 rounded-md bg-primary/5 flex items-center justify-center flex-shrink-0">
            <Clock className="w-2.5 h-2.5 text-primary/40" />
          </div>
        )}

        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(sprint.name); setEditing(false); }
            }}
            className="text-[10px] font-medium bg-transparent outline-none border-b border-primary/40 w-full text-zinc-700 dark:text-zinc-300 py-0.5"
          />
        ) : (
          <p
            className={cn(
              'text-[10px] font-medium truncate flex-1',
              isCompleted ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300',
              !isCompleted && 'cursor-text hover:text-primary transition-colors',
            )}
            onDoubleClick={() => { if (!isCompleted) { setDraft(sprint.name); setEditing(true); } }}
            title="Duplo clique para editar"
          >
            {sprint.name}
          </p>
        )}

        {!editing && canEdit && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover/tl:opacity-100 transition-opacity flex-shrink-0">
            {!isCompleted && (
              <button
                onClick={() => { setDraft(sprint.name); setEditing(true); }}
                className="w-4 h-4 rounded flex items-center justify-center text-zinc-400 hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                title="Editar"
              >
                <Pencil className="w-2 h-2" />
              </button>
            )}
            <button
              onClick={onDelete}
              className="w-4 h-4 rounded flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
              title="Excluir"
            >
              <Trash2 className="w-2 h-2" />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 pl-6">
        <Badge color={stageColor}>{stageLabel}</Badge>
        <span className="text-[8px] text-zinc-400">
          {new Date(sprint.startDate).toLocaleDateString('pt-BR')}
        </span>
        {sprint.endDate && (
          <span className="text-[8px] text-emerald-500 flex items-center gap-0.5">
            <Check className="w-2 h-2" />
            {new Date(sprint.endDate).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}
