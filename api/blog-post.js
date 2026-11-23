// GET /blog/:slug (rewritten here by vercel.json). One post, fully rendered on the server so
// Googlebot gets the text, title, canonical and JSON-LD in the first response.
import { getJson } from './_lib/api.js';
import { errorPage, notFoundPage, postPage } from './_lib/layout.js';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// The CDN keeps a page for 5 minutes, then serves the old copy for up to a day while it
// refetches in the background. A publish or edit shows up within ~5 minutes.
const CACHE_OK = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
const CACHE_MISS = 'public, max-age=0, s-maxage=60';

export default async function handler(req, res) {
  const slug = String(req.query.slug || '');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  if (!SLUG.test(slug)) {
    res.setHeader('Cache-Control', CACHE_MISS);
    return res.status(404).send(notFoundPage());
  }

  try {
    const found = await getJson(`/blog/posts/${slug}`);
    if (!found) {
      res.setHeader('Cache-Control', CACHE_MISS);
      return res.status(404).send(notFoundPage());
    }
    if (found.kind === 'redirect') {
      res.setHeader('Cache-Control', CACHE_OK);
      res.setHeader('Location', `/blog/${found.slug}`);
      return res.status(301).end();
    }
    res.setHeader('Cache-Control', CACHE_OK);
    return res.status(200).send(postPage(found.post));
  } catch (err) {
    console.error('blog-post failed', slug, err?.message || err);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '60');
    return res.status(503).send(errorPage());
  }
}
