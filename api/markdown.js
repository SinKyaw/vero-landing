// GET / with `Accept: text/markdown` (rewritten here by vercel.json). Serves a Markdown version of the home page for agents.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export default function handler(req, res) {
  let body;
  try {
    body = readFileSync(join(process.cwd(), 'content/md/index.md'), 'utf8');
  } catch (err) {
    console.error('markdown: unreadable', err?.message || err);
    res.status(500).end();
    return;
  }
  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Vary', 'Accept');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.status(200).send(body);
}
