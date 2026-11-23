// GET /sitemap.xml (rewritten here by vercel.json). The static pages plus every indexable post.
// If the backend is down the static pages are still listed, so the sitemap never 500s.
import { getJson } from './_lib/api.js';
import { SITE_URL } from './_lib/layout.js';
import { escapeHtml } from './_lib/serialize.js';

/** Indexable static pages. The noindex app/ pages and the retired affiliate page are left out. */
const STATIC_PATHS = ['/', '/about-us', '/plans', '/verdi-companion', '/feedback', '/blog', '/privacy-policy', '/terms'];

export default async function handler(req, res) {
  let posts = [];
  try {
    posts = (await getJson('/blog/sitemap')) || [];
  } catch (err) {
    console.error('sitemap: posts unavailable', err?.message || err);
  }

  const urls = [
    ...STATIC_PATHS.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`),
    ...posts.map(
      (p) => `  <url><loc>${SITE_URL}/blog/${escapeHtml(p.slug)}</loc><lastmod>${new Date(p.lastModified).toISOString()}</lastmod></url>`
    ),
  ];

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', posts.length ? 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400' : 'public, max-age=0, s-maxage=60');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
}
