# Vero site — Astro

The marketing site has been rebuilt in [Astro](https://astro.build). Output is a
fully static site (`dist/`) that preserves the original `.html` URLs.

## Commands

```bash
npm install      # once
npm run dev      # local dev server (http://localhost:4321)
npm run build    # production build -> dist/
npm run preview  # serve the built dist/ locally
```

## Structure

```
src/
  layouts/BaseLayout.astro   # <head>, bg-glow, Navbar, Footer, DownloadModal,
                             # + shared scripts (modal/menu/navbar-fade, scroll reveal)
  components/                # Navbar, Footer, DownloadModal (shared, edit once)
  pages/                     # one file per route -> /*.html
    index.astro              # home (+ page-only scripts: typewriter, demo,
                             #   feature-expand, stat count-up; hero-sequence styles)
    about-us.astro  affiliate.astro  how-it-works.astro
    privacy-policy.astro  terms.astro   # inject verbatim legal HTML via ?raw
    post.astro               # blog (Notion — see below)
  content-partials/          # raw legal HTML, imported by the legal pages
  styles/global.css          # the original style.css, unchanged
public/assets/               # images (referenced as /assets/...)
```

`build.format: 'file'` (astro.config.mjs) keeps URLs as `/about-us.html` etc.,
so nothing already indexed/linked breaks.

## Blog (self-hosted: Supabase + BlockNote)

The blog moved off Notion to a self-hosted setup — see **`BLOG.md`** for the full
setup + usage guide. In short:
- Founders write posts in a **BlockNote** editor at **`/admin`** (email+password
  login, allowlist-gated by middleware).
- Posts live in **Supabase** (`supabase/schema.sql`); images in Supabase Storage.
- Public pages are **server-rendered** for SEO: `/blog` (listing) and
  `/blog/<slug>` (a post), rendering the **same markup/CSS** as the old blog.
- The site is now **hybrid**: marketing pages prerender (static); blog + admin
  routes set `export const prerender = false` (on-demand via the Vercel adapter).

The old Notion bits (`/api/blogs.js`, `/api/blog.js`, `blog.html`, `NOTION_TOKEN`)
are unused now and can be deleted.

## URLs

The Vercel adapter uses **clean URLs** (`/about-us`, not `/about-us.html`).
`astro.config.mjs` `redirects` emits **301s** from every old `.html` path (and
`/post` → `/blog`), so nothing indexed/linked breaks.

## Deploy (Vercel)

Framework auto-detects as Astro; the adapter emits Vercel's Build Output API
(`.vercel/output`). Set the Supabase env vars in Vercel (see `BLOG.md`).

## Cleanup (after verifying the Astro site)

The original hand-written pages are still in the repo as a safety backup and are
NOT used by the build:
`index.html, about-us.html, affiliate.html, how-it-works.html, post.html,
blog.html, privacy-policy.html, terms.html, pricing.html`, plus the duplicate
root `assets/` (now mirrored in `public/assets/`) and old `style.css` (now
`src/styles/global.css`). Delete these once you're happy with the rebuild.
