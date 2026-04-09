import { useState, useEffect, useCallback } from 'react';
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
  Users as UsersIcon,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/Button';
import { Select, SelectItem } from '@/shared/components/ui/Select';
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
  collaborator: { label: 'Colaborador', icon: UserCheck, color: 'text-success', bg: 'bg-success/15' },
  readonly: { label: 'Somente Leitura', icon: Eye, color: 'text-muted-foreground', bg: 'bg-muted/50' },
};

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

interface EditableFieldProps {
  label: string;
  value: string;
  icon: typeof Mail;
  onSave: (value: string) => void;
  placeholder?: string;
  type?: string;
}

function EditableField({ label, value, icon: Icon, onSave, placeholder, type = 'text' }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  function handleSave() {
    onSave(draft);
    setEditing(false);
  }

  return (
    <div className="group">
      <span className="label-style text-foreground-muted block mb-1">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
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
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
          />
          <button
            onClick={handleSave}
            className="w-7 h-7 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-foreground-muted/60 flex-shrink-0" />
          <span className="text-sm text-foreground flex-1 truncate">
            {value || <span className="text-foreground-muted/40 italic">{placeholder || 'Não informado'}</span>}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>
      )}
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

  // Count assignments
  const assignedProjects = projects.filter((p) => p.ownerId === member.id).length;
  const assignedTasks = tasks.filter((t) => t.ownerId === member.id).length;

  async function handleFieldSave(field: keyof User, value: string) {
    await updateUser(member!.id, { [field]: value || undefined });
  }

  async function handleRoleChange(newRole: string) {
    await updateUser(member!.id, { role: newRole as UserRole });
  }

  async function handleDelete() {
    await deleteUser(member!.id);
    close();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />

          {/* Drawer */}
          <motion.div
            className={cn(
              'fixed right-0 top-0 z-50 h-screen w-full max-w-md',
              'bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800',
              'shadow-2xl overflow-y-auto'
            )}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-foreground">
                Detalhes do Membro
              </h2>
              <button
                onClick={close}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Avatar + Name Section */}
              <div className="flex flex-col items-center text-center pb-6 border-b border-zinc-100 dark:border-zinc-800">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/20 mb-4"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-20 h-20 rounded-2xl flex items-center justify-center mb-4',
                      'bg-gradient-to-br shadow-lg',
                      gradient
                    )}
                  >
                    <span className="text-2xl font-bold text-white drop-shadow-sm">
                      {member.initials}
                    </span>
                  </div>
                )}

                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-foreground mb-1">
                  {member.name}
                </h3>

                {member.position && (
                  <p className="text-sm text-foreground-muted mb-3">{member.position}</p>
                )}

                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1',
                    'text-[10px] font-semibold uppercase tracking-wider rounded-full',
                    roleConfig.bg,
                    roleConfig.color
                  )}
                >
                  <RoleIcon className="w-3 h-3" />
                  {roleConfig.label}
                </span>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <FolderKanban className="w-4 h-4 text-primary" />
                    <span className="label-style text-foreground-muted">Projetos</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{assignedProjects}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-1">
                    <ListTodo className="w-4 h-4 text-blue-light" />
                    <span className="label-style text-foreground-muted">Tarefas</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{assignedTasks}</p>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <h4 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
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
              <div className="pt-2">
                <Select
                  label="Perfil de acesso"
                  value={member.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="manager">Gestor</SelectItem>
                  <SelectItem value="collaborator">Colaborador</SelectItem>
                  <SelectItem value="readonly">Somente Leitura</SelectItem>
                </Select>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                {!confirmDelete ? (
                  <Button
                    variant="ghost"
                    className="w-full text-destructive hover:bg-destructive/10"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remover Membro
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive text-center">
                      Confirma a remoção de <strong>{member.name}</strong>?
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        className="flex-1"
                        onClick={() => setConfirmDelete(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={handleDelete}
                      >
                        Confirmar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
