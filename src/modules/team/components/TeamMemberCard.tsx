import { motion } from 'framer-motion';
import { Mail, Phone, Briefcase } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import type { User, UserRole } from '@/shared/types/models';

interface TeamMemberCardProps {
  member: User;
  onClick?: () => void;
}

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: 'text-primary', bg: 'bg-primary/15' },
  manager: { label: 'Gestor', color: 'text-blue-light', bg: 'bg-blue-light/15' },
  gestor: { label: 'Gestor', color: 'text-blue-light', bg: 'bg-blue-light/15' },
  collaborator: { label: 'Colaborador', color: 'text-success', bg: 'bg-success/15' },
  readonly: { label: 'Leitura', color: 'text-muted-foreground', bg: 'bg-muted/50' },
  leitura: { label: 'Leitura', color: 'text-muted-foreground', bg: 'bg-muted/50' },
};

export function TeamMemberCard({ member, onClick }: TeamMemberCardProps) {
  const roleConfig = ROLE_CONFIG[member.role];

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full text-left p-5 rounded-2xl cursor-pointer',
        'bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10',
        'hover:bg-zinc-50 dark:hover:bg-white/8',
        'hover:shadow-lg dark:hover:shadow-none',
        'transition-all duration-300 ease-out',
        'group relative overflow-hidden'
      )}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.3 }}
    >
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-[60px]" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        {/* Avatar */}
        <div className="relative mb-4">
          <UserAvatar
            name={member.name}
            initials={member.initials}
            avatarUrl={member.avatarUrl}
            size="lg"
            className="w-16 h-16 rounded-2xl"
          />
          {/* Online indicator */}
          {member.status === 'active' && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success border-2 border-white dark:border-zinc-900" />
          )}
        </div>

        {/* Name */}
        <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight text-foreground mb-0.5 line-clamp-1">
          {member.name}
        </h3>

        {/* Position */}
        {member.position && (
          <p className="text-xs text-foreground-muted mb-3 line-clamp-1 flex items-center gap-1">
            <Briefcase className="w-3 h-3 flex-shrink-0" />
            {member.position}
          </p>
        )}
        {!member.position && <div className="mb-3" />}

        {/* Role Badge */}
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-0.5',
            'text-[10px] font-semibold uppercase tracking-wider rounded-full',
            roleConfig.bg,
            roleConfig.color,
            'mb-4'
          )}
        >
          {roleConfig.label}
        </span>

        {/* Contact Info */}
        <div className="w-full space-y-1.5 pt-3 border-t border-zinc-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-xs text-foreground-muted truncate">
            <Mail className="w-3.5 h-3.5 flex-shrink-0 text-foreground-muted/60" />
            <span className="truncate">{member.email}</span>
          </div>
          {member.phone && (
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <Phone className="w-3.5 h-3.5 flex-shrink-0 text-foreground-muted/60" />
              <span>{member.phone}</span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}
