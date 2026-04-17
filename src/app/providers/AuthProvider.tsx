import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import type { User } from '@/shared/types/models';
import { supabase } from '@/shared/lib/supabase';

// ============================================
// AUTH — Supabase Google OAuth (PKCE)
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

  /**
   * Loads or refreshes the user profile from the database.
   * Returns true if user was authorized, false if denied/not found.
   * IMPORTANT: Always calls resolveLoading() at the end to prevent race conditions.
   */
  const loadProfile = useCallback(async (
    authUser: { id: string; email?: string; user_metadata?: Record<string, string> }
  ): Promise<boolean> => {
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
        // Use ilike and trim to prevent trailing spaces or case differences from breaking the login
        const safeEmail = authUser.email.trim();
        const { data: existingByEmails, error: emailError } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', `%${safeEmail}%`)
          .limit(1);

        if (existingByEmails && existingByEmails.length > 0) {
          existing = existingByEmails[0];
        } else if (emailError) {
          error = emailError;
        }
      }

      if (error) {
        // RLS or DB error — DON'T block access, use JWT fallback.
        console.error('[Auth] Profile query error (using fallback):', error.message);
        setUser(fallback);
        setAccessDenied(false);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback));
        // resolveLoading is called by the caller
        return true;
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
        return true;
      } else {
        // data is null AND no error → profile genuinely doesn't exist.
        // ── WHITELIST BLOCK ──
        console.warn(`[Auth] Access denied for ${authUser.email} — no profile in database.`);
        setUser(null);
        setAccessDenied(true);
        setDeniedEmail(authUser.email ?? null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        await supabase.auth.signOut();
        return false;
      }
    } catch (err) {
      // Network/unexpected error — use JWT metadata as temporary fallback
      console.error('[Auth] Profile check failed (using fallback):', err);
      setUser(fallback);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(fallback));
      return true;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Safety net: if nothing resolves in 4s, force loading=false
    // (was 2s before, increased to give PKCE code exchange time)
    const safetyTimeout = setTimeout(() => {
      if (mounted) resolveLoading();
    }, 4000);

    // ── onAuthStateChange is the SINGLE source of truth ──
    // Supabase's detectSessionInUrl:true handles PKCE code exchange automatically.
    // We don't need to manually detect ?code= or #access_token= — Supabase fires
    // SIGNED_IN on the onAuthStateChange listener after it processes the URL.
    //
    // This eliminates the race condition where we were calling resolveLoading()
    // before setUser() had committed to React state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('[Auth] onAuthStateChange:', event, session?.user?.email ?? 'no user');

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
          // resolveLoading AFTER setUser is committed via loadProfile
          resolveLoading();
        } else if (event === 'INITIAL_SESSION') {
          // Fired on mount — either has a session or null
          if (session?.user) {
            await loadProfile(session.user as Parameters<typeof loadProfile>[0]);
          } else {
            // No session on startup
            setUser(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
          resolveLoading();
        } else if (event === 'SIGNED_OUT' || (event as string) === 'TOKEN_REFRESH_FAILED') {
          // Guard: only clear if truly signed out.
          // Wait briefly to distinguish a real logout from a transient event during token refresh.
          setTimeout(() => {
            if (!mounted) return;
            supabase.auth.getUser().then(({ data: { user: u } }) => {
              if (!u) {
                setUser(null);
                localStorage.removeItem(AUTH_STORAGE_KEY);
              }
            });
          }, 300);
          resolveLoading();
        }
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

      supabase.auth.getUser().then(({ data: { user: u } }) => {
        if (!mounted) return;
        if (u) {
          // Session is still alive — reload profile in case token was refreshed
          loadProfile(u as Parameters<typeof loadProfile>[0]);
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
      options: {
        // Always redirect back to the app origin.
        // In dev: http://localhost:5173
        // In prod (Vercel): https://your-domain.com
        redirectTo: window.location.origin,
      },
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
