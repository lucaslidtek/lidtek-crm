import { Search, Bell, LogOut, User, Sun, Moon, ChevronLeft } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useLocation } from 'wouter';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/shared/components/ui/DropdownMenu';
import { useMemo } from 'react';

export function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  // Mapeamento dinâmico do título no celular
  const pageDetails = useMemo(() => {
    if (location === '/') return { title: 'Dashboard', back: false };
    if (location.startsWith('/crm')) return { title: 'CRM', back: false };
    if (location.startsWith('/projects')) return { title: 'Projetos', back: false };
    if (location.startsWith('/tasks')) return { title: 'Tarefas', back: false };
    if (location.startsWith('/team')) return { title: 'Equipe', back: false };
    return { title: 'Detalhes', back: true };
  }, [location]);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border-subtle h-14 md:h-16 flex items-center justify-between px-4 md:px-6 pt-[max(env(safe-area-inset-top),0px)]">
      
      {/* ─── DESKTOP LEFT (Search) ─── */}
      <div className="relative hidden md:flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-foreground-muted" />
        <input
          type="text"
          placeholder="Buscar..."
          className={cn(
            'w-64 pl-9 pr-4 py-2 rounded-lg text-sm',
            'bg-black/5 dark:bg-white/5 border border-border',
            'text-foreground placeholder:text-foreground-muted/50',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30',
            'transition-all duration-300'
          )}
        />
      </div>

      {/* ─── MOBILE LEFT (Voltar ou Logo) ─── */}
      <div className="flex md:hidden items-center gap-2">
        {pageDetails.back ? (
          <button onClick={() => window.history.back()} className="p-2 -ml-2 text-foreground-muted hover:text-foreground active:bg-black/5 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <img
            src="/branding/icon.svg"
            alt="Lidtek"
            className="w-7 h-7 dark:invert"
          />
        )}
      </div>

      {/* ─── MOBILE CENTER (Title) ─── */}
      <div className="flex md:hidden absolute left-1/2 -translate-x-1/2 items-center pointer-events-none">
        <span className="font-[family-name:var(--font-display)] font-semibold text-[15px] tracking-tight">
          {pageDetails.title}
        </span>
      </div>

      {/* ─── RIGHT ACTIONS (Desktop & Mobile) ─── */}
      <div className="flex items-center gap-1.5 md:gap-3">
        {/* Theme Toggle (Menor no mobile) */}
        <button
          onClick={toggleTheme}
          className={cn(
            'w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center',
            'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            'transition-all duration-300'
          )}
          title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4 md:w-4.5 md:h-4.5" /> : <Sun className="w-4 h-4 md:w-4.5 md:h-4.5" />}
        </button>

        {/* Notifications */}
        <button
          className={cn(
            'relative w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center',
            'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            'transition-all duration-300 hidden sm:flex'
          )}
        >
          <Bell className="w-4 h-4 md:w-4.5 md:h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-destructive" />
        </button>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 pl-2 md:pl-3 pr-1 py-1 rounded-lg outline-none',
                'hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300'
              )}
            >
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {user?.name?.split(' ')[0] ?? 'Usuário'}
              </span>
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
                <span className="text-[10px] md:text-xs font-bold text-primary">
                  {user?.initials ?? '?'}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {user?.name ?? 'Usuário'}
            </DropdownMenuLabel>
            <div className="px-3 pb-2">
              <p className="text-xs text-foreground-muted">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="w-4 h-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={logout}>
              <LogOut className="w-4 h-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

