import { useState, useEffect, useRef } from 'react';
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
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/Button';
import { MobileDrawerWrapper } from '@/shared/components/layout/MobileDrawerWrapper';
import { useStore } from '@/shared/lib/store';
import type { User, UserRole } from '@/shared/types/models';

interface MemberDetailDrawerProps {
  member: User | null;
  onClose: () => void;
}

const ROLE_CONFIG: Record<string, { label: string; icon: typeof Crown; color: string; bg: string }> = {
  admin: { label: 'Administrador', icon: Crown, color: 'text-primary', bg: 'bg-primary/15' },
  manager: { label: 'Gestor', icon: Shield, color: 'text-blue-light', bg: 'bg-blue-light/15' },
  gestor: { label: 'Gestor', icon: Shield, color: 'text-blue-light', bg: 'bg-blue-light/15' },
  collaborator: { label: 'Colaborador', icon: UserCheck, color: 'text-success', bg: 'bg-success/15' },
  readonly: { label: 'Somente Leitura', icon: Eye, color: 'text-muted-foreground', bg: 'bg-muted/50' },
  leitura: { label: 'Somente Leitura', icon: Eye, color: 'text-muted-foreground', bg: 'bg-muted/50' },
};

const ROLES: UserRole[] = ['admin', 'manager', 'collaborator', 'readonly'];

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

