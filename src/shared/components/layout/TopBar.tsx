import { Search, Bell, LogOut, User, Sun, Moon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useAuth } from '@/app/providers/AuthProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/shared/components/ui/DropdownMenu';

export function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border-subtle">
      {/* Search — Left Side */}
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

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center',
            'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            'transition-all duration-300'
          )}
          title={theme === 'light' ? 'Mudar para tema escuro' : 'Mudar para tema claro'}
        >
          {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
        </button>

        {/* Notifications */}
        <button
          className={cn(
            'relative w-9 h-9 rounded-xl flex items-center justify-center',
            'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
            'transition-all duration-300'
          )}
        >
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-destructive" />
        </button>

        {/* User Avatar Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex items-center gap-2.5 pl-3 pr-1 py-1 rounded-lg',
                'hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300'
              )}
            >
              <span className="text-sm font-medium text-foreground hidden sm:block">
                {user?.name?.split(' ')[0] ?? 'Usuário'}
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
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
            <DropdownMenuItem onSelect={toggleTheme}>
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {theme === 'light' ? 'Tema Escuro' : 'Tema Claro'}
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

