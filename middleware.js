// Vercel Edge Middleware. Runs before static files, so it can serve Markdown for `/` when an agent asks for it
// (a vercel.json rewrite can't: the static index.html wins). Browsers and anything else still get the HTML.
export const config = { matcher: '/' };

export default function middleware(request) {
  const accept = request.headers.get('accept') || '';
  if (!/\btext\/markdown\b/i.test(accept)) return;

  // Same as `rewrite()` from @vercel/functions, without adding a dependency.
  return new Response(null, {
    headers: { 'x-middleware-rewrite': new URL('/api/markdown', request.url).toString() },
  });
}
