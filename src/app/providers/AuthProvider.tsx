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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Map Supabase auth user + profile to our User type
  const loadProfile = useCallback(async (authUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (error || !data) {
        console.error('Failed to load profile:', error);
        setUser(null);
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
      setUser(null);
    }
  }, []);

  // Initialize: check for existing session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          // Try to restore from localStorage for demo/seed users
          try {
            const stored = localStorage.getItem(AUTH_STORAGE_KEY);
            if (stored) {
              setUser(JSON.parse(stored));
            }
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

    // Listen for auth state changes (login/logout/token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const login = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
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
