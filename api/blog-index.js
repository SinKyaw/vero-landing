// GET /blog (rewritten here by vercel.json). Every live post as a card, newest first.
import { getJson } from './_lib/api.js';
import { errorPage, indexPage } from './_lib/layout.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  try {
    const posts = (await getJson('/blog/posts')) || [];
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400');
    return res.status(200).send(indexPage(posts));
  } catch (err) {
    console.error('blog-index failed', err?.message || err);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '60');
    return res.status(503).send(errorPage());
  }
}
