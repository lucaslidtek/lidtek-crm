import { useAuth } from '@/app/providers/AuthProvider';
import { useLocation } from 'wouter';
import { type ReactNode, useEffect } from 'react';

/**
 * Check if the current URL contains an OAuth PKCE callback code.
 * During PKCE flow, Supabase redirects back with ?code=... in the query string.
 * We must NOT redirect to /login while this code is being exchanged.
 */
function isOAuthCallback(): boolean {
  // PKCE flow: query contains code
  if (new URLSearchParams(window.location.search).has('code')) return true;
  // Implicit flow (legacy): hash contains access_token
  if (window.location.hash.includes('access_token=')) return true;
  return false;
}

export function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, accessDenied, deniedEmail } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If user authenticated but isn't in the whitelist, redirect to access-denied page
    if (accessDenied) {
      setLocation('/access-denied');
      return;
    }
    // NEVER redirect to /login while:
    // 1. Auth is still loading (INITIAL_SESSION hasn't fired yet)
    // 2. An OAuth callback is being processed (?code= in URL)
    if (!isLoading && !isAuthenticated && !isOAuthCallback()) {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, accessDenied, deniedEmail, setLocation]);

  if (accessDenied) {
    return null;
  }

  // Show spinner while:
  // - Auth state is being determined (isLoading)
  // - OAuth callback is in progress (?code= in URL being exchanged)
  if (isLoading || isOAuthCallback()) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-primary mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="text-foreground-muted text-sm">Verificando sessão...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Return null while the useEffect redirects
    return null;
  }

  return <>{children}</>;
}
