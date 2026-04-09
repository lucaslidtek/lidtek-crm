import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@/shared/types/models';
import { supabase } from '@/shared/lib/supabase';

// ============================================
// AUTH — Supabase Google OAuth
// ============================================

const AUTH_STORAGE_KEY = 'lidtek-crm-auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

/** Build a User from Supabase auth token metadata (no DB query needed). */
function authUserToProfile(authUser: { id: string; email?: string; user_metadata?: Record<string, string> }): User {
  const meta = authUser.user_metadata ?? {};
  const fullName = meta['full_name'] ?? meta['name'] ?? authUser.email ?? 'Usuário';
  const parts = fullName.trim().split(' ');
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : fullName.slice(0, 2).toUpperCase();
  return {
    id: authUser.id,
    name: fullName,
    email: authUser.email ?? '',
    role: 'admin',
    initials,
    avatarUrl: meta['avatar_url'] ?? meta['picture'] ?? undefined,
    status: 'active',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
    // Always build from auth metadata first (instant, no network needed)
    const fallback = authUserToProfile(authUser);
    setUser(fallback);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback));

    // Then try to enrich with full profile row (optional)
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (data) {
        const profile: User = {
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          initials: data.initials,
          avatarUrl: data.avatar_url ?? undefined,
          phone: data.phone ?? undefined,
          position: data.position ?? undefined,
          status: data.status ?? 'active',
        };
        setUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      }
    } catch {
      // Silently ignore — fallback from auth metadata is already set
    }
  }, []);

  useEffect(() => {
    // Use ONLY onAuthStateChange — it fires INITIAL_SESSION on mount
    // with the current session, so there is no need for a separate getSession() call.
    // This eliminates the race condition between two concurrent auth paths.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
        } else {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
        // Always mark loading done after the FIRST event (INITIAL_SESSION)
        setIsLoading(false);
      }
    );

    return () => { subscription.unsubscribe(); };
  }, [loadProfile]);

  const login = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
