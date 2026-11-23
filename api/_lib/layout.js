/*
 * Full HTML pages for /blog and /blog/:slug. The shell (nav, footer, final CTA, download dialog)
 * is api/_lib/template.html, built from the old post.html. Keep its nav and footer in step
 * with the other pages, which each carry their own copy.
 */
import { readFileSync } from 'node:fs';
import { escapeHtml, renderPost } from './serialize.js';

export const SITE_URL = 'https://verofin.uk';
const DEFAULT_IMAGE = `${SITE_URL}/assets/og-default.png`;

const TEMPLATE = readFileSync(new URL('./template.html', import.meta.url), 'utf8');

const fill = ({ htmlClass = '', head, hero, content, bodyStart = '', scripts = '' }) =>
  TEMPLATE.replace('{{HTML_CLASS}}', htmlClass ? ` class="${htmlClass}"` : '')
    .replace('</head>', `${scripts}</head>`)
    .replace('<body>\n', `<body>\n${bodyStart}`)
    .replace('{{HEAD}}', head)
    .replace('{{HERO}}', hero)
    .replace('{{CONTENT}}', content);

/** JSON-LD inside <script>: `</` would end the tag early, so it's escaped. */
const jsonLd = (data) => `  <script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London', calendar: 'gregory' });

const absolute = (url) => (url && url.startsWith('/') ? `${SITE_URL}${url}` : url);

const headTags = ({ title, description, url, image, type = 'website', noindex = false, extra = [] }) =>
  [
    `  <title>${escapeHtml(title)}</title>`,
    `  <meta name="description" content="${escapeHtml(description)}" />`,
    '  <meta name="theme-color" content="#E7FDFB" />',
    noindex ? '  <meta name="robots" content="noindex, follow" />' : null,
    url ? `  <link rel="canonical" href="${escapeHtml(url)}" />` : null,
    `  <meta property="og:type" content="${type}" />`,
    '  <meta property="og:site_name" content="Vero" />',
    `  <meta property="og:title" content="${escapeHtml(title)}" />`,
    `  <meta property="og:description" content="${escapeHtml(description)}" />`,
    url ? `  <meta property="og:url" content="${escapeHtml(url)}" />` : null,
    `  <meta property="og:image" content="${escapeHtml(image || DEFAULT_IMAGE)}" />`,
    '  <meta name="twitter:card" content="summary_large_image" />',
    ...extra,
  ]
    .filter(Boolean)
    .join('\n');

const heroTitle = (text) =>
  `        <h1 class="h-display page-hero__title" id="page-title"><span class="line"><span class="line__in">${escapeHtml(text)}</span></span></h1>`;

const card = (p) => {
  const media = p.coverImageUrl
    ? `<img src="${escapeHtml(p.coverImageUrl)}" alt="${escapeHtml(p.coverImageAlt)}"${p.coverWidth && p.coverHeight ? ` width="${p.coverWidth}" height="${p.coverHeight}"` : ''} loading="lazy" decoding="async" />`
    : '<img src="/assets/home/verdi-peek.webp" alt="" width="440" height="270" loading="lazy" />';
  return `<a class="post-card" href="/blog/${escapeHtml(p.slug)}">
  <span class="post-card__media${p.coverImageUrl ? '' : ' post-card__media--empty'}">${media}</span>
  <span class="post-card__body">
    <span class="post-card__date">${fmtDate(p.publishedAt)} · ${p.readMinutes} min read</span>
    <span class="post-card__title">${escapeHtml(p.title)}</span>
    ${p.excerpt ? `<span class="post-card__excerpt">${escapeHtml(p.excerpt)}</span>` : ''}
  </span>
