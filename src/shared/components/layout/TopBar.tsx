import { Bell, LogOut, User, Sun, Moon, ChevronLeft, CalendarDays } from 'lucide-react';
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

  const pageDetails = useMemo(() => {
    if (location === '/') return { title: null, back: false };
    if (location.startsWith('/crm')) return { title: 'Funil de Vendas', back: false };
    if (location.startsWith('/projects')) return { title: 'Projetos', back: false };
    if (location.startsWith('/tasks')) return { title: 'Tarefas', back: false };
    if (location.startsWith('/team')) return { title: 'Equipe', back: false };
    return { title: 'Detalhes', back: true };
  }, [location]);

  const isDashboard = !pageDetails.title;

  // Date context shown on dashboard
  const dateContext = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const date = now.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
    return { greeting, date: date.replace('.', '') };
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border-subtle h-14 md:h-16 flex items-center justify-between px-4 md:px-6 pt-[max(env(safe-area-inset-top),0px)]">

      {/* ─── DESKTOP LEFT ─── */}
      <div className="hidden md:flex items-center">
        {isDashboard ? (
          // Dashboard: show date context — sidebar handles brand, page handles greeting
          <div className="flex items-center gap-2 text-foreground-muted">
            <CalendarDays className="w-3.5 h-3.5 opacity-60" />
            <span className="text-sm">
              <span className="font-medium text-foreground">{dateContext.greeting}</span>
              <span className="mx-1.5 opacity-40">·</span>
              <span className="capitalize">{dateContext.date}</span>
            </span>
          </div>
        ) : (
          <span className="font-[family-name:var(--font-display)] font-bold text-lg tracking-tight text-foreground">
            {pageDetails.title}
          </span>
        )}
      </div>

      {/* ─── MOBILE LEFT — Back or Logo ─── */}
      <div className="flex md:hidden items-center gap-2">
        {pageDetails.back ? (
          <button
            onClick={() => window.history.back()}
            className="p-2 -ml-2 text-foreground-muted hover:text-foreground active:bg-black/5 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <img src="/branding/icon.svg" alt="Lidtek" className="w-7 h-7 dark:invert" />
        )}
      </div>

      {/* ─── MOBILE CENTER — Title (hidden on dashboard since page has greeting) ─── */}
      <div className="flex md:hidden absolute left-1/2 -translate-x-1/2 pointer-events-none">
        {!isDashboard && (
          <span className="font-[family-name:var(--font-display)] font-semibold text-[15px] tracking-tight">
            {pageDetails.title}
          </span>
        )}
      </div>

      {/* ─── RIGHT ACTIONS ─── */}
      <div className="flex items-center gap-0.5 md:gap-1">

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center',
            'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            'transition-all duration-200'
          )}
          title={theme === 'light' ? 'Tema escuro' : 'Tema claro'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <button
          className={cn(
            'relative w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center',
            'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            'transition-all duration-200'
          )}
          title="Notificações"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-destructive" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1 hidden md:block" />

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2 pl-1.5 pr-1 py-1 rounded-lg outline-none',
                'hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200'
              )}
            >
              <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
                <span className="text-[10px] md:text-xs font-bold text-primary">
                  {user?.initials ?? '?'}
                </span>
              </div>
              <span className="text-sm font-medium text-foreground hidden md:block">
                {user?.name?.split(' ')[0] ?? 'Usuário'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user?.name ?? 'Usuário'}</DropdownMenuLabel>
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
