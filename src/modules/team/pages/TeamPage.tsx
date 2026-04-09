import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Users,
  Shield,
  Crown,
  Eye,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/Button';
import { useStore } from '@/shared/lib/store';
import type { UserRole } from '@/shared/types/models';
import { TeamMemberCard } from '../components/TeamMemberCard';
import { AddMemberDialog } from '../components/AddMemberDialog';
import { MemberDetailDrawer } from '../components/MemberDetailDrawer';

const ROLE_FILTERS: { id: UserRole | 'all'; label: string; icon: typeof Users }[] = [
  { id: 'all', label: 'Todos', icon: Users },
  { id: 'admin', label: 'Admin', icon: Crown },
  { id: 'manager', label: 'Gestor', icon: Shield },
  { id: 'collaborator', label: 'Colaborador', icon: UserCheck },
  { id: 'readonly', label: 'Leitura', icon: Eye },
];

export function TeamPage() {
  const { users } = useStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

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
    for (const u of users) {
      stats[u.role] = (stats[u.role] || 0) + 1;
    }
    return stats;
  }, [users]);

  const selectedMember = selectedMemberId
    ? users.find((u) => u.id === selectedMemberId) ?? null
    : null;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground">
            Equipe
            <span className="text-foreground-muted/40 font-semibold text-lg ml-2">({users.length})</span>
          </h1>
          <p className="text-sm text-foreground-muted mt-0.5">Membros e responsáveis</p>
        </div>

        <Button onClick={() => setAddDialogOpen(true)} size="default">
          <Plus className="w-4 h-4" />
          Novo Membro
        </Button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou cargo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm',
              'bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700',
              'text-foreground placeholder:text-foreground-muted/50',
              'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
              'transition-all duration-300'
            )}
          />
        </div>

        {/* Role filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {ROLE_FILTERS.map((filter) => {
            const isActive = roleFilter === filter.id;
            const count = roleStats[filter.id] ?? 0;
            return (
              <button
                key={filter.id}
                onClick={() => setRoleFilter(filter.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                  'transition-all duration-300 cursor-pointer',
                  isActive
                    ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                    : 'bg-black/5 dark:bg-white/5 text-foreground-muted hover:text-foreground hover:bg-black/10 dark:hover:bg-white/10'
                )}
              >
                <filter.icon className="w-3.5 h-3.5" />
                {filter.label}
                <span
                  className={cn(
                    'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'bg-black/5 dark:bg-white/10 text-foreground-muted'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredMembers.map((member, index) => (
            <motion.div
              key={member.id}
              layout
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{
                duration: 0.3,
                delay: index * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
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
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="mt-6"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar Membro
            </Button>
          )}
        </motion.div>
      )}

      {/* Add Member Dialog */}
      <AddMemberDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {/* Member Detail Drawer */}
      <MemberDetailDrawer
        member={selectedMember}
        open={!!selectedMemberId}
        onOpenChange={(open) => {
          if (!open) setSelectedMemberId(null);
        }}
      />
    </div>
  );
}
