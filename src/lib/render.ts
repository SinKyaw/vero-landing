import { ServerBlockNoteEditor } from '@blocknote/server-util';
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

/**
 * Render a BlockNote document to display HTML on the server. Uses the "lossy"
 * export so the output is clean semantic HTML (not BlockNote's editor markup),
 * which drops straight into the existing `#post-content` styles.
 */
export async function renderPost(document: unknown): Promise<RenderedPost> {
  const blocks = Array.isArray(document) ? document : [];
  if (blocks.length === 0) return { html: '', text: '', cover: null };

  const editor = ServerBlockNoteEditor.create();
  const rawHtml = await editor.blocksToHTMLLossy(blocks as never);
  const html = sanitizeHtml(rawHtml, SANITIZE_OPTIONS);

  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const coverMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return { html, text, cover: coverMatch ? coverMatch[1] : null };
}
