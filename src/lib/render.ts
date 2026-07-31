import sanitizeHtml from 'sanitize-html';

// Defense-in-depth: even though only trusted founders author posts, scrub the
// rendered HTML to a safe allowlist (no scripts, no javascript: URLs, no inline
// styles/event handlers) before it's stored/served.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'code', 'pre',
    'blockquote', 'a', 'img',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  // Any link with target=_blank gets rel=noopener noreferrer.
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
      },
    }),
  },
};

export interface RenderedPost {
  /** Semantic HTML (h1–h3, p, ul/ol/li, img, strong/em) — matches the blog CSS. */
  html: string;
  /** Plain text, for read-time + excerpt. */
  text: string;
  /** First image URL, used as the listing thumbnail (as the old blog did). */
  cover: string | null;
}

type BlockNoteBlock = {
  type?: string;
  content?: unknown;
  props?: Record<string, unknown>;
  children?: unknown;
};

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value: unknown) {
  const url = String(value ?? '').trim();
  return /^(https?:|mailto:)/i.test(url) ? url : '';
}

function inlineContentToHtml(content: unknown): string {
  if (typeof content === 'string') return escapeHtml(content);
  if (!Array.isArray(content)) return '';

  return content
    .map((item) => {
      if (typeof item === 'string') return escapeHtml(item);
      if (!item || typeof item !== 'object') return '';

      const inline = item as {
        type?: string;
        text?: string;
        href?: string;
        content?: unknown;
        styles?: Record<string, boolean>;
      };

      if (inline.type === 'link') {
        const href = safeUrl(inline.href);
        const label = inlineContentToHtml(inline.content);
        return href ? `<a href="${escapeHtml(href)}">${label}</a>` : label;
      }

      let html = escapeHtml(inline.text ?? '');
      const styles = inline.styles ?? {};
      if (styles.bold) html = `<strong>${html}</strong>`;
      if (styles.italic) html = `<em>${html}</em>`;
      if (styles.underline) html = `<u>${html}</u>`;
      if (styles.strike) html = `<s>${html}</s>`;
      if (styles.code) html = `<code>${html}</code>`;
      return html;
    })
    .join('');
}

function blockChildrenToHtml(block: BlockNoteBlock) {
  return Array.isArray(block.children) && block.children.length
    ? renderBlocks(block.children as BlockNoteBlock[])
    : '';
}

function blockToHtml(block: BlockNoteBlock): string {
  const props = block.props ?? {};
  const content = inlineContentToHtml(block.content);

  switch (block.type) {
    case 'heading': {
      const level = Math.min(Math.max(Number(props.level) || 2, 1), 6);
      return `<h${level}>${content}</h${level}>`;
    }
    case 'bulletListItem':
    case 'numberedListItem':
      return `<li>${content}${blockChildrenToHtml(block)}</li>`;
    case 'image': {
      const src = safeUrl(props.url ?? props.src);
      if (!src) return '';
      const alt = escapeHtml(props.caption ?? props.name ?? '');
      return `<img src="${escapeHtml(src)}" alt="${alt}" />`;
    }
    case 'quote':
    case 'blockquote':
      return `<blockquote>${content}</blockquote>`;
    case 'codeBlock':
      return `<pre><code>${escapeHtml(content)}</code></pre>`;
    default:
      return content ? `<p>${content}</p>` : '';
  }
}

function renderBlocks(blocks: BlockNoteBlock[]): string {
  let html = '';
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (block.type === 'bulletListItem' || block.type === 'numberedListItem') {
      const listType = block.type === 'bulletListItem' ? 'ul' : 'ol';
      const itemType = block.type;
      const items: string[] = [];

      while (i < blocks.length && blocks[i]?.type === itemType) {
        items.push(blockToHtml(blocks[i]));
        i++;
      }
      i--;
      html += `<${listType}>${items.join('')}</${listType}>`;
      continue;
    }

    html += blockToHtml(block);
  }
  return html;
}

/**
 * Render a BlockNote document to display HTML on the server. Uses the "lossy"
 * export so the output is clean semantic HTML (not BlockNote's editor markup),
 * which drops straight into the existing `#post-content` styles.
 */
export async function renderPost(document: unknown): Promise<RenderedPost> {
  const blocks = Array.isArray(document) ? (document as BlockNoteBlock[]) : [];
  if (blocks.length === 0) return { html: '', text: '', cover: null };

  const rawHtml = renderBlocks(blocks);
  const html = sanitizeHtml(rawHtml, SANITIZE_OPTIONS);

  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const coverMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return { html, text, cover: coverMatch ? coverMatch[1] : null };
}
