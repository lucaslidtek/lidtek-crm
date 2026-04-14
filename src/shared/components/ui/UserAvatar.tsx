import { cn } from '@/shared/utils/cn';

interface UserAvatarProps {
  name: string;
  initials: string;
  avatarUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  xs: 'w-5 h-5 text-[7px]',
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-14 h-14 text-xl',
} as const;

const GRADIENTS = [
  'from-primary/80 to-blue-light/80',
  'from-blue-light/80 to-primary/80',
  'from-primary/70 to-success/60',
  'from-success/70 to-blue-light/70',
  'from-warning/70 to-primary/60',
  'from-primary/60 to-primary-light/80',
];

function getGradient(initials: string): string {
  const idx = (initials.charCodeAt(0) + (initials.charCodeAt(1) || 0)) % GRADIENTS.length;
  return GRADIENTS[idx]!;
}

/**
 * Unified avatar component used across the entire app.
 * Shows Google photo when available, falls back to gradient initials.
 * Always uses referrerPolicy="no-referrer" for Google-hosted images.
 */
export function UserAvatar({ name, initials, avatarUrl, size = 'sm', className }: UserAvatarProps) {
  const sizeClass = SIZE_MAP[size];
  const isLarge = size === 'lg';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className={cn(
          sizeClass,
          isLarge ? 'rounded-xl ring-2 ring-white/20' : 'rounded-full',
          'object-cover flex-shrink-0',
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        sizeClass,
        isLarge ? 'rounded-xl shadow-md' : 'rounded-full',
        'flex items-center justify-center flex-shrink-0',
        'bg-gradient-to-br',
        getGradient(initials),
        className,
      )}
    >
      <span className={cn('font-bold text-white', isLarge && 'drop-shadow-sm')}>
        {initials}
      </span>
    </div>
  );
}
