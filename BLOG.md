# Blog — self-hosted (Supabase + BlockNote)

Founders write posts in a rich editor at **`/admin`**; posts are stored in
**Supabase** and rendered server-side so visitors see the **same** blog they
always did (same cards, same post layout). Public URLs are slugs:
`/blog` (listing) and `/blog/<slug>` (a post).

---

## One-time setup for the blog database side (~10–15 min)

### 1. Create the Supabase project
1. Sign up at **supabase.com** → **New project** (region near your users, e.g. London).
2. Set a database password when prompted (save it somewhere; you won't need it day-to-day).

### 2. Create the tables + storage
1. In Supabase, open **SQL Editor → New query**.
2. Paste the entire contents of **`supabase/schema.sql`** and click **Run**.
   - This creates the `posts` + `admins` tables, RLS policies, and the public
     `blog-images` storage bucket. Safe to re-run.

### 3. Get your API keys → set env vars
In Supabase: **Project Settings → API**. Copy three values into env vars.

**Locally** — create `.env.local` (already gitignored) from `.env.example`:
```
PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key — secret>
```
**On Vercel** — Project → **Settings → Environment Variables** — add the same
three (Production + Preview). Redeploy after adding them.

> The `service_role` key is a secret. It lives only in env varsm never in the repo.

### 4. Create the founder accounts
1. Supabase → **Authentication → Users → Add user**.
2. Enter each founder's **email**, tick **Auto Confirm User**, and set any
   password (you won't use it — login is by magic link, but Supabase requires a
   value).
3. Repeat for each founder. Only accounts that exist here can ever receive a
   login link.

### 5. Lock down sign-ups & allow the callback URL
1. Supabase → **Authentication → Sign In / Providers → Email** (or **Auth →
   Settings**) → turn **off** "Allow new users to sign up". Only accounts you
   create can exist.
2. Supabase → **Authentication → URL Configuration**:
   - Set **Site URL** to your production domain (e.g. `https://your-domain.com`).
   - Under **Redirect URLs**, add both callback URLs so the link is allowed to
     land:
     - `http://localhost:4321/admin/callback`
     - `https://your-domain.com/admin/callback`

### 5b. Make the magic link work from any device (email template)
By default Supabase's magic link uses a flow that only works in the *same
browser* you requested it from. To make the one-click link work from **any
device** (e.g. request on your laptop, open on your phone), point the link at
our callback with a `token_hash`:

Supabase → **Authentication → Email Templates → Magic Link** → replace the link
line so the body is:
```html
<h2>Log in to Vero Admin</h2>
<p><a href="{{ .SiteURL }}/admin/callback?token_hash={{ .TokenHash }}&type=magiclink">Log in</a></p>
```
That's the whole trick — the callback verifies `token_hash` server-side, so no
per-browser secret is needed. (For local testing, temporarily set **Site URL**
to `http://localhost:4321`, or just edit the link's host in the email.)

### 6. Add the founders to the allowlist
Only allowlisted emails can reach the admin. In **SQL Editor**, run (with your
real emails — must match the login emails exactly):
```sql
insert into public.admins (email) values
  ('founder1@example.com'),
  ('founder2@example.com')
on conflict (email) do nothing;
```

Done. Restart your dev server so it picks up the env vars.

---

## Writing posts

- Go to **`/admin`** → enter your email → **click the login link** Supabase
  emails you (any device — see step 5b). It drops you into the admin.
- **+ New post** → add a **title**, your **author name + avatar** (remembered for
  next time), write the body in the editor, and drop in images (they upload to
  Supabase automatically).
- **Publish date** defaults to today. **Save draft** keeps it hidden; **Publish**
  makes it live at `/blog/<slug>` and lists it on `/blog`.
- The **first image** in a post is used as its listing thumbnail (same as before).
- Read-time is calculated automatically.

### Recreating the one old Notion post
Create it fresh in the editor, then set the **Publish date** field to its original
date before hitting Publish — it'll show that date. Everything after just
auto-dates to the day you publish.

---

## Running locally
- **`npm run dev`** — marketing + blog + admin (needs the env vars above).
- The blog/admin are server-rendered; marketing pages stay static.

## How it's protected
- Middleware gates every `/admin` route (session **+** allowlist) server-side.
- Sign-ups disabled; only your accounts exist.
- Row-Level Security: visitors can read **published** posts only; only
  allowlisted admins can write. Enforced in the database, not just the app.

## Notes
- The old Notion integration (`/api/blogs.js`, `/api/blog.js`, `blog.html`, and
  `NOTION_TOKEN`) is no longer used and can be deleted whenever you like.
