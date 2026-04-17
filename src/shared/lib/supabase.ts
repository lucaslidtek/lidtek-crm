import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

// ── HMR Singleton ──────────────────────────────────────────────────────────
// During Vite HMR, re-importing this module would create a NEW Supabase client,
// but the OLD one already holds the GoTrue auth lock in IndexedDB.
// Solution: persist the instance on globalThis so HMR hot-swaps reuse it.
// ─────────────────────────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined;
}

if (!globalThis.__supabaseClient) {
  globalThis.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // PKCE is the recommended flow for SPAs — uses secure code exchange via query params.
      // Implicit flow (hash fragments) was deprecated by OAuth 2.1 and is unreliable on redirect.
      flowType: 'pkce',
      // Use localStorage instead of IndexedDB to avoid lock contention
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-lidtek-auth',
      // Persist session across reloads
      persistSession: true,
      // Auto-refresh JWT before it expires — MUST be explicit (R2)
      autoRefreshToken: true,
      // Detect session from URL for OAuth callbacks (PKCE code + implicit hash)
      detectSessionInUrl: true,
      // Bypass navigator.locks (causes "Lock was not released within 5000ms" on HMR).
      // Instead of null, provide a real function that just runs fn() directly.
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
        return await fn();
      },
    },
  });
}

export const supabase = globalThis.__supabaseClient;
