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

/** Build a minimal User from Supabase auth metadata as fallback. */
function authUserToFallback(authUser: { id: string; email?: string; user_metadata?: Record<string, string> }): User {
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

  /**
   * Try to load the full profile row. If missing or blocked by RLS,
   * fall back to the auth token metadata so the user is NEVER kicked out
   * just because the profiles table isn't reachable.
   */
  const loadProfile = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error || !data) {
        console.warn('Profile row unavailable, using auth metadata fallback:', error?.message);
        const fallback = authUserToFallback(authUser);
        setUser(fallback);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback));
        return;
      }

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
    } catch (err) {
      console.error('Profile load error:', err);
      // On any unexpected error keep the user authenticated via fallback
      const fallback = authUserToFallback(authUser);
      setUser(fallback);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback));
    }
  }, []);

  // Initialize: check for existing Supabase session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
        } else {
          // No active session — restore cached user for instant first paint
          try {
            const stored = localStorage.getItem(AUTH_STORAGE_KEY);
            if (stored) setUser(JSON.parse(stored));
          } catch {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setIsLoading(false);
        }
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
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
