import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { User } from '@/shared/types/models';
import { supabase } from '@/shared/lib/supabase';

// ============================================
// AUTH — Supabase Google OAuth (PKCE-safe)
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

/** Build a User instantly from the JWT metadata — no DB query needed. */
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

// One-time migration: clear session that may have been corrupted by dev auto-login hack.
// This runs once, forces a clean re-login with Google, then never runs again.
const AUTH_MIGRATION_KEY = 'lidtek-crm-auth-v2';
if (!localStorage.getItem(AUTH_MIGRATION_KEY)) {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  // Clear Supabase's own session storage
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
      localStorage.removeItem(key);
    }
  }
  localStorage.setItem(AUTH_MIGRATION_KEY, '1');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage for instant HMR recovery — prevents
  // the flash-to-login that happens when Vite hot-reloads a module.
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(() => !localStorage.getItem(AUTH_STORAGE_KEY));
  // Guard so we only call setIsLoading(false) once — prevents race between
  // getSession() and the INITIAL_SESSION event from onAuthStateChange.
  const loadingResolved = useRef(false);

  const resolveLoading = useCallback(() => {
    if (!loadingResolved.current) {
      loadingResolved.current = true;
      setIsLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
    // Set user immediately from JWT metadata (no network round-trip)
    const fallback = authUserToProfile(authUser);
    setUser(fallback);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback));

    // Optionally enrich from the profiles table row
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
      // Ignore — fallback is already set
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety net: if nothing resolves in 5s, force loading=false
    // so the user sees the login page instead of an infinite spinner
    const safetyTimeout = setTimeout(() => {
      if (mounted) resolveLoading();
    }, 5000);

    // ---- Step 1: getSession() ----
    // In PKCE flow (production), this call exchanges the ?code= param from
    // the URL for a real session token. MUST be called before relying on
    // onAuthStateChange for the initial state.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
      } else {
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      resolveLoading();
    }).catch(() => {
      if (mounted) resolveLoading();
    });

    // ---- Step 2: onAuthStateChange ----
    // Handles SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED after the initial load.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
        // Always ensure loading is resolved (safety net for edge cases)
        resolveLoading();
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [loadProfile, resolveLoading]);


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
