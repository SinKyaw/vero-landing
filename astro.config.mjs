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
    '/how-it-works.html': { status: 301, destination: '/how-it-works' },
    '/privacy-policy.html': { status: 301, destination: '/privacy-policy' },
    '/terms.html': { status: 301, destination: '/terms' },
    '/post.html': { status: 301, destination: '/blog' },
    '/post': { status: 301, destination: '/blog' },
  },
});
