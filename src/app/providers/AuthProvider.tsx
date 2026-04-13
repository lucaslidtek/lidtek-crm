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
  accessDenied: boolean;
  deniedEmail: string | null;
  login: () => void;
  loginWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  accessDenied: false,
  deniedEmail: null,
  login: () => {},
  loginWithPassword: async () => ({ error: null }),
  logout: async () => {},
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
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);
  const loadingResolved = useRef(false);

  const resolveLoading = useCallback(() => {
    if (!loadingResolved.current) {
      loadingResolved.current = true;
      setIsLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
    // Build a fallback from JWT metadata — always available, no DB needed
    const fallback = authUserToProfile(authUser);

    // Check if this user has a profile in the database (whitelist check)
    try {
      const { data: existing, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error) {
        // RLS or DB error — DON'T block access, use JWT fallback.
        // This can happen if: is_member() function doesn't exist, policy
        // conflict, network error, etc. Blocking here would lock everyone out.
        console.error('[Auth] Profile query error (using fallback):', error.message);
        setUser(fallback);
        setAccessDenied(false);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback));
        return;
      }

      if (existing) {
        // Profile exists — user is authorized
        const profile: User = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role ?? 'collaborator',
          initials: existing.initials,
          avatarUrl: existing.avatar_url ?? undefined,
          phone: existing.phone ?? undefined,
          position: existing.position ?? undefined,
          status: existing.status ?? 'active',
        };
        setUser(profile);
        setAccessDenied(false);
        setDeniedEmail(null);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
      } else {
        // data is null AND no error → profile genuinely doesn't exist.
        // ── WHITELIST BLOCK ──
        console.warn(`[Auth] Access denied for ${authUser.email} — no profile in database.`);
        setUser(null);
        setAccessDenied(true);
        setDeniedEmail(authUser.email ?? null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        await supabase.auth.signOut();
      }
    } catch (err) {
      // Network/unexpected error — use JWT metadata as temporary fallback
      console.error('[Auth] Profile check failed (using fallback):', err);
      setUser(fallback);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback));
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
    // localStorage cache still has a valid user. We set the user immediately
    // so the UI doesn't flash to the login screen, BUT we still call
    // getSession() and only resolve isLoading AFTER it completes. This
    // ensures the Supabase JWT is in memory before the Store fires queries.
    const cachedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (cachedUser) {
      // User is cached — set for UI, but DON'T resolveLoading() yet.
      // The Store checks isLoading and won't fire queries until it's false.

      // Call getSession() to ensure the JWT is loaded into the Supabase client
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        // Check if the token is already expired
        const isExpired = session?.expires_at ? (session.expires_at * 1000) <= Date.now() : false;

        if (session?.user && !isExpired) {
          loadProfile(session.user as Parameters<typeof loadProfile>[0]);
        } else if (session?.user && isExpired) {
          // Token is expired. getSession returns it while refreshing in the background.
          // Wait for a real network check to confirm if the refresh succeeded or not.
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (!mounted) return;
            if (user) {
              loadProfile(user as Parameters<typeof loadProfile>[0]);
            } else {
              setUser(null);
              localStorage.removeItem(AUTH_STORAGE_KEY);
            }
            resolveLoading();
          });
          return; // resolveLoading will be called by getUser
        } else {
          // Session expired — clear cache and force re-login
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
        // NOW resolve loading — JWT is ready (or user is cleared)
        resolveLoading();
      }).catch(() => {
        if (mounted) resolveLoading();
      });

      // Still subscribe for future auth changes (logout, token refresh)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
            await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
          } else if (event === 'SIGNED_OUT' || (event as string) === 'TOKEN_REFRESH_FAILED') {
            // Guard: only clear if truly signed out or refresh permanently failed.
            // Wait briefly to see if TOKEN_REFRESHED follows or check with server.
            setTimeout(() => {
              if (!mounted) return;
              // Use getUser() here instead of getSession() because getSession may return a dead cached token.
              supabase.auth.getUser().then(({ data: { user } }) => {
                if (!user) {
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

    // R2 defensive: try PKCE code exchange first if present in URL
    const urlCode = new URLSearchParams(window.location.search).get('code');
    if (urlCode) {
      supabase.auth.exchangeCodeForSession(urlCode).then(async ({ data, error }) => {
        if (!mounted) return;
        if (!error && data.session?.user) {
          await loadProfile(data.session.user as Parameters<typeof loadProfile>[0]);
          resolveLoading();
          // Clean the URL after successful exchange
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          // PKCE exchange failed — fallback to getSession
          fallbackGetSession();
        }
      }).catch(() => {
        // PKCE exchange error — fallback to getSession
        if (mounted) fallbackGetSession();
      });
    } else {
      fallbackGetSession();
    }

    function fallbackGetSession() {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!mounted) return;
        const isExpired = session?.expires_at ? (session.expires_at * 1000) <= Date.now() : false;

        if (session?.user && !isExpired) {
          await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
        } else if (session?.user && isExpired) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await loadProfile(user as Parameters<typeof loadProfile>[0]);
          } else {
            setUser(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        } else {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
        resolveLoading();
      }).catch(() => {
        if (mounted) resolveLoading();
      });
    }

    // ---- Step 2: onAuthStateChange ----
    // Handles SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED after the initial load.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
        } else if (event === 'SIGNED_OUT' || (event as string) === 'TOKEN_REFRESH_FAILED') {
          // Guard: wait briefly before clearing to distinguish a real logout
          // from a transient SIGNED_OUT that occurs during token refresh.
          setTimeout(() => {
            if (!mounted) return;
            supabase.auth.getUser().then(({ data: { user } }) => {
              if (!user) {
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

    // ── Visibility change: re-validate session when user returns to tab ──
    // When the browser tab is in background, timers are frozen and
    // autoRefreshToken can't run. The JWT may expire silently.
    // On return, we force a network check with getUser() to either
    // refresh the token or detect that the session died.
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible' || !mounted) return;
      // Only re-validate if we think we're authenticated
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!cached) return;

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!mounted) return;
        if (user) {
          // Session is still alive — reload profile in case token was refreshed
          loadProfile(user as Parameters<typeof loadProfile>[0]);
        } else {
          // Session died while tab was hidden — clean up
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadProfile, resolveLoading]);


  const login = useCallback(() => {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const logout = useCallback(async () => {
    // Clear state and cache IMMEDIATELY — don't wait for the 300ms guard
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Then sign out from Supabase
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, accessDenied, deniedEmail, login, loginWithPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
