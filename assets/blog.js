(() => {
  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }

    callback();
  };

  const escapeHTML = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const fetchJson = async (url) => {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response.json();
  };

  const extractText = (richText) => richText.map((textNode) => {
    let text = escapeHTML(textNode.plain_text || '');

    if (textNode.annotations?.bold) {
      text = `<strong>${text}</strong>`;
    }

    if (textNode.annotations?.italic) {
      text = `<em>${text}</em>`;
    }

    return text;
  }).join('');

  const extractPlainText = (richText) => richText
    .map((textNode) => textNode.plain_text || '')
    .join('');

  const renderBlock = (block) => {
    switch (block.type) {
      case 'heading_1':
        return `<h1>${extractText(block.heading_1.rich_text)}</h1>`;
      case 'heading_2':
        return `<h2>${extractText(block.heading_2.rich_text)}</h2>`;
      case 'heading_3':
        return `<h3>${extractText(block.heading_3.rich_text)}</h3>`;
      case 'heading_4':
        return `<h4>${extractText(block.heading_4.rich_text)}</h4>`;
      case 'paragraph':
        return `<p>${extractText(block.paragraph.rich_text)}</p>`;
      case 'bulleted_list_item':
        return `<li>${extractText(block.bulleted_list_item.rich_text)}</li>`;
      case 'image': {
        const url = block.image.type === 'external'
          ? block.image.external.url
          : block.image.file.url;
        return `<img src="${escapeHTML(url)}" class="blog-inline-image" alt="" />`;
      }
      default:
        return '';
    }
  };

  const renderMorePosts = (pages) => pages.map((page) => `
    <article>
      <a href="/post.html?id=${encodeURIComponent(page.id)}">${escapeHTML(page.child_page.title)}</a>
    </article>
  `).join('');

  const loadBlogList = async () => {
    const container = document.getElementById('blog-container');

    if (!container) {
      return;
    }

    try {
      const pages = await fetchJson('/api/blogs');
      container.innerHTML = pages.length > 0
        ? pages.map((page) => `
          <article>
            <h2>
              <a href="/post.html?id=${encodeURIComponent(page.id)}">${escapeHTML(page.child_page.title)}</a>
            </h2>
          </article>
        `).join('')
        : '<p>No posts found.</p>';
    } catch (error) {
      container.innerHTML = '<p>Unable to load posts.</p>';
    }
  };

  const renderBlogCards = (pages, blocksMap) => pages.map((page) => {
    const blocks = blocksMap[page.id] || [];
    const firstBlock = blocks[0];
    let date = '';

    if (firstBlock && firstBlock.type === 'callout') {
      const text = extractPlainText(firstBlock.callout.rich_text);
      const dateMatch = text.match(/date:\s*(.*?)(\s*\||$)/i);
      date = dateMatch ? dateMatch[1].trim() : '';
    }

    return `
      <div class="blog-card">
        <div class="blog-card-image"></div>
        <div class="blog-card-body">
          <h2 class="blog-card-title">${escapeHTML(page.child_page.title)}</h2>
          ${date ? `<span class="blog-card-date">${escapeHTML(date)}</span>` : ''}
          <a class="blog-card-link" href="/post.html?id=${encodeURIComponent(page.id)}">Read More +</a>
        </div>
      </div>
    `;
  }).join('');

  const setBlogView = (isPostView) => {
    const intro = document.getElementById('blog-intro');
    const listing = document.getElementById('blog-listing');

    if (intro) intro.hidden = isPostView;
    if (listing) listing.hidden = isPostView;
  };

  const loadBlogListing = async () => {
    const listing = document.getElementById('blog-listing');
    if (!listing) return;
    setBlogView(false);
    listing.innerHTML = '<p class="blog-loading">Loading blog posts...</p>';
    listing.hidden = false;
    try {
      const pages = await fetchJson('/api/blogs');

      if (!pages.length) {
        listing.innerHTML = '<p>No posts found.</p>';
        listing.hidden = false;
        return;
      }

      // fetch blocks for each page to extract date from callout
      const blocksMap = {};
      await Promise.all(pages.map(async (page) => {
        try {
          const blocks = await fetchJson(`/api/blog?id=${encodeURIComponent(page.id)}`);
          blocksMap[page.id] = blocks;
        } catch {
          blocksMap[page.id] = [];
        }
      }));

      listing.innerHTML = renderBlogCards(pages, blocksMap);
      listing.hidden = false;
    } catch (error) {
      listing.innerHTML = '<p>Unable to load posts.</p>';
      listing.hidden = false;
    }
  };

  const loadPostPage = async () => {
    const postContent = document.getElementById('post-content');
    if (!postContent) return;

    const requestedId = new URLSearchParams(window.location.search).get('id');
    if (!requestedId) return; // no id = listing view, not post view

    setBlogView(true);
    postContent.hidden = false;

    const finalCta = document.getElementById('final-cta');
    if (finalCta) finalCta.hidden = true;

    try {
      const pages = await fetchJson('/api/blogs');
      if (!pages.length) {
        postContent.innerHTML = '<p>No posts found.</p>';
        return;
      }

      const firstPage = pages.find((page) => page.id === requestedId) || pages[0];
      const allBlocks = await fetchJson(`/api/blog?id=${encodeURIComponent(firstPage.id)}`);
      const pageTitle = firstPage.child_page.title;
      let author = '';
      let readTime = '';
      let date = '';
      let avatarUrl = '';
      const metaBlockIds = new Set();

      const firstBlock = allBlocks[0];
      if (firstBlock && firstBlock.type === 'callout') {
        const text = extractPlainText(firstBlock.callout.rich_text);
        const icon = firstBlock.callout.icon;

        if (icon) {
          if (icon.type === 'file') avatarUrl = icon.file.url;
          else if (icon.type === 'external') avatarUrl = icon.external.url;
          else if (icon.type === 'custom_emoji') avatarUrl = icon.custom_emoji.url;
        }

        if (/author:/i.test(text)) {
          const authorMatch = text.match(/author:\s*(.*?)(\s*\||$)/i);
          const readTimeMatch = text.match(/read time:\s*(.*?)(\s*\||$)/i);
          const dateMatch = text.match(/date:\s*(.*?)(\s*\||$)/i);

          author = authorMatch ? authorMatch[1].trim() : '';
          readTime = readTimeMatch ? `${readTimeMatch[1].trim()} read` : '';
          date = dateMatch ? dateMatch[1].trim() : '';
          metaBlockIds.add(firstBlock.id);
        }
      }

      const contentBlocks = allBlocks.filter((block) => !metaBlockIds.has(block.id));
      const bylineParts = [author, readTime, date].filter(Boolean);
      const bylineHtml = bylineParts.length > 0
        ? `<div class="blog-byline">
            ${avatarUrl ? `<img src="${escapeHTML(avatarUrl)}" class="byline-avatar" alt="" />` : ''}
            ${bylineParts.map((part, index) => `
              ${index > 0 ? '<span class="byline-dot">&middot;</span>' : ''}
              <span class="${index === 0 ? 'byline-author' : 'byline-meta'}">${escapeHTML(part)}</span>
            `).join('')}
          </div>`
        : '';

      postContent.innerHTML = `<h1>${escapeHTML(pageTitle)}</h1>${bylineHtml}${contentBlocks.map(renderBlock).join('')}`;

      if (finalCta) finalCta.hidden = false;

    } catch (error) {
      postContent.innerHTML = '<p>Unable to load this post.</p>';
      if (finalCta) finalCta.hidden = true;
    }
  };

  ready(() => {
    const hasId = new URLSearchParams(window.location.search).has('id');
    if (hasId) {
      loadPostPage();
    } else {
      loadBlogListing();
    }
  });

})();

