/*
 * Plate JSON (the admin editor's value) → HTML, for the server-rendered blog.
 *
 * The node set is closed and matches vero-admin's editor (modules/blog/views/editor/plugins.tsx):
 *   blocks  p, h2, h3, blockquote, hr, img, video, cta, plus "indent lists" (a p with listStyleType + indent)
 *   inline  a
 *   marks   bold, italic, underline, strikethrough, code
 * Anything else renders as its text, so a new editor node never breaks a page: it just looks plain
 * until it is added here. Every string from the post is escaped; nothing is passed through as HTML.
 */

export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const SITE_HOSTS = ['verofin.uk', 'www.verofin.uk'];
export const APP_STORE_URL = 'https://apps.apple.com/gb/app/vero/id6759962937';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.suparat.verofinance';

const isText = (n) => n && typeof n.text === 'string';
const ORDERED = new Set(['decimal', 'decimal-leading-zero', 'lower-alpha', 'upper-alpha', 'lower-roman', 'upper-roman']);

/** http(s), mailto, tel, or a site-relative path. Anything else (javascript:, data:) is dropped. */
const safeHref = (url) => {
  const u = String(url ?? '').trim();
  if (!u) return null;
  if (u.startsWith('/') && !u.startsWith('//')) return u;
  if (u.startsWith('#')) return u;
  try {
    const parsed = new URL(u);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
};

const isInternal = (href) => {
  if (href.startsWith('/') || href.startsWith('#')) return true;
  try {
    return SITE_HOSTS.includes(new URL(href).hostname);
  } catch {
    return false;
  }
};

/** Text with marks. Order is fixed so the same value always renders the same HTML. */
const renderLeaf = (leaf) => {
  let html = escapeHtml(leaf.text).replace(/\n/g, '<br />');
  if (!html) return '';
  if (leaf.code) html = `<code>${html}</code>`;
  if (leaf.bold) html = `<strong>${html}</strong>`;
  if (leaf.italic) html = `<em>${html}</em>`;
  if (leaf.underline) html = `<u>${html}</u>`;
  if (leaf.strikethrough) html = `<s>${html}</s>`;
  return html;
};

const renderInline = (nodes) =>
  (Array.isArray(nodes) ? nodes : [])
    .map((n) => {
      if (isText(n)) return renderLeaf(n);
      if (n?.type === 'a') {
        const inner = renderInline(n.children);
        const href = safeHref(n.url);
        if (!href) return inner;
        // External links open in a new tab and are tagged so analytics can count outbound clicks.
        return isInternal(href)
          ? `<a href="${escapeHtml(href)}">${inner}</a>`
          : `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" data-track="outbound">${inner}</a>`;
      }
      return renderInline(n?.children);
    })
    .join('');

const plain = (nodes) =>
  (Array.isArray(nodes) ? nodes : []).map((n) => (isText(n) ? n.text : plain(n?.children))).join('');

/** Stable id for a heading, so sections can be linked to (`/blog/x#why-skip-open-banking`). */
const anchorFor = (text, used) => {
  const base =
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'section';
  let id = base;
  for (let i = 2; used.has(id); i++) id = `${base}-${i}`;
  used.add(id);
  return id;
};

const ctaHtml = () => `<aside class="blog-cta" data-cta="download">
  <div class="blog-cta__copy">
    <p class="blog-cta__title">Get Vero free</p>
    <p>Log spending in seconds and let Verdi reward every step forward.</p>
  </div>
  <div class="store-row store-row--start">
    <a class="store-badge" href="${APP_STORE_URL}" target="_blank" rel="noopener noreferrer" data-track="app-store">
      <img src="/assets/appstore-download.png" alt="Download on the App Store" width="135" height="45" loading="lazy" />
    </a>
    <a class="store-badge" href="${PLAY_STORE_URL}" target="_blank" rel="noopener noreferrer" data-track="google-play">
      <img src="/assets/google-play-download-cropped.png" alt="Get it on Google Play" width="151" height="45" loading="lazy" />
    </a>
  </div>
</aside>`;

const imageHtml = (n) => {
  const src = safeHref(n.url);
  if (!src) return '';
  const size = Number(n.width) > 0 && Number(n.height) > 0 ? ` width="${Number(n.width)}" height="${Number(n.height)}"` : '';
  return `<figure><img src="${escapeHtml(src)}" alt="${escapeHtml(n.alt ?? '')}"${size} loading="lazy" decoding="async" /></figure>`;
};

/** YouTube ids are 11 characters of [A-Za-z0-9_-]; anything else is not rendered. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * A YouTube video as a click-to-play thumbnail. The iframe (and YouTube's cookies) only load
 * when the reader presses play (assets/js/post.js), which keeps the page fast and keeps
 * YouTube out of the page until someone asks for it. Without JS the link opens YouTube.
 */
const videoHtml = (n) => {
  const id = String(n.videoId ?? '');
  if (n.provider !== 'youtube' || !YOUTUBE_ID.test(id)) return '';
  const title = escapeHtml(n.title || 'Video');
  return `<figure class="post-video" data-video="${id}">
  <a class="post-video__poster" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer" aria-label="Play video: ${title}">
    <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" width="480" height="360" loading="lazy" decoding="async" />
    <span class="post-video__play" aria-hidden="true"></span>
  </a>${n.title ? `\n  <figcaption>${title}</figcaption>` : ''}
</figure>`;
};

const hasBlockChildren = (n) => Array.isArray(n?.children) && n.children.some((c) => !isText(c) && c?.type !== 'a');

/**
 * Indent lists are flat: each item is a paragraph with `listStyleType` and `indent` (1-based).
 * A run of them becomes nested <ul>/<ol>; a deeper item opens a list inside the previous <li>.
 */
const renderListRun = (items) => {
  let out = '';
  const stack = []; // { tag, indent }, each with an open <li>
  for (const item of items) {
    const indent = Math.max(1, Number(item.indent) || 1);
    const tag = ORDERED.has(item.listStyleType) ? 'ol' : 'ul';
    while (stack.length) {
      const top = stack[stack.length - 1];
      if (top.indent > indent || (top.indent === indent && top.tag !== tag)) {
        out += `</li></${top.tag}>`;
        stack.pop();
      } else break;
    }
    const content = renderInline(item.children);
    const top = stack[stack.length - 1];
    if (top && top.indent === indent) out += `</li><li>${content}`;
    else {
      out += `<${tag}><li>${content}`;
      stack.push({ tag, indent });
    }
  }
  while (stack.length) out += `</li></${stack.pop().tag}>`;
  return out;
};

const renderBlocks = (nodes, ctx) => {
  const list = Array.isArray(nodes) ? nodes : [];
  let out = '';
  for (let i = 0; i < list.length; i++) {
    const n = list[i];
    if (!n || isText(n)) continue;

    if (n.listStyleType) {
      const run = [];
      while (i < list.length && list[i]?.listStyleType) run.push(list[i++]);
      i--;
      out += renderListRun(run);
      continue;
    }

    switch (n.type) {
      case 'h1': // not offered by the editor (the headline is the H1); demote rather than add a second
      case 'h2':
      case 'h3': {
        const tag = n.type === 'h3' ? 'h3' : 'h2';
        const inner = renderInline(n.children);
        if (!inner) break;
        const text = plain(n.children).trim();
        const id = anchorFor(text, ctx.used);
        ctx.toc.push({ id, text, level: tag === 'h3' ? 3 : 2 });
        out += `<${tag} id="${id}">${inner}</${tag}>`;
        break;
      }
      case 'blockquote':
        out += `<blockquote>${hasBlockChildren(n) ? renderBlocks(n.children, ctx) : `<p>${renderInline(n.children)}</p>`}</blockquote>`;
        break;
      case 'hr':
        out += '<hr />';
        break;
      case 'img':
        out += imageHtml(n);
        break;
      case 'video':
        out += videoHtml(n);
        break;
      case 'cta':
        out += ctaHtml();
        break;
      default: {
        if (hasBlockChildren(n)) out += renderBlocks(n.children, ctx);
        else {
          const inner = renderInline(n.children);
          if (inner) out += `<p>${inner}</p>`;
        }
      }
    }
  }
  return out;
};

/** The post body as HTML, plus its H2/H3 headings in order for the "On this page" index. */
export const renderPost = (value) => {
  const ctx = { used: new Set(), toc: [] };
  const html = renderBlocks(value, ctx);
  return { html, toc: ctx.toc };
};

export const renderContent = (value) => renderPost(value).html;
