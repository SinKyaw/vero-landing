/* Vero blog — renders the post list and single posts from the Notion-backed
   API (/api/blogs, /api/blog?id=…). Without an id it shows the list. */
(() => {
  'use strict';

  const doc = document;
  const listing = doc.getElementById('blog-listing');
  const postEl = doc.getElementById('post-content');
  const titleEl = doc.querySelector('[data-post-title]');
  const bylineEl = doc.querySelector('[data-post-byline]');
  const requestedId = new URLSearchParams(location.search).get('id');

  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = (u = '') => (/^https?:\/\//i.test(u) ? esc(u) : '');

  // Notion rich text → HTML (text escaped, bold/italic/links kept)
  const extractText = (richText = []) => richText.map((t) => {
    let text = esc(t.plain_text);
    if (t.annotations && t.annotations.bold) text = `<strong>${text}</strong>`;
    if (t.annotations && t.annotations.italic) text = `<em>${text}</em>`;
    const href = t.href && safeUrl(t.href);
    if (href) text = `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    return text;
  }).join('');
  const plainText = (richText = []) => richText.map((t) => t.plain_text).join('');

  const imageUrl = (block) => (block.image.type === 'external' ? block.image.external.url : block.image.file.url);

  const renderBlock = (block) => {
    switch (block.type) {
      case 'heading_1': return `<h2>${extractText(block.heading_1.rich_text)}</h2>`;
      case 'heading_2': return `<h2>${extractText(block.heading_2.rich_text)}</h2>`;
      case 'heading_3': return `<h3>${extractText(block.heading_3.rich_text)}</h3>`;
      case 'heading_4': return `<h4>${extractText(block.heading_4.rich_text)}</h4>`;
      case 'paragraph': return `<p>${extractText(block.paragraph.rich_text)}</p>`;
      case 'bulleted_list_item': return `<li>${extractText(block.bulleted_list_item.rich_text)}</li>`;
      case 'image': {
        const src = safeUrl(imageUrl(block));
        return src ? `<img src="${src}" alt="" loading="lazy" />` : '';
      }
      default: return '';
    }
  };

  // Group consecutive list items into one <ul>
  const renderBlocks = (blocks) => {
    let html = '';
    let inList = false;
    blocks.forEach((b) => {
      const isItem = b.type === 'bulleted_list_item';
      if (isItem && !inList) { html += '<ul>'; inList = true; }
      if (!isItem && inList) { html += '</ul>'; inList = false; }
      html += renderBlock(b);
    });
    return inList ? `${html}</ul>` : html;
  };

  // The first callout holds "author: … | read time: … | date: …"
  const readMeta = (blocks) => {
    const first = blocks[0];
    const meta = { author: '', readTime: '', date: '', avatar: '', id: null };
    if (!first || first.type !== 'callout') return meta;
    const text = plainText(first.callout.rich_text);
    const pick = (key) => { const m = text.match(new RegExp(`${key}:\\s*(.*?)(\\s*\\||$)`, 'i')); return m ? m[1].trim() : ''; };
    meta.date = pick('date');
    if (/author:/i.test(text)) {
      meta.author = pick('author');
      meta.readTime = pick('read time');
      meta.id = first.id;
      const icon = first.callout.icon;
      if (icon) meta.avatar = (icon.file || icon.external || icon.custom_emoji || {}).url || '';
    }
    return meta;
  };

  const getJSON = async (url) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json();
  };
  const fetchBlocks = (id) => getJSON(`/api/blog?id=${encodeURIComponent(id)}`);

  const stateHTML = (title, text) => `
    <div class="blog-state">
      <img src="assets/home/verdi-thinking.webp" alt="" width="560" height="441" />
      <h2>${title}</h2>
      <p>${text}</p>
      <a class="app-btn app-btn--white" href="${location.pathname}${location.search}">
        <span class="app-btn__face"><span class="app-btn__surface">Try again</span></span>
      </a>
    </div>`;

  const refresh = () => { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); };

  /* ── List ── */
  async function loadListing() {
    listing.innerHTML = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
    try {
      const pages = await getJSON('/api/blogs');
      if (!pages.length) {
        listing.innerHTML = stateHTML('No stories yet', 'We’re writing the first one. Check back soon.');
        return;
      }
      const blocksMap = {};
      await Promise.all(pages.map(async (p) => {
        try { blocksMap[p.id] = await fetchBlocks(p.id); } catch { blocksMap[p.id] = []; }
      }));
      listing.innerHTML = pages.map((p, i) => {
        const blocks = blocksMap[p.id] || [];
        const { date } = readMeta(blocks);
        const img = blocks.find((b) => b.type === 'image');
        const src = img ? safeUrl(imageUrl(img)) : '';
        const media = src
          ? `<span class="post-card__media"><img src="${src}" alt="" loading="lazy" /></span>`
          : '<span class="post-card__media post-card__media--empty"><img src="assets/home/verdi-phone.webp" alt="" /></span>';
        return `
          <a class="post-card${i === 0 ? ' post-card--lead' : ''}" href="post.html?id=${encodeURIComponent(p.id)}" style="animation-delay:${Math.min(i, 6) * 70}ms">
            ${media}
            <span class="post-card__body">
              ${date ? `<span class="post-card__date">${esc(date)}</span>` : ''}
              <h2 class="post-card__title">${esc(p.child_page.title)}</h2>
              <span class="post-card__more">Read story<svg aria-hidden="true"><use href="#i-arrow" /></svg></span>
            </span>
          </a>`;
      }).join('');
    } catch {
      listing.innerHTML = stateHTML('We couldn’t load the blog', 'Something went wrong on our side. Please try again in a moment.');
    } finally {
      listing.setAttribute('aria-busy', 'false');
      refresh();
    }
  }

  /* ── Single post ── */
  async function loadPost() {
    titleEl.textContent = 'Loading story…';
    postEl.innerHTML = '<div class="skeleton"></div>';
    try {
      const pages = await getJSON('/api/blogs');
      const page = pages.find((p) => p.id === requestedId) || pages[0];
      if (!page) throw new Error('empty');
      const blocks = await fetchBlocks(page.id);
      const meta = readMeta(blocks);
      const title = page.child_page.title;

      titleEl.textContent = title;
      doc.title = `${title} – Vero blog`;
      const parts = [meta.author && `<b>${esc(meta.author)}</b>`, meta.readTime && `${esc(meta.readTime)} read`, meta.date && esc(meta.date)].filter(Boolean);
      const avatar = safeUrl(meta.avatar);
      bylineEl.innerHTML = (avatar ? `<img src="${avatar}" alt="" />` : '') + parts.join('<span class="byline__dot" aria-hidden="true">·</span>');

      postEl.innerHTML = renderBlocks(blocks.filter((b) => b.id !== meta.id));
    } catch {
      titleEl.textContent = 'Story not found';
      postEl.innerHTML = stateHTML('We couldn’t load this story', 'It may have moved, or our blog is having a moment.');
    } finally {
      postEl.setAttribute('aria-busy', 'false');
      refresh();
    }
  }

  if (requestedId) loadPost();
  else loadListing();
})();
