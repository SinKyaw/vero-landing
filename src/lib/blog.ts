/** Shape of a row in the `posts` table. `content` is the BlockNote document. */
export interface Post {
  id: string;
  slug: string;
  title: string;
  content: unknown;
  content_html: string;
  excerpt: string | null;
  cover_url: string | null;
  author_name: string | null;
  author_avatar_url: string | null;
  read_time: string | null;
  status: 'draft' | 'published';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

/** URL-safe slug from a title. */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '') // strip accents
      .replace(/[^a-z0-9]+/g, '-') // non-alphanumeric → dash
      .replace(/^-+|-+$/g, '') // trim leading/trailing dashes
      .slice(0, 80) || 'post'
  );
}

/** "N min" reading estimate from plain body text (~200 wpm). */
export function readTimeFromText(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min`;
}

/** Display date, e.g. "12 March 2025" (matches the blog's existing look). */
export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
