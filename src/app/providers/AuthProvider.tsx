import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { User } from '@/shared/types/models';
import { supabase } from '@/shared/lib/supabase';

// ============================================
// AUTH — Supabase Google OAuth (PKCE-safe)
// Turbo: Cache-first instant loading
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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // ── TURBO: Cache-first loading ──
  // If we have a cached user, resolve loading IMMEDIATELY so the app renders
  // with cached data. Session validation happens in background (non-blocking).
  // Only start with isLoading=true if there's NO cached user (cold start / first login).
  const hasCachedUser = (() => {
    try { return !!localStorage.getItem(AUTH_STORAGE_KEY); } catch { return false; }
  })();

  const [isLoading, setIsLoading] = useState(!hasCachedUser);
  const [accessDenied, setAccessDenied] = useState(false);
  const [deniedEmail, setDeniedEmail] = useState<string | null>(null);
  const loadingResolved = useRef(!hasCachedUser ? false : true);

  const resolveLoading = useCallback(() => {
    if (!loadingResolved.current) {
      loadingResolved.current = true;
      setIsLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async (authUser: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
    // Build a fallback from JWT metadata — always available, no DB needed
    const fallback = authUserToProfile(authUser);

    // Extract Google avatar from OAuth metadata (always fresh)
    const meta = authUser.user_metadata ?? {};
    const googleAvatar = meta['avatar_url'] ?? meta['picture'] ?? undefined;

    // Check if this user has a profile in the database (whitelist check)
    try {
      let { data: existing, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      // If not found by Auth ID, try to find by Email (usually happens when an admin pre-registers the user)
      if (!existing && !error && authUser.email) {
        const { data: existingByEmail, error: emailError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', authUser.email)
          .maybeSingle();
        
        if (existingByEmail) {
          existing = existingByEmail;
          // Optionally: We could try to sync the IDs here, but keeping the email mapping is safer
          // since the random UUID might already be used as an owner_id in projects/tasks.
        } else if (emailError) {
          error = emailError;
        }
      }

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
        // Always sync Google avatar on login so the photo stays current
        const storedAvatar: string | undefined = existing.avatar_url ?? undefined;
        const needsAvatarSync = googleAvatar && googleAvatar !== storedAvatar;

        if (needsAvatarSync) {
          // Fire-and-forget: update the avatar in the DB
          supabase
            .from('profiles')
            .update({ avatar_url: googleAvatar, updated_at: new Date().toISOString() })
            .eq('id', authUser.id)
            .then(({ error: updateErr }) => {
              if (updateErr) console.warn('[Auth] Failed to sync Google avatar:', updateErr.message);
              else console.log('[Auth] Google avatar synced successfully');
            });
        }

        const profile: User = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role ?? 'collaborator',
          initials: existing.initials,
          // Use Google avatar (freshest) if available, else DB value
          avatarUrl: googleAvatar ?? storedAvatar,
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

    // Safety net: if nothing resolves in 2s (was 5s), force loading=false
    const safetyTimeout = setTimeout(() => {
      if (mounted) resolveLoading();
    }, 2000);

    // ── Custom OAuth: handle Google ID token from /api/auth/callback ──
    // When user returns from our custom Google OAuth flow (via Vercel serverless),
    // the URL contains a google_id_token that we exchange for a Supabase session.
    const searchParams = new URLSearchParams(window.location.search);
    const googleIdToken = searchParams.get('google_id_token');
    const authError = searchParams.get('auth_error');

    if (googleIdToken) {
      // Clean URL immediately (remove token from browser bar and history)
      window.history.replaceState({}, '', window.location.pathname);

      // Exchange Google ID token for a Supabase session
      supabase.auth.signInWithIdToken({
        provider: 'google',
        token: googleIdToken,
      }).then(async ({ data, error }) => {
        if (!mounted) return;
        if (!error && data.session?.user) {
          await loadProfile(data.session.user as Parameters<typeof loadProfile>[0]);
        } else {
          console.error('[Auth] signInWithIdToken failed:', error?.message);
        }
        resolveLoading();
      }).catch((err) => {
        console.error('[Auth] signInWithIdToken error:', err);
        if (mounted) resolveLoading();
      });

      // Subscribe to future auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (!mounted) return;
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
            await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
          } else if (event === 'SIGNED_OUT') {
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
          resolveLoading();
        }
      );

      return () => {
        mounted = false;
        clearTimeout(safetyTimeout);
        subscription.unsubscribe();
      };
    }

    if (authError) {
      // Clean error from URL
      window.history.replaceState({}, '', window.location.pathname);
      console.error('[Auth] OAuth error:', authError);
    }

    // ── TURBO: Cached user fast-path ──
    // If we have a cached user, isLoading is already false (resolved in useState).
    // We still validate the session in background but the UI renders immediately.
    const cachedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (cachedUser) {
      // Background validation — non-blocking, UI already rendered
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!mounted) return;
        const isExpired = session?.expires_at ? (session.expires_at * 1000) <= Date.now() : false;

        if (session?.user && !isExpired) {
          // Silent profile refresh in background
          loadProfile(session.user as Parameters<typeof loadProfile>[0]);
        } else if (session?.user && isExpired) {
          // Token expired — try to refresh
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (!mounted) return;
            if (user) {
              loadProfile(user as Parameters<typeof loadProfile>[0]);
            } else {
              // Session truly dead — clear and redirect
              setUser(null);
              localStorage.removeItem(AUTH_STORAGE_KEY);
              resolveLoading(); // Force loading state for redirect
            }
          });
          return;
        } else {
          // No session — clear cache, force re-login
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
        resolveLoading();
      }).catch(() => {
        if (mounted) resolveLoading();
      });

      // Subscribe for future auth changes (logout, token refresh)
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
    // Redirect to our own Vercel serverless function instead of Supabase's OAuth.
    // This makes Google's consent screen show our Vercel domain
    // instead of the ugly Supabase hash URL.
    window.location.href = '/api/auth/google';
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
