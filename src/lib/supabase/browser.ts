import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const globalForSb = globalThis as typeof globalThis & {
  __tfcBrowserSupabase?: SupabaseClient | null;
};

/** One browser client per page. A new client on every call spins up another GoTrueClient on the same storage key. */
export function createBrowserSupabase(): SupabaseClient | null {
  if (globalForSb.__tfcBrowserSupabase !== undefined) {
    return globalForSb.__tfcBrowserSupabase;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    globalForSb.__tfcBrowserSupabase = null;
    return null;
  }

  const client = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  globalForSb.__tfcBrowserSupabase = client;
  return client;
}

export function isSupabaseBrowserEnabled() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
