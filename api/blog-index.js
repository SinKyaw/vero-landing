// GET /blog and /blog?page=N (rewritten here by vercel.json). Live posts as cards, newest
// first, POSTS_PER_PAGE to a page. The backend returns every live post; paging happens here.
import { getJson } from './_lib/api.js';
import { errorPage, indexPage, notFoundPage, POSTS_PER_PAGE } from './_lib/layout.js';

const CACHE_OK = 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400';
const CACHE_MISS = 'public, max-age=0, s-maxage=60';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // Only /blog or /blog?page=2.., so each page has a single URL. ?page=1 → /blog.
  const raw = req.query.page;
  let page = 1;
  if (raw !== undefined) {
    if (!/^[1-9]\d{0,3}$/.test(String(raw))) {
      res.setHeader('Cache-Control', CACHE_MISS);
      return res.status(404).send(notFoundPage());
    }
    page = Number(raw);
    if (page === 1) {
      res.setHeader('Cache-Control', CACHE_OK);
      res.setHeader('Location', '/blog');
      return res.status(301).end();
    }
  }

  try {
    const posts = (await getJson('/blog/posts')) || [];
    const totalPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
    if (page > totalPages) {
      res.setHeader('Cache-Control', CACHE_MISS);
      return res.status(404).send(notFoundPage());
    }
    const start = (page - 1) * POSTS_PER_PAGE;
    res.setHeader('Cache-Control', CACHE_OK);
    return res.status(200).send(indexPage(posts.slice(start, start + POSTS_PER_PAGE), { page, totalPages }));
  } catch (err) {
    console.error('blog-index failed', err?.message || err);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Retry-After', '60');
    return res.status(503).send(errorPage());
  }
}
