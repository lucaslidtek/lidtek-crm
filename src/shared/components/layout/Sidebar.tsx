import { useState, createContext, useContext, type ReactNode } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ListTodo,
  UsersRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';

// --- Sidebar Context ---
interface SidebarContextType {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggle: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed(c => !c) }}>
      {children}
    </SidebarContext.Provider>
  );
}

// --- Navigation Items ---
const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/crm', label: 'CRM', icon: Users },
  { path: '/projects', label: 'Projetos', icon: FolderKanban },
  { path: '/tasks', label: 'Tarefas', icon: ListTodo },
  { path: '/team', label: 'Equipe', icon: UsersRound },
] as const;

// --- Sidebar Component ---
export function Sidebar() {
  const { collapsed, toggle } = useSidebar();
  const [location, setLocation] = useLocation();

  return (
    <motion.aside
      className={cn(
        'fixed left-0 top-0 h-screen z-50',
        'glass flex flex-col',
        'transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]'
      )}
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-border-subtle">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/branding/icon.svg"
            alt="Lidtek"
            className="flex-shrink-0 w-8 h-8 dark:invert"
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-foreground whitespace-nowrap"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                Lidtek
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.path === '/'
            ? location === '/'
            : location.startsWith(item.path);
          const Icon = item.icon;

          return (
            <button
              key={item.path}
              onClick={() => setLocation(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                'transition-all duration-300 ease-out group relative',
                'text-sm font-medium',
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5'
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full"
                  layoutId="activeNav"
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                />
              )}

              <Icon
                className={cn(
                  'flex-shrink-0 w-5 h-5 transition-colors duration-300',
                  isActive ? 'text-primary' : 'text-foreground-muted group-hover:text-foreground'
                )}
              />

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    className="whitespace-nowrap"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-border-subtle">
        <button
          onClick={toggle}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg',
            'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            'transition-all duration-300 text-sm'
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="whitespace-nowrap"
              >
                Recolher
              </motion.span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
