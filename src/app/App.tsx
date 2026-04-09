import { SidebarProvider } from '@/shared/components/layout/Sidebar';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ThemeProvider } from '@/app/providers/ThemeProvider';
import { StoreProvider } from '@/shared/lib/store';
import { Router } from './Router';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <SidebarProvider>
            <Router />
          </SidebarProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
