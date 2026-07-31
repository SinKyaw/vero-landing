export const prerender = false;

import type { APIRoute } from 'astro';
import { createServerSupabase } from '../../lib/supabase';

async function logout({ cookies, request, redirect }: Parameters<APIRoute>[0]) {
  const supabase = createServerSupabase(cookies, request);
  await supabase.auth.signOut();
  return redirect('/admin/login');
}

export const GET: APIRoute = logout;
export const POST: APIRoute = logout;
