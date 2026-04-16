import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, Mail, Phone, Briefcase, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { FloatingActionButton } from '@/shared/components/ui/FloatingActionButton';
import { useStore } from '@/shared/lib/store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import type { User, UserRole } from '@/shared/types/models';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { AddMemberDialog } from '../components/AddMemberDialog';
import { MemberDetailDrawer } from '../components/MemberDetailDrawer';

const ROLE_FILTERS: { id: UserRole | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'admin', label: 'Admin' },
  { id: 'manager', label: 'Gestor' },
  { id: 'collaborator', label: 'Colaborador' },
  { id: 'readonly', label: 'Leitura' },
];

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: 'text-primary', bg: 'bg-primary/15' },
  manager: { label: 'Gestor', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  collaborator: { label: 'Colaborador', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  readonly: { label: 'Leitura', color: 'text-foreground-muted', bg: 'bg-zinc-100 dark:bg-zinc-800' },
};

function MemberRow({ member, onClick, index }: { member: User; onClick: () => void; index: number }) {
  const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.readonly;
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 transition-colors group text-left"
    >
      <div className="relative flex-shrink-0">
        <UserAvatar
          name={member.name}
          initials={member.initials}
          avatarUrl={member.avatarUrl}
          size="md"
          className="w-9 h-9 rounded-xl"
        />
        {member.status === 'active' && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-zinc-900" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {member.name}
          </span>
          <span className={cn(
            'hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex-shrink-0',
            roleConfig.bg, roleConfig.color
          )}>
            {roleConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {member.position && (
            <span className="flex items-center gap-1 text-[11px] text-foreground-muted truncate">
              <Briefcase className="w-3 h-3 flex-shrink-0" />
              {member.position}
            </span>
          )}
          <span className="hidden sm:flex items-center gap-1 text-[11px] text-foreground-muted truncate">
            <Mail className="w-3 h-3 flex-shrink-0" />
            {member.email}
          </span>
          {member.phone && (
            <span className="hidden md:flex items-center gap-1 text-[11px] text-foreground-muted">
              <Phone className="w-3 h-3 flex-shrink-0" />
              {member.phone}
            </span>
          )}
        </div>
      </div>

      <span className={cn(
        'sm:hidden inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider flex-shrink-0',
        roleConfig.bg, roleConfig.color
      )}>
        {roleConfig.label}
      </span>

      <ChevronRight className="w-4 h-4 text-foreground-muted/40 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.button>
  );
}

export function TeamPage() {
  const { users } = useStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const filteredMembers = useMemo(() => {
    return users
      .filter((user) => {
        const matchesSearch =
          !search ||
          user.name.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase()) ||
          (user.position && user.position.toLowerCase().includes(search.toLowerCase()));
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [users, search, roleFilter]);

  const groupedMembers = useMemo(() => {
    const groups: { letter: string; members: User[] }[] = [];
    for (const member of filteredMembers) {
      const letter = member.name[0]?.toUpperCase() ?? '#';
      const last = groups[groups.length - 1];
      if (last && last.letter === letter) {
        last.members.push(member);
      } else {
        groups.push({ letter, members: [member] });
      }
    }
    return groups;
  }, [filteredMembers]);

  const roleStats = useMemo(() => {
    const stats: Record<string, number> = { all: users.length };
    for (const u of users) { stats[u.role] = (stats[u.role] || 0) + 1; }
    return stats;
  }, [users]);

  const selectedMember = selectedMemberId ? users.find((u) => u.id === selectedMemberId) ?? null : null;
  const n = filteredMembers.length;

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex-shrink-0">
        <PageHeader
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder={search ? `${n} membro${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}` : `Buscar entre ${users.length} membros...`}
          actions={
            <>
              <div className="flex items-center gap-1 p-1 glass-subtle rounded-lg">
                {ROLE_FILTERS.map((filter) => {
                  const isActive = roleFilter === filter.id;
                  const count = roleStats[filter.id] ?? 0;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => setRoleFilter(filter.id)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                        'transition-all duration-200 cursor-pointer whitespace-nowrap',
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
                      )}
                    >
                      {filter.label}
                      <span className={cn(
                        'px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                        isActive ? 'bg-primary/20 text-primary' : 'bg-black/5 dark:bg-white/10 text-foreground-muted'
                      )}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {!isMobile && (
                <Button onClick={() => setAddDialogOpen(true)} size="sm">
                  <Plus className="w-4 h-4" />
                  Novo Membro
                </Button>
              )}
            </>
          }
        />
      </div>

      <div className={cn('flex flex-1 min-h-0', !isMobile && 'gap-4')}>
        <div className={cn(
          'flex-1 min-w-0 overflow-y-auto h-full rounded-xl',
          !isMobile
            ? 'bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-200/60 dark:border-zinc-700/40'
            : 'glass',
        )}>
          {filteredMembers.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {groupedMembers.map((group) => (
                <div key={group.letter}>
                  <div className="px-4 py-1.5 flex items-center gap-3">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-foreground-muted/50 w-4 text-center">
                      {group.letter}
                    </span>
                    <div className="flex-1 h-px bg-border-subtle" />
                  </div>
                  <div className="divide-y divide-border-subtle/50">
                    {group.members.map((member, i) => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        index={i}
                        onClick={() => setSelectedMemberId(member.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </AnimatePresence>
          ) : (
            <motion.div
              className="flex flex-col items-center justify-center py-20 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-primary/40" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground/60 mb-1">
                Nenhum membro encontrado
              </h3>
              <p className="text-sm text-foreground-muted max-w-sm">
                {search || roleFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Adicione o primeiro membro da equipe para começar.'}
              </p>
              {!search && roleFilter === 'all' && (
                <Button onClick={() => setAddDialogOpen(true)} className="mt-6" size="sm">
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar Membro
                </Button>
              )}
            </motion.div>
          )}
        </div>

        <MemberDetailDrawer
          member={selectedMember}
          onClose={() => setSelectedMemberId(null)}
        />
      </div>

      <AddMemberDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      {/* Mobile FAB */}
      {isMobile && (
        <FloatingActionButton
          onClick={() => setAddDialogOpen(true)}
          icon={<Plus className="w-5 h-5" />}
          label="Novo Membro"
        />
      )}
    </div>
  );
}
