export const prerender = false;

import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../lib/supabase';

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  const supabase = createServerSupabase(cookies, request);
  await supabase.auth.signOut();
  return redirect('/admin/login');
};
