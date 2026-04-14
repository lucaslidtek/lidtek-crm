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

  // Filter items by permission — Team only visible for admin/manager
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.requiresAdmin || canEditAll
  );

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'glass flex items-center justify-around',
        'bottom-nav-padding',
        'border-t border-border-subtle md:hidden'
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
              'relative flex flex-1 flex-col items-center justify-center gap-0.5',
              'min-h-[48px] py-1',
              'press-scale',
            )}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {/* Active background — fills entire tab area */}
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute inset-0 bg-primary/10"
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              />
            )}
            
            <Icon
              className={cn(
                'w-5 h-5 transition-colors duration-300 z-10',
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

