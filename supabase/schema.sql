-- ─────────────────────────────────────────────────────────────────────────
-- Vero blog schema (Supabase / Postgres)
-- Paste this into Supabase → SQL Editor → Run. Safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────

-- Founder allowlist: only emails listed here can create/edit posts.
create table if not exists public.admins (
  email text primary key
);

-- is_admin(): true when the current signed-in user's email is allowlisted.
-- SECURITY DEFINER so the check works regardless of RLS on the admins table.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins
    where email = (auth.jwt() ->> 'email')
  );
$$;

-- Blog posts.
create table if not exists public.posts (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  title             text not null,
  content           jsonb not null default '[]'::jsonb, -- BlockNote doc (source of truth)
  content_html      text not null default '',           -- rendered HTML (display/SEO)
  excerpt           text,
  cover_url         text,                                -- listing thumbnail (first image)
  author_name       text,
  author_avatar_url text,
  read_time         text,                                -- e.g. "5 min"
  status            text not null default 'draft'
                      check (status in ('draft', 'published')),
  published_at      timestamptz,                         -- set on publish (override-able)
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists posts_status_published_idx
  on public.posts (status, published_at desc);

-- Keep updated_at fresh on every update.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists posts_touch_updated_at on public.posts;
create trigger posts_touch_updated_at
  before update on public.posts
  for each row execute function public.touch_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────
alter table public.posts  enable row level security;
alter table public.admins enable row level security;

-- Anyone (anon) can read only PUBLISHED posts.
drop policy if exists "public reads published posts" on public.posts;
create policy "public reads published posts"
  on public.posts for select
  using (status = 'published');

-- Allowlisted admins can do everything (incl. read drafts).
drop policy if exists "admins manage posts" on public.posts;
create policy "admins manage posts"
  on public.posts for all
  using (public.is_admin())
  with check (public.is_admin());

-- admins table is only readable by admins (never exposed publicly).
drop policy if exists "admins read allowlist" on public.admins;
create policy "admins read allowlist"
  on public.admins for select
  using (public.is_admin());

-- ── Data API grants (least privilege) ────────────────────────────────────
-- With "Automatically expose new tables" DISABLED in project settings, new
-- tables get NO Data API access by default. We grant only what's needed; the
-- RLS policies above still decide which rows each role may touch.
--   anon          = website visitors (server reads published posts)
--   authenticated = a logged-in founder (writes/edits posts)
-- The `admins` table is deliberately NOT granted: the client never queries it
-- directly — is_admin() is SECURITY DEFINER and reads it internally.
grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ── Storage: blog images ─────────────────────────────────────────────────
-- Public bucket so <img> URLs work for visitors; only admins can upload.
insert into storage.buckets (id, name, public)
  values ('blog-images', 'blog-images', true)
  on conflict (id) do nothing;

drop policy if exists "public reads blog images" on storage.objects;
create policy "public reads blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');

drop policy if exists "admins upload blog images" on storage.objects;
create policy "admins upload blog images"
  on storage.objects for insert
  with check (bucket_id = 'blog-images' and public.is_admin());

-- ── Add your founder emails to the allowlist ─────────────────────────────
-- (edit these, then re-run just this block; must match the login emails)
-- insert into public.admins (email) values
--   ('founder1@example.com'),
--   ('founder2@example.com')
-- on conflict (email) do nothing;
