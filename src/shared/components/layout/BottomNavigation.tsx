import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListTodo,
  UsersRound,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { usePermissions } from '@/shared/hooks/usePermissions';

interface NavItem {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
  requiresAdmin?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Dash', icon: LayoutDashboard },
  { path: '/crm', label: 'CRM', icon: Users },
  { path: '/projects', label: 'Projetos', icon: FolderKanban },
  { path: '/tasks', label: 'Tarefas', icon: ListTodo },
  { path: '/team', label: 'Equipe', icon: UsersRound, requiresAdmin: true },
];

export function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { canEditAll } = usePermissions();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiresAdmin || canEditAll
  );

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'glass border-t border-border-subtle md:hidden',
        'bottom-nav-padding',
        'flex items-center gap-1 px-2 py-2',
      )}
    >
      {visibleItems.map((item) => {
        const isActive =
          item.path === '/'
            ? location === '/'
            : location.startsWith(item.path);
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-1',
              'h-12 rounded-2xl',
              'press-scale cursor-pointer',
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute inset-0 rounded-2xl bg-primary/[0.12]"
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              />
            )}

            <Icon
              className={cn(
                'w-[18px] h-[18px] transition-colors duration-300 z-10',
                isActive
                  ? 'text-primary'
                  : 'text-foreground-muted'
              )}
            />
            <span
              className={cn(
                'text-[9px] font-medium tracking-wide z-10 transition-colors duration-300',
                isActive
                  ? 'text-primary font-bold'
                  : 'text-foreground-muted'
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
