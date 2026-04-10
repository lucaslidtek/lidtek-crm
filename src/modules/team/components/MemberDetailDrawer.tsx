import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Mail,
  Phone,
  Briefcase,
  Shield,
  Crown,
  UserCheck,
  Eye,
  Trash2,
  Check,
  Pencil,
  FolderKanban,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/Button';
import { useStore } from '@/shared/lib/store';
import type { User, UserRole } from '@/shared/types/models';

interface MemberDetailDrawerProps {
  member: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_CONFIG: Record<UserRole, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  admin: { label: 'Administrador', icon: Crown, color: 'text-primary', bg: 'bg-primary/15' },
  manager: { label: 'Gestor', icon: Shield, color: 'text-blue-light', bg: 'bg-blue-light/15' },
  gestor: { label: 'Gestor', icon: Shield, color: 'text-blue-light', bg: 'bg-blue-light/15' },
  collaborator: { label: 'Colaborador', icon: UserCheck, color: 'text-success', bg: 'bg-success/15' },
  readonly: { label: 'Somente Leitura', icon: Eye, color: 'text-muted-foreground', bg: 'bg-muted/50' },
  leitura: { label: 'Somente Leitura', icon: Eye, color: 'text-muted-foreground', bg: 'bg-muted/50' },
};

const ROLES: UserRole[] = ['admin', 'gestor', 'collaborator', 'readonly'];

function getAvatarGradient(initials: string): string {
  const gradients = [
    'from-primary/80 to-blue-light/80',
    'from-blue-light/80 to-primary/80',
    'from-primary/70 to-success/60',
    'from-success/70 to-blue-light/70',
    'from-warning/70 to-primary/60',
    'from-primary/60 to-primary-light/80',
  ];
  const index = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % gradients.length;
  return gradients[index]!;
}

/* ═══ Editable inline field ═══ */
function EditableField({ label, value, icon: Icon, onSave, placeholder, type = 'text' }: {
  label: string;
  value: string;
  icon: typeof Mail;
  onSave: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  function commit() {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  }

  return (
    <div className="group">
      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            ref={ref}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'flex-1 px-3 py-1.5 rounded-lg text-sm',
              'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
              'text-foreground placeholder:text-foreground-muted/50',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
              'transition-all duration-200'
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            onBlur={commit}
          />
          <button
            onClick={commit}
            className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group">
          <Icon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <span className="text-sm text-zinc-800 dark:text-zinc-200 flex-1 truncate">
            {value || <span className="text-zinc-400 italic">{placeholder || 'Não informado'}</span>}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══ Role selector row ═══ */
function RoleSelector({ value, onSave }: { value: UserRole; onSave: (role: UserRole) => void }) {
  return (
    <div>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-2">
        Perfil de acesso
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        {ROLES.map((role) => {
          const cfg = ROLE_CONFIG[role];
          const RoleIcon = cfg.icon;
          const isActive = value === role;
          return (
            <button
              key={role}
              onClick={() => onSave(role)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer',
                isActive
                  ? `${cfg.bg} ${cfg.color} border-current/20`
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800',
              )}
            >
              <RoleIcon className="w-3.5 h-3.5 flex-shrink-0" />
              {cfg.label}
              {isActive && <Check className="w-3 h-3 ml-auto flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MemberDetailDrawer({ member, open, onOpenChange }: MemberDetailDrawerProps) {
  const { updateUser, deleteUser, projects, tasks } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const close = useCallback(() => {
    setConfirmDelete(false);
    onOpenChange(false);
  }, [onOpenChange]);

  if (!member) return null;

  const roleConfig = ROLE_CONFIG[member.role];
  const RoleIcon = roleConfig.icon;
  const gradient = getAvatarGradient(member.initials);

  const assignedProjects = projects.filter((p) => p.ownerId === member.id).length;
  const assignedTasks = tasks.filter((t) => t.ownerId === member.id).length;

  async function handleFieldSave(field: keyof User, value: string) {
    await updateUser(member!.id, { [field]: value || undefined });
  }

  async function handleRoleChange(newRole: UserRole) {
    await updateUser(member!.id, { role: newRole });
  }

  async function handleDelete() {
    await deleteUser(member!.id);
    close();
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[99]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />

          {/* Modal container */}
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[6vh] px-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-zinc-900 w-full max-w-[560px] max-h-[82vh] rounded-xl overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
              initial={{ y: 40, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ═══ Header ═══ */}
              <div className="px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-1',
                      'text-[9px] font-semibold uppercase tracking-wider rounded-full',
                      roleConfig.bg,
                      roleConfig.color
                    )}
                  >
                    <RoleIcon className="w-3 h-3" />
                    {roleConfig.label}
                  </span>
                </div>
                <button
                  onClick={close}
                  className="p-1.5 -mr-1.5 -mt-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* ═══ Body (scrollable) ═══ */}
              <div className="overflow-y-auto flex-1">
                {/* Avatar + name */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-zinc-100 dark:border-zinc-800">
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt={member.name}
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/20 flex-shrink-0"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                        'bg-gradient-to-br shadow-md',
                        gradient
                      )}
                    >
                      <span className="text-xl font-bold text-white drop-shadow-sm">
                        {member.initials}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                      {member.name}
                    </h2>
                    {member.position && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{member.position}</p>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                      <FolderKanban className="w-4 h-4 text-primary" />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Projetos</span>
                    </div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{assignedProjects}</p>
                  </div>
                  <div className="rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                      <ListTodo className="w-4 h-4 text-blue-500" />
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Tarefas</span>
                    </div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{assignedTasks}</p>
                  </div>
                </div>

                {/* Contact info */}
                <div className="px-6 py-4 space-y-4 border-b border-zinc-100 dark:border-zinc-800">
                  <h4 className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Informações de Contato
                  </h4>
                  <EditableField
                    label="E-mail"
                    value={member.email}
                    icon={Mail}
                    onSave={(v) => handleFieldSave('email', v)}
                    placeholder="email@exemplo.com"
                    type="email"
                  />
                  <EditableField
                    label="Telefone"
                    value={member.phone || ''}
                    icon={Phone}
                    onSave={(v) => handleFieldSave('phone', v)}
                    placeholder="(11) 99999-9999"
                  />
                  <EditableField
                    label="Cargo / Função"
                    value={member.position || ''}
                    icon={Briefcase}
                    onSave={(v) => handleFieldSave('position', v)}
                    placeholder="Ex: Desenvolvedor"
                  />
                </div>

                {/* Role */}
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                  <RoleSelector value={member.role} onSave={handleRoleChange} />
                </div>

                {/* Danger zone */}
                <div className="px-6 py-4">
                  {!confirmDelete ? (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remover Membro
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-500 text-center">
                        Confirma a remoção de <strong>{member.name}</strong>?
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" className="flex-1" onClick={() => setConfirmDelete(false)}>
                          Cancelar
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={handleDelete}>
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  )}
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
