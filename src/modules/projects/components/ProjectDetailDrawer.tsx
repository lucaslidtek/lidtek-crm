import { useState, useRef, useEffect } from 'react';
import { X, Check, Clock, Calendar, User, Briefcase, Tag, Layers, Phone, Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { ProjectTypeBadge, Badge } from '@/shared/components/ui/Badge';
import { useStore } from '@/shared/lib/store';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { PROJECT_STAGES, getStageLabel, getStageColor } from '@/shared/lib/constants';
import type { Project } from '@/shared/types/models';
import { useLocation } from 'wouter';
import { createPortal } from 'react-dom';


interface ProjectDetailDrawerProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetailDrawer({ project, onClose }: ProjectDetailDrawerProps) {
  const { getUserById, leads, updateProject, updateLead, updateSprint, completeSprint, deleteSprint, users } = useStore();
  const { canEdit } = usePermissions();
  const [, setLocation] = useLocation();

  if (!project) return null;

  // Can this user edit this specific project?
  const editable = canEdit(project.ownerId);

  const linkedLead = leads.find(l => l.id === project.leadId);

  const handleFieldSave = async (field: keyof Project | 'clientName' | 'clientContact' | 'clientPhone', value: string) => {
    if (!project) return;
    // Client fields are owned by the lead — edit there for single source of truth
    if ((field === 'clientName' || field === 'clientContact' || field === 'clientPhone') && linkedLead) {
      const leadField = field === 'clientName' ? 'name' : field === 'clientContact' ? 'contact' : 'phone';
      if ((linkedLead as any)[leadField] === value) return;
      await updateLead(linkedLead.id, { [leadField]: value });
      return;
    }
    if (project[field as keyof Project] === value) return;
    const updates: Partial<Project> = {};
    if (field === 'ownerId') updates.ownerId = value;
    await updateProject(project.id, updates);
  };

  const currentSprint = project.sprints.find(s => s.id === project.currentSprintId);
  const stageColor = currentSprint ? getStageColor(PROJECT_STAGES, currentSprint.stage) : '#A3A3A3';
  const stageLabel = currentSprint ? getStageLabel(PROJECT_STAGES, currentSprint.stage) : 'Onboarding';

  return createPortal(
    <AnimatePresence>
      {project && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-[99]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[6vh] px-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-zinc-900 w-full max-w-[900px] max-h-[82vh] rounded-xl overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
              initial={{ y: 40, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ═══ Header ═══ */}
              <div className="px-6 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <ProjectTypeBadge type={project.type} />
                    <Badge variant={project.status === 'active' ? 'in_progress' : project.status === 'paused' ? 'blocked' : 'done'}>
                      {project.status === 'active' ? 'Ativo' : project.status === 'paused' ? 'Pausado' : 'Concluído'}
                    </Badge>
                    <Badge color={stageColor}>{stageLabel}</Badge>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 -mr-1.5 -mt-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{project.clientName}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{project.clientContact}</p>
              </div>

              {/* ═══ Body ═══ */}
              <div className="flex flex-1 overflow-hidden">

                {/* ── Left ── */}
                <div className="flex-1 p-6 space-y-5 overflow-y-auto">

                  {/* Info cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <OwnerFieldCard
                      ownerId={project.ownerId}
                      users={users}
                      getUserById={getUserById}
                      onSave={(id) => handleFieldSave('ownerId', id)}
                    />
                    <FieldCard
                      icon={<Phone className="w-3.5 h-3.5" />}
                      label="Telefone"
                      value={project.clientPhone || ''}
                      editable
                      onSave={(v) => handleFieldSave('clientPhone', v)}
                      action={project.clientPhone ? (
                        <a 
                          href={`https://wa.me/55${project.clientPhone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center w-5 h-5 rounded hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors"
                          title="Abrir no WhatsApp"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                        </a>
                      ) : undefined}
                    />
                    <FieldCard
                      icon={<Calendar className="w-3.5 h-3.5" />}
                      label="Próx. Entrega"
                      value={project.nextDeliveryDate ? new Date(project.nextDeliveryDate).toLocaleDateString('pt-BR') : 'Não definida'}
                      alert={!!(project.nextDeliveryDate && (new Date(project.nextDeliveryDate).getTime() - Date.now()) < 3 * 86400000)}
                    />
                    <FieldCard icon={<Layers className="w-3.5 h-3.5" />} label="Tarefas" value={`${project.taskIds.length} tarefas`} />
                  </div>

                  {/* Linked Lead */}
                  {linkedLead && (
                    <div className="rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                      <Tag className="w-4 h-4 text-zinc-400" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 block">Lead de origem</span>
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate">{linkedLead.name}</p>
                      </div>
                      <button
                        onClick={() => { onClose(); setLocation('/crm'); }}
                        className="text-[10px] text-violet-600 dark:text-violet-400 hover:underline cursor-pointer font-medium"
                      >Ver no CRM</button>
                    </div>
                  )}

                  {/* Current Sprint */}
                  {currentSprint && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Briefcase className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Sprint Atual</span>
                      </div>
                      <div className="rounded-lg p-4 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{currentSprint.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge color={stageColor}>{stageLabel}</Badge>
                            {editable && (
                              <button
                                onClick={() => completeSprint(currentSprint.id)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold uppercase tracking-wider hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Concluir
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Início: {new Date(currentSprint.startDate).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {currentSprint.taskIds.length} tarefas
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Right: Timeline ── */}
                <div className="w-[280px] flex-shrink-0 border-l border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 space-y-4 overflow-y-auto">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Timeline</h3>
                    <span className="text-[10px] text-zinc-400 ml-auto bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full font-medium">
                      {project.sprints.length}
                    </span>
                  </div>

                  <div className="space-y-2">
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
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}


// ─── Timeline Sprint Row (Drawer) ─────────────────────

function TimelineSprintRow({ sprint, isActive, stageColor, stageLabel, onRename, onComplete, onDelete, canEdit }: {
  sprint: { id: string; name: string; status: string; startDate: string; endDate?: string; stage: string };
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
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
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
        'p-2.5 rounded-lg transition-all group/tl relative',
        isActive
          ? 'bg-white dark:bg-zinc-900 border border-violet-200 dark:border-violet-800 shadow-sm'
          : isCompleted
            ? 'opacity-60 hover:opacity-90'
            : 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {/* Status icon / checkbox */}
        {isCompleted ? (
          <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          </div>
        ) : canEdit ? (
          <button
            onClick={onComplete}
            className="w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors group/check"
            title="Concluir sprint"
          >
            <Clock className="w-3 h-3 text-violet-600 dark:text-violet-400 group-hover/check:hidden" />
            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 hidden group-hover/check:block" />
          </button>
        ) : (
          <div className="w-5 h-5 rounded-md bg-violet-100/50 dark:bg-violet-900/20 flex items-center justify-center flex-shrink-0">
            <Clock className="w-3 h-3 text-violet-400" />
          </div>
        )}

        {/* Name (double-click to edit) */}
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
            className="text-[11px] font-medium bg-transparent outline-none border-b border-violet-400 w-full text-zinc-700 dark:text-zinc-300 py-0.5"
          />
        ) : (
          <p
            className={cn(
              'text-[11px] font-medium truncate flex-1',
              isCompleted ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300',
              !isCompleted && 'cursor-text hover:text-violet-600 dark:hover:text-violet-400 transition-colors',
            )}
            onDoubleClick={() => { if (!isCompleted) { setDraft(sprint.name); setEditing(true); } }}
            title="Duplo clique para editar"
          >
            {sprint.name}
          </p>
        )}

        {/* Action buttons (hover) — only for users with edit permission */}
        {!editing && canEdit && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover/tl:opacity-100 transition-opacity flex-shrink-0">
            {!isCompleted && (
              <button
                onClick={() => { setDraft(sprint.name); setEditing(true); }}
                className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors cursor-pointer"
                title="Editar"
              >
                <Pencil className="w-2.5 h-2.5" />
              </button>
            )}
            <button
              onClick={onDelete}
              className="w-5 h-5 rounded flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
              title="Excluir"
            >
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 pl-7">
        <Badge color={stageColor}>{stageLabel}</Badge>
        <span className="text-[9px] text-zinc-400">
          {new Date(sprint.startDate).toLocaleDateString('pt-BR')}
        </span>
        {sprint.endDate && (
          <span className="text-[9px] text-emerald-500 flex items-center gap-0.5">
            <Check className="w-2.5 h-2.5" />
            {new Date(sprint.endDate).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  );
}


function FieldCard({ icon, label, value, alert, editable, onSave, action }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  alert?: boolean;
  editable?: boolean;
  onSave?: (value: string) => void;
  action?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value && onSave) onSave(draft.trim());
  };

  return (
    <div
      className={cn(
        'rounded-lg p-2.5 border transition-colors relative group',
        alert
          ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
          : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800',
        editable && !editing && 'hover:border-violet-200 dark:hover:border-violet-700 cursor-pointer',
      )}
      onClick={(e) => { if (editable && !editing) { e.preventDefault(); setEditing(true); } }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={alert ? 'text-red-500' : 'text-zinc-400'}>{icon}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</span>
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>{action}</div>
        )}
      </div>
      {editing ? (
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
          className="text-sm font-medium bg-transparent outline-none border-b border-violet-400 w-full text-zinc-800 dark:text-zinc-200"
        />
      ) : (
        <p className={cn('text-sm font-medium truncate', alert ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200')}>
          {value || (editable ? <span className="text-zinc-400 font-normal italic">Adicionar...</span> : '—')}
        </p>
      )}
    </div>
  );
}

/* ═══ Owner Field Card — pick responsible user ═══ */
function OwnerFieldCard({ ownerId, users, getUserById, onSave }: {
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
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          'rounded-lg p-2.5 border transition-colors bg-zinc-50 dark:bg-zinc-800/50 hover:border-violet-200 dark:hover:border-violet-700 cursor-pointer',
          !ownerId ? 'border-amber-200 dark:border-amber-800/50' : 'border-zinc-100 dark:border-zinc-800',
        )}
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className={!ownerId ? 'text-amber-500' : 'text-zinc-400'}><User className="w-3.5 h-3.5" /></span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Responsável</span>
        </div>
        <div className="flex items-center gap-2">
          {owner ? (
            <>
              <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                {owner.avatarUrl ? (
                  <img src={owner.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                ) : (
                  <span className="text-[8px] font-bold text-violet-600 dark:text-violet-400">{owner.initials}</span>
                )}
              </div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{owner.name.split(' ')[0]}</span>
            </>
          ) : (
            <span className="text-sm text-amber-500 dark:text-amber-400 italic">Sem responsável</span>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 py-1 max-h-52 overflow-y-auto">
          {users.map((u) => (
            <button
              key={u.id}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors cursor-pointer',
                u.id === ownerId && 'bg-violet-50 dark:bg-violet-950/20 font-medium',
              )}
              onClick={() => { onSave(u.id); setOpen(false); }}
            >
              <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                ) : (
                  <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400">{u.initials}</span>
                )}
              </div>
              <span className="text-zinc-700 dark:text-zinc-300 truncate">{u.name}</span>
              {u.id === ownerId && <Check className="w-3.5 h-3.5 text-violet-500 ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

