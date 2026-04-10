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
// The new client then waits 5s for the lock — causing the console warning.
// Solution: persist the instance on globalThis so HMR hot-swaps reuse it.
// ─────────────────────────────────────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __supabaseClient: SupabaseClient | undefined;
}

if (!globalThis.__supabaseClient) {
  globalThis.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Use pkce flow for better security
      flowType: 'pkce',
      // Persist session across reloads
      persistSession: true,
      // Detect session from URL for OAuth callbacks
      detectSessionInUrl: true,
    },
  });
}

export const supabase = globalThis.__supabaseClient;

