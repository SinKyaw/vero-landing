import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

/**
 * Browser-only Supabase client (login form + editor). Uses the public anon key;
 * all data access is still constrained by RLS. Kept separate from the server
 * client so no server/service-role code is ever bundled for the browser.
 */
export function createBrowserSupabase() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
