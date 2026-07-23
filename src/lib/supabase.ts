import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string;

// Server-only Supabase helpers. Do not import this module from client code —
// use `supabase-browser.ts` there.

/**
 * Server client bound to Astro's cookies, so it carries the signed-in user's
 * session (and thus their RLS permissions) on SSR requests. Use this in
 * middleware, server pages, and API routes.
 */
export function createServerSupabase(cookies: AstroCookies, request: Request) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get('Cookie') ?? '');
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookies.set(name, value, options);
        }
      },
    },
  });
}

/**
 * Service-role client — bypasses RLS. Server-only, for privileged tasks that
 * have no user context. Never import this into client code.
 */
export function createServiceSupabase() {
  const serviceKey =
    (import.meta.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined) ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(SUPABASE_URL, serviceKey ?? '', {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
