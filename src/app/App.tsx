import { SidebarProvider } from '@/shared/components/layout/Sidebar';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { StoreProvider } from '@/shared/lib/store';
import { PWAInstallPrompt } from '@/shared/components/PWAInstallPrompt';
import { AppErrorBoundary } from './AppErrorBoundary';
import { Router } from './Router';

export function App() {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <StoreProvider>
            <SidebarProvider>
              <Router />
            </SidebarProvider>
          </StoreProvider>
        </AuthProvider>
        <PWAInstallPrompt />
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
