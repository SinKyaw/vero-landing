// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// Marketing pages stay static/prerendered (fast, SEO-safe). The blog + admin
// opt into on-demand server rendering via `export const prerender = false`, so
// they can read/write the Supabase-backed posts. React is only used by the
// admin's BlockNote editor island.
//
// URLs: the Vercel adapter uses clean URLs (/about-us, not /about-us.html).
// 301 redirects from the old `.html` paths live in vercel.json so nothing
// indexed/linked breaks.
export default defineConfig({
  site: 'https://verofin.uk',
  output: 'static',
  adapter: vercel(),
  integrations: [react()],
  trailingSlash: 'never',
  // 301s from the old .html URLs → clean URLs, so nothing indexed/linked breaks.
  // (The old Notion blog lived at /post.html; it now redirects to /blog.)
  redirects: {
    '/about-us.html': { status: 301, destination: '/about-us' },
    '/affiliate.html': { status: 301, destination: '/affiliate' },
    // The standalone How-it-Works page was removed; send its old URLs home.
    '/how-it-works': { status: 301, destination: '/' },
    '/how-it-works.html': { status: 301, destination: '/' },
    '/privacy-policy.html': { status: 301, destination: '/privacy-policy' },
    '/terms.html': { status: 301, destination: '/terms' },
    '/post.html': { status: 301, destination: '/blog' },
    '/post': { status: 301, destination: '/blog' },
    // Convenience: tacking `/admin` onto any static page jumps to the admin area
    // (302, not cached as permanent). These must be explicit edge redirects
    // because unmatched paths never reach the middleware on Vercel's static
    // output. `/blog/admin` is handled by the middleware (it hits /blog/[slug]).
    // Add a line here for any NEW top-level page.
    '/about-us/admin': { status: 302, destination: '/admin' },
    '/affiliate/admin': { status: 302, destination: '/admin' },
    '/privacy-policy/admin': { status: 302, destination: '/admin' },
    '/terms/admin': { status: 302, destination: '/admin' },
  },
});