/* ═══ Section container (GitLab-style) ═══ */
function Section({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-zinc-50/80 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60 px-4 py-3">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-zinc-400">{icon}</span>
        <h4 className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
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
    <div className="flex items-center gap-2 group py-1">
      <Icon className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
      <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 w-16 flex-shrink-0">{label}</span>
      {editing ? (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <input
            ref={ref}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={placeholder}
            className={cn(
              'flex-1 min-w-0 px-2 py-1 rounded-md text-xs',
              'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
              'text-foreground placeholder:text-foreground-muted/50',
              'focus:outline-none focus:ring-2 focus:ring-primary/30',
            )}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            onBlur={commit}
          />
          <button
            onClick={commit}
            className="w-5 h-5 rounded-md bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors cursor-pointer"
          >
            <Check className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-xs text-zinc-700 dark:text-zinc-300 flex-1 truncate">
            {value || <span className="text-zinc-400 italic">{placeholder || 'Não informado'}</span>}
          </span>
          <button
            onClick={() => setEditing(true)}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <Pencil className="w-2.5 h-2.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══ Role selector ═══ */
function RoleSelector({ value, onSave }: { value: UserRole; onSave: (role: UserRole) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {ROLES.map((role) => {
        const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.collaborator!;
        const RoleIcon = cfg.icon;
        const isActive = value === role;
        return (
          <button
            key={role}
            onClick={() => onSave(role)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all border cursor-pointer',
              isActive
                ? `${cfg.bg} ${cfg.color} border-current/20`
                : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800',
            )}
          >
            <RoleIcon className="w-3 h-3 flex-shrink-0" />
            {cfg.label}
            {isActive && <Check className="w-2.5 h-2.5 ml-auto flex-shrink-0" />}
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN: MemberDetailDrawer (inline side panel)
   ═══════════════════════════════════════════════ */
export function MemberDetailDrawer({ member, onClose }: MemberDetailDrawerProps) {
  const { updateUser, deleteUser, projects, tasks } = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (member) {
      setNameDraft(member.name);
      setConfirmDelete(false);
      setEditingName(false);
    }
  }, [member?.id]);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  function commitName() {
    setEditingName(false);
    if (member && nameDraft.trim() && nameDraft.trim() !== member.name) {
      const parts = nameDraft.trim().split(/\s+/);
      const initials = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
      updateUser(member.id, { name: nameDraft.trim(), initials: initials.toUpperCase() });
    } else if (member) {
      setNameDraft(member.name);
    }
  }

  // Null-safe derived state
  const roleConfig = member ? (ROLE_CONFIG[member.role] ?? ROLE_CONFIG.collaborator!) : ROLE_CONFIG.collaborator!;
  const RoleIcon = roleConfig.icon;
  const gradient = member ? getAvatarGradient(member.initials) : 'from-zinc-400 to-zinc-600';
  const assignedProjects = member ? projects.filter((p) => p.ownerId === member.id).length : 0;
  const assignedTasks = member ? tasks.filter((t) => t.ownerId === member.id).length : 0;

  async function handleFieldSave(field: keyof User, value: string) {
    if (!member) return;
    await updateUser(member.id, { [field]: value || undefined });
  }

  async function handleRoleChange(newRole: UserRole) {
    if (!member) return;
    await updateUser(member.id, { role: newRole });
  }

  async function handleDelete() {
    if (!member) return;
    await deleteUser(member.id);
    onClose();
  }

  return (
    <MobileDrawerWrapper
      itemKey={member?.id ?? null}
      open={!!member}
      onClose={onClose}
      desktopWidth={380}
    >
      {member && (
        <div className="h-full flex flex-col overflow-y-auto">
            {/* ═══ Header ═══ */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1',
                    'text-[9px] font-semibold uppercase tracking-wider rounded-full',
                    roleConfig.bg, roleConfig.color
                  )}
                >
                  <RoleIcon className="w-3 h-3" />
                  {roleConfig.label}
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/20 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      'bg-gradient-to-br shadow-md',
                      gradient
                    )}
                  >
                    <span className="text-lg font-bold text-white drop-shadow-sm">
                      {member.initials}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={nameDraft}
                        onChange={(e) => setNameDraft(e.target.value)}
                        className={cn(
                          'flex-1 min-w-0 px-2 py-1 rounded-lg text-base font-bold',
                          'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
                          'text-zinc-900 dark:text-zinc-100 placeholder:text-foreground-muted/50',
                          'focus:outline-none focus:ring-2 focus:ring-primary/30',
                        )}
                        placeholder="Nome"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitName();
                          if (e.key === 'Escape') { setNameDraft(member.name); setEditingName(false); }
                        }}
                        onBlur={commitName}
                      />
                      <button
                        onClick={commitName}
                        className="w-6 h-6 rounded-md bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors cursor-pointer flex-shrink-0"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                        {member.name}
                      </h2>
                      <button
                        onClick={() => setEditingName(true)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer flex-shrink-0"
                      >
                        <Pencil className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                  {member.position && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{member.position}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ Body (sections) ═══ */}
            <div className="px-4 pb-4 space-y-3 flex-1">

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <FolderKanban className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Projetos</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{assignedProjects}</p>
                </div>
                <div className="rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ListTodo className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">Tarefas</span>
                  </div>
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{assignedTasks}</p>
                </div>
              </div>

              {/* Contact */}
              <Section title="Contato" icon={<UserIcon className="w-3.5 h-3.5" />}>
                <div className="space-y-0.5">
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
                    label="Cargo"
                    value={member.position || ''}
                    icon={Briefcase}
                    onSave={(v) => handleFieldSave('position', v)}
                    placeholder="Ex: Desenvolvedor"
                  />
                </div>
              </Section>

              {/* Role */}
              <Section title="Perfil de Acesso" icon={<Shield className="w-3.5 h-3.5" />}>
                <RoleSelector value={member.role} onSave={handleRoleChange} />
              </Section>

              {/* Danger zone */}
              <div className="pt-2">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-red-500/70 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remover Membro
                  </button>
                ) : (
                  <div className="space-y-2 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 p-3">
                    <p className="text-xs text-red-500 text-center">
                      Confirma a remoção de <strong>{member.name}</strong>?
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" className="flex-1 !text-xs !py-1.5" onClick={() => setConfirmDelete(false)}>
                        Cancelar
                      </Button>
                      <Button variant="destructive" className="flex-1 !text-xs !py-1.5" onClick={handleDelete}>
                        Confirmar
                      </Button>
                    </div>
                  </div>
                )}
              </div>


            </div>
        </div>
      )}
    </MobileDrawerWrapper>
  );
}
