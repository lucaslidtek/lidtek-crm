import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

const navItems = [
  { path: '/', label: 'Dash', icon: LayoutDashboard },
  { path: '/crm', label: 'CRM', icon: Users },
  { path: '/projects', label: 'Projetos', icon: FolderKanban },
  { path: '/tasks', label: 'Tarefas', icon: ListTodo },
];

export function BottomNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'glass flex items-center justify-around px-2',
        // Padding condicional para suportar "notch" do iOS no aparelho
        // pt-2 + pb-safe
        'pt-2 pb-[max(calc(env(safe-area-inset-bottom)+0.5rem),0.5rem)]',
        'border-t border-border-subtle md:hidden' // Esconde no desktop
      )}
    >
      {navItems.map((item) => {
        const isActive =
          item.path === '/'
            ? location === '/'
            : location.startsWith(item.path);
        const Icon = item.icon;

        return (
          <button
            key={item.path}
            onClick={() => setLocation(item.path)}
            className="relative flex flex-col items-center justify-center p-2 w-16 group"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {/* Active background glow/indicator */}
            {isActive && (
              <motion.div
                layoutId="bottomNavIndicator"
                className="absolute inset-0 bg-primary/10 rounded-xl"
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              />
            )}
            
            <Icon
              className={cn(
                'w-[22px] h-[22px] mb-1 transition-colors duration-300 z-10',
                isActive
                  ? 'text-primary'
                  : 'text-foreground-muted group-hover:text-foreground'
              )}
            />
            <span
              className={cn(
                'text-[10px] font-medium tracking-wide z-10 transition-colors duration-300',
                isActive
                  ? 'text-primary font-bold'
                  : 'text-foreground-muted group-hover:text-foreground'
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
