import { defineMiddleware } from 'astro:middleware';
import { createServerSupabase } from './lib/supabase';

// Guards the admin area. Runs on-demand for /admin/* (those pages are
// `prerender = false`); prerendered marketing pages hit the early return and
// never touch Supabase.
export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  // Convenience: tacking `/admin` onto the end of ANY page jumps to the admin
  // area, e.g. /blog/admin, /pricing/admin → /admin. Trailing match only (not
  // the real /admin itself, and not deeper paths like /x/admin/y). 302 so these
  // shortcut URLs aren't cached as permanent.
  if (path !== '/admin' && path.endsWith('/admin')) {
    return context.redirect('/admin', 302);
  }

  // Only the admin area is protected. The login page and the magic-link
  // callback must stay public — the callback is what establishes the session.
  if (!path.startsWith('/admin') || path === '/admin/login' || path === '/admin/callback') {
    return next();
  }

  try {
    const supabase = createServerSupabase(context.cookies, context.request);

    // getUser() validates the JWT against Supabase (not just a decoded cookie).
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return context.redirect('/admin/login');
    }

    // Signed in — but only allowlisted founder emails may enter.
    const { data: isAdmin } = await supabase.rpc('is_admin');
    if (!isAdmin) {
      await supabase.auth.signOut();
      return context.redirect('/admin/login?denied=1');
    }

    // Make the user available to admin pages/endpoints without re-fetching.
    context.locals.user = user;
    return next();
  } catch (err) {
    // A crash here (e.g. missing env var, Supabase init/network) would otherwise
    // bubble up as an empty-body platform 500 before any route runs. Surface a
    // readable message instead — JSON for API routes, redirect for pages.
    const message = err instanceof Error ? err.message : String(err);
    console.error('[middleware] Admin guard error:', err instanceof Error ? err.stack : message);
    if (path.startsWith('/admin/api/')) {
      return new Response(JSON.stringify({ error: `Auth check failed: ${message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return context.redirect('/admin/login?error=1');
  }
});