</a>`;
};

// ── /blog ────────────────────────────────────────────────────────────────

export const indexPage = (posts) => {
  const url = `${SITE_URL}/blog`;
  const title = 'Blog – Vero';
  const description = 'Money habits, budgeting tips, product news and life with Verdi, from the Vero team.';
  const content = posts.length
    ? `        <div class="blog-grid">\n${posts.map((p) => card(p)).join('\n')}\n        </div>`
    : `        <div class="blog-grid"><div class="blog-state"><img src="/assets/home/verdi-peek.webp" alt="" width="440" height="270" /><h2>Stories are on the way</h2><p>Check back soon.</p></div></div>`;
  return fill({
    head: headTags({
      title,
      description,
      url,
      extra: [
        jsonLd({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'The Vero blog',
          url,
          publisher: { '@type': 'Organization', name: 'Vero', url: `${SITE_URL}/` },
        }),
      ],
    }),
    hero: [
      '        <span class="eyebrow" data-page-in>Our blog</span>',
      heroTitle('The latest stories about Vero'),
      '        <p class="lede" data-page-in>Money habits, product news and life with Verdi.</p>',
    ].join('\n'),
    content,
  });
};

// ── /blog/:slug ──────────────────────────────────────────────────────────

export const postPage = (post) => {
  const url = `${SITE_URL}/blog/${post.slug}`;
  const image = absolute(post.coverImageUrl) || DEFAULT_IMAGE;

  const posting = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: [image],
    datePublished: post.publishedAt,
    dateModified: post.modifiedAt,
    author: { '@type': 'Person', name: post.authorName, ...(post.authorUrl ? { url: post.authorUrl } : {}) },
    publisher: { '@type': 'Organization', name: 'Vero', url: `${SITE_URL}/`, logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/logo-primary.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(post.category ? { articleSection: post.category } : {}),
    ...(post.tags?.length ? { keywords: post.tags.join(', ') } : {}),
  };
  // "Vero team" is an organisation, not a person: say so, so Google doesn't read it as a name.
  if (/team$/i.test(post.authorName)) posting.author['@type'] = 'Organization';

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  const byline = [
    `By <b>${post.authorUrl ? `<a href="${escapeHtml(post.authorUrl)}">${escapeHtml(post.authorName)}</a>` : escapeHtml(post.authorName)}</b>`,
    `<time datetime="${escapeHtml(post.publishedAt)}">${fmtDate(post.publishedAt)}</time>`,
    `${post.readMinutes} min read`,
  ].join('<span class="byline__dot" aria-hidden="true">•</span>');

  const cover = post.coverImageUrl
    ? `<figure class="post__cover"><img src="${escapeHtml(post.coverImageUrl)}" alt="${escapeHtml(post.coverImageAlt)}"${post.coverWidth && post.coverHeight ? ` width="${post.coverWidth}" height="${post.coverHeight}"` : ''} fetchpriority="high" decoding="async" /></figure>`
    : '';

  const related = post.related?.length
    ? `        <aside class="post-related" aria-labelledby="related-title">
          <h2 class="post-related__title" id="related-title">Keep reading</h2>
          <div class="blog-grid">\n${post.related.map((p) => card(p)).join('\n')}\n          </div>
        </aside>`
    : '';

  const body = renderPost(post.content);
  // Built from the post's own H2/H3s, so editors never maintain an index by hand. Shown on
  // wide screens only (CSS); with fewer than two headings there's nothing to navigate.
  const toc =
    body.toc.length >= 2
      ? `<nav class="legal__toc" aria-label="On this page">
            <p class="legal__toc-h">On this page</p>
            <ol data-post-toc>
${body.toc.map((h) => `              <li${h.level === 3 ? ' class="is-sub"' : ''}><a href="#${h.id}">${escapeHtml(h.text)}</a></li>`).join('\n')}
            </ol>
          </nav>`
      : '';

  return fill({
    // is-post: the shared hero/back-link styling; is-article: the left-aligned reading layout.
    htmlClass: 'is-post is-article',
    head: headTags({
      title: post.seoTitle || post.title,
      description: post.metaDescription,
      url,
      image,
      type: 'article',
      noindex: post.noindex,
      extra: [
        `  <meta property="article:published_time" content="${escapeHtml(post.publishedAt)}" />`,
        `  <meta property="article:modified_time" content="${escapeHtml(post.modifiedAt)}" />`,
        jsonLd(posting),
        jsonLd(breadcrumbs),
      ],
    }),
    scripts: '  <script src="/assets/js/post.js" defer></script>\n',
    bodyStart: '  <div class="read-progress" aria-hidden="true"><span data-read-progress></span></div>\n',
    hero: [
      '        <a class="back-link" href="/blog" data-post-only><svg aria-hidden="true"><use href="#i-back" /></svg>All stories</a>',
      post.category ? `        <span class="eyebrow" data-page-in>${escapeHtml(post.category)}</span>` : '',
      heroTitle(post.title),
      `        <p class="byline" data-post-only>${byline}</p>`,
      '        <hr class="post-divider" />',
    ]
      .filter(Boolean)
      .join('\n'),
    content: `        <div class="post-layout">
          <article class="prose post" data-post-body>\n${cover}\n${body.html}\n          </article>
          <aside class="post-toc">${toc}</aside>
        </div>\n${related}`,
  });
};

// ── errors ───────────────────────────────────────────────────────────────

const messagePage = ({ title, heading, text }) =>
  fill({
    htmlClass: 'is-post',
    head: headTags({ title, description: text, noindex: true }),
    hero: [
      '        <a class="back-link" href="/blog" data-post-only><svg aria-hidden="true"><use href="#i-back" /></svg>All stories</a>',
      heroTitle(heading),
    ].join('\n'),
    content: `        <div class="blog-state"><img src="/assets/home/verdi-peek.webp" alt="" width="440" height="270" /><p>${escapeHtml(text)}</p><a class="app-btn" href="/blog"><span class="app-btn__face"><span class="app-btn__surface">See all stories</span></span></a></div>`,
  });

export const notFoundPage = () =>
  messagePage({ title: 'Story not found – Vero', heading: 'We couldn’t find that story', text: 'It may have moved, or the link has a typo.' });

export const errorPage = () =>
  messagePage({ title: 'Blog – Vero', heading: 'The blog is taking a breather', text: 'Please try again in a minute.' });
