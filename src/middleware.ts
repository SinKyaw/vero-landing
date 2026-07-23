import { defineMiddleware } from 'astro:middleware';
import { createServerSupabase } from './lib/supabase';

// Guards the admin area. Runs on-demand for /admin/* (those pages are
// `prerender = false`); prerendered marketing pages hit the early return and
// never touch Supabase.
export const onRequest = defineMiddleware(async (context, next) => {
  const path = context.url.pathname;

  // Only the admin area is protected. The login page and the magic-link
  // callback must stay public — the callback is what establishes the session.
  if (!path.startsWith('/admin') || path === '/admin/login' || path === '/admin/callback') {
    return next();
  }

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
});
