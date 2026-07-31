export const prerender = false;

import type { APIRoute } from 'astro';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabase } from '../../../lib/supabase';
import { renderPost } from '../../../lib/render';
import { slugify, readTimeFromText } from '../../../lib/blog';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

async function ensureUniqueSlug(supabase: SupabaseClient, base: string, excludeId?: string) {
  let slug = base;
  for (let i = 0; i < 25; i++) {
    let query = supabase.from('posts').select('id').eq('slug', slug);
    if (excludeId) query = query.neq('id', excludeId);
    const { data } = await query.maybeSingle();
    if (!data) return slug;
    slug = `${base}-${i + 2}`;
  }
  return `${base}-${Date.now()}`;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    return await handleSave({ request, cookies });
  } catch (err) {
    // Catch-all so an unexpected exception (missing env var, Supabase client init,
    // network, etc.) surfaces a readable message instead of a bare HTML 500 the
    // editor can only report as "Save failed (500)". Logged for Vercel too.
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[admin/api/save] Unhandled error:', stack ?? message);
    return json({ error: `Server error: ${message}`, stack }, 500);
  }
};

async function handleSave({ request, cookies }: Pick<Parameters<APIRoute>[0], 'request' | 'cookies'>) {
  const supabase = createServerSupabase(cookies, request);

  // Re-verify auth + allowlist server-side (never trust the client).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ error: 'Unauthorized' }, 401);
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) return json({ error: 'Forbidden' }, 403);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const { id, title, content, status, publishDate, authorName, authorAvatarUrl } = body ?? {};
  if (!title || typeof title !== 'string' || !Array.isArray(content)) {
    return json({ error: 'A title and content are required.' }, 400);
  }

  const isPublished = status === 'published';

  // Rendering the BlockNote doc to HTML runs a server-side editor that can throw;
  // surface a real message instead of a bare 500 the client can't read.
  let html: string, text: string, cover: string | null;
  try {
    ({ html, text, cover } = await renderPost(content));
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return json({ error: `Could not render post content: ${detail}` }, 500);
  }

  const readTime = readTimeFromText(text);
  const excerpt = text.slice(0, 160);

  // published_at: honour the override date when publishing; keep null for drafts.
  let publishedAt: string | null = null;
  if (isPublished) {
    publishedAt = publishDate ? new Date(`${publishDate}T12:00:00Z`).toISOString() : new Date().toISOString();
  }

  const record = {
    title: title.trim(),
    content,
    content_html: html,
    excerpt,
    cover_url: cover,
    author_name: authorName || null,
    author_avatar_url: authorAvatarUrl || null,
    read_time: readTime,
    status: isPublished ? 'published' : 'draft',
    published_at: publishedAt,
  };

  if (id && id !== 'new') {
    const { data, error } = await supabase
      .from('posts')
      .update(record)
      .eq('id', id)
      .select('id, slug')
      .single();
    if (error) return json({ error: error.message }, 400);
    return json({ id: data.id, slug: data.slug });
  }

  const slug = await ensureUniqueSlug(supabase, slugify(title));
  const { data, error } = await supabase
    .from('posts')
    .insert({ ...record, slug })
    .select('id, slug')
    .single();
  if (error) return json({ error: error.message }, 400);
  return json({ id: data.id, slug: data.slug });
}
