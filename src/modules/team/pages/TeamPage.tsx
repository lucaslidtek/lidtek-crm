import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useStore } from '@/shared/lib/store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import type { UserRole } from '@/shared/types/models';
import { TeamMemberCard } from '../components/TeamMemberCard';
import { AddMemberDialog } from '../components/AddMemberDialog';
import { MemberDetailDrawer } from '../components/MemberDetailDrawer';

const ROLE_FILTERS: { id: UserRole | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'admin', label: 'Admin' },
  { id: 'manager', label: 'Gestor' },
  { id: 'collaborator', label: 'Colaborador' },
  { id: 'readonly', label: 'Leitura' },
];

export function TeamPage() {
  const { users } = useStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const filteredMembers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        !search ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        (user.position && user.position.toLowerCase().includes(search.toLowerCase()));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const roleStats = useMemo(() => {
    const stats: Record<string, number> = { all: users.length };
    for (const u of users) { stats[u.role] = (stats[u.role] || 0) + 1; }
    return stats;
  }, [users]);

  const selectedMember = selectedMemberId ? users.find((u) => u.id === selectedMemberId) ?? null : null;
  const n = filteredMembers.length;

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>

      {/* ── Utility bar ── */}
      <div className="flex-shrink-0">
        <PageHeader
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder={search ? `${n} membro${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}` : `Buscar entre ${users.length} membros...`}
          actions={
            <>
              {/* Role filter chips */}
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

              <Button onClick={() => setAddDialogOpen(true)} size="sm">
                <Plus className="w-4 h-4" />
                Novo Membro
              </Button>
            </>
          }
        />
      </div>

      {/* ── Content: Grid + Detail Panel side by side ── */}
      <div className={cn('flex flex-1 min-h-0', !isMobile && 'gap-4')}>
        {/* Main content */}
        <div className={cn(
          'flex-1 min-w-0 overflow-y-auto h-full',
          !isMobile && 'rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-200/60 dark:border-zinc-700/40 p-4',
          isMobile && 'p-0',
        )}>
          {/* Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {filteredMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
                >
                  <TeamMemberCard
                    member={member}
                    onClick={() => setSelectedMemberId(member.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Empty State */}
          {filteredMembers.length === 0 && (
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

        {/* Detail Side Panel — inline, beside content */}
        <MemberDetailDrawer
          member={selectedMember}
          onClose={() => setSelectedMemberId(null)}
        />
      </div>

      <AddMemberDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
}
