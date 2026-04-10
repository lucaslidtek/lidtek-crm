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
    ? ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
    : fullName.slice(0, 2).toUpperCase();
  return {
    id: authUser.id,
    name: fullName,
    email: authUser.email ?? '',
    // Use 'collaborator' as the safe fallback — the real role is loaded
    // from the profiles table in loadProfile() and overwrites this value.
    role: 'collaborator',
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
  // Initialize user from localStorage for instant HMR UX — no flash-to-login.
  // BUT isLoading ALWAYS starts true: the Store must wait for getSession()
  // to complete before querying, so the Supabase JWT is in memory and ready.
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  // Always true on mount — resolved only after getSession() finishes.
  // This guarantees the Supabase auth token is in memory before the Store
  // fires any queries (prevents empty results from premature API calls).
  const [isLoading, setIsLoading] = useState(true);
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

    // Enrich from the profiles table — this resolves the real role and profile data
    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (existing) {
        // Profile exists — use the real data from the database
        const profile: User = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          // Use the real role from the database — overwrites the 'collaborator' fallback
          role: existing.role ?? 'collaborator',
          initials: existing.initials,
          avatarUrl: existing.avatar_url ?? undefined,
          phone: existing.phone ?? undefined,
          position: existing.position ?? undefined,
          status: existing.status ?? 'active',
        };
        setUser(profile);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      } else {
        // Profile missing (trigger didn't run) — create it now.
        // Use 'admin' as the role for the first user to bootstrap the system.
        const { data: created } = await supabase
          .from('profiles')
          .insert({
            id: fallback.id,
            name: fallback.name,
            email: fallback.email,
            role: 'admin', // Bootstrap: first user who can auth is admin
            initials: fallback.initials,
            avatar_url: fallback.avatarUrl ?? null,
            status: 'active',
          })
          .select()
          .single();

        if (created) {
          const profile: User = {
            id: created.id,
            name: created.name,
            email: created.email,
            role: created.role ?? 'admin',
            initials: created.initials,
            avatarUrl: created.avatar_url ?? undefined,
            status: created.status ?? 'active',
          };
          setUser(profile);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        }
      }
    } catch {
      // Ignore — fallback is already set
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety net: if nothing resolves in 5s, force loading=false
    const safetyTimeout = setTimeout(() => {
      if (mounted) resolveLoading();
    }, 5000);

    // ── HMR fast-path ──
    // On hot-reload, the component remounts with isLoading=true but the
    // localStorage cache still has a valid user. Skip getSession() entirely
    // to avoid lock contention and the ~200ms spinner on every code change.
    const cachedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (cachedUser) {
      // User is cached — resolve immediately so the Store doesn't wait.
      resolveLoading();

      // Run loadProfile in the background to ensure the DB profile exists
      // and to refresh the role/name from the database.
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (mounted && session?.user) {
          loadProfile(session.user as Parameters<typeof loadProfile>[0]);
        }
      }).catch(() => { /* ignore — cached user is already set */ });

      // Still subscribe for future auth changes (logout, token refresh)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
            await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
          } else if (event === 'SIGNED_OUT') {
            // Guard: only clear if truly signed out (not a transient refresh cycle).
            // Wait briefly to see if TOKEN_REFRESHED follows.
            setTimeout(() => {
              if (!mounted) return;
              supabase.auth.getSession().then(({ data: { session: current } }) => {
                if (!current) {
                  setUser(null);
                  localStorage.removeItem(AUTH_STORAGE_KEY);
                }
              });
            }, 300);
          }
          resolveLoading();
        }
      );
      return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        subscription.unsubscribe();
      };
    }

    // ── Cold start (first login or after logout) ──
    // No cache — must call getSession() to exchange PKCE code or restore session.
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
          // Guard: wait briefly before clearing to distinguish a real logout
          // from a transient SIGNED_OUT that occurs during token refresh.
          setTimeout(() => {
            if (!mounted) return;
            supabase.auth.getSession().then(({ data: { session: current } }) => {
              if (!current) {
                setUser(null);
                localStorage.removeItem(AUTH_STORAGE_KEY);
              }
            });
          }, 300);
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
