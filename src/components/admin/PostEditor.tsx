import { useMemo, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import { createBrowserSupabase } from '../../lib/supabase-browser';
import type { Post } from '../../lib/blog';

interface Props {
  post: Post | null;
  defaultAuthorEmail: string;
}

const remembered = (key: string) => {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Returns an error message if the file isn't an acceptable image, else null. */
function validateImage(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Only image files are allowed.';
  if (file.size > MAX_IMAGE_BYTES) return 'Image is too large (max 5 MB).';
  return null;
}

export default function PostEditor({ post, defaultAuthorEmail }: Props) {
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [title, setTitle] = useState(post?.title ?? '');
  const [authorName, setAuthorName] = useState(post?.author_name ?? remembered('vero-author-name'));
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState(
    post?.author_avatar_url ?? remembered('vero-author-avatar')
  );
  const [publishDate, setPublishDate] = useState(
    (post?.published_at ?? new Date().toISOString()).slice(0, 10)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const editor = useCreateBlockNote({
    initialContent:
      Array.isArray(post?.content) && post!.content.length ? (post!.content as never) : undefined,
    // Editor images upload straight to Supabase Storage; the public URL is stored
    // in the document.
    uploadFile: async (file: File) => {
      const invalid = validateImage(file);
      if (invalid) throw new Error(invalid);
      const path = `posts/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const { data, error } = await supabase.storage.from('blog-images').upload(path, file);
      if (error) throw new Error(error.message);
      return supabase.storage.from('blog-images').getPublicUrl(data.path).data.publicUrl;
    },
  });

  async function uploadAvatar(file: File) {
    const invalid = validateImage(file);
    if (invalid) {
      setError(invalid);
      return;
    }
    const path = `avatars/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { data, error } = await supabase.storage.from('blog-images').upload(path, file);
    if (error) {
      setError(error.message);
      return;
    }
    setAuthorAvatarUrl(supabase.storage.from('blog-images').getPublicUrl(data.path).data.publicUrl);
  }

  async function save(status: 'draft' | 'published') {
    if (!title.trim()) {
      setError('Give the post a title first.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      localStorage.setItem('vero-author-name', authorName);
      localStorage.setItem('vero-author-avatar', authorAvatarUrl);
    } catch {
      /* ignore */
    }

    const res = await fetch('/admin/api/save', {
      method: 'POST',
      credentials: 'same-origin',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: post?.id ?? 'new',
        title: title.trim(),
        content: editor.document,
        status,
        publishDate,
        authorName: authorName.trim() || null,
        authorAvatarUrl: authorAvatarUrl || null,
      }),
    });

    if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
      setError('Your admin session expired. Log in again, then save the post.');
      setSaving(false);
      return;
    }

    const contentType = res.headers.get('Content-Type') ?? '';
    const data = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
    if (!res.ok) {
      setError(data.error || `Save failed (${res.status}).`);
      setSaving(false);
      return;
    }
    window.location.href = '/admin';
  }

  return (
    <div className="post-editor">
      {error && <div className="post-editor-error">{error}</div>}

      <input
        className="admin-input post-editor-title"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="post-editor-meta">
        <div className="admin-field">
          <label>Author name</label>
          <input
            className="admin-input"
            value={authorName}
            placeholder={defaultAuthorEmail}
            onChange={(e) => setAuthorName(e.target.value)}
          />
        </div>
        <div className="admin-field">
          <label>Author avatar</label>
          <div className="post-editor-avatar">
            {authorAvatarUrl && <img src={authorAvatarUrl} alt="" />}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])}
            />
          </div>
        </div>
        <div className="admin-field">
          <label>Publish date</label>
          <input
            className="admin-input"
            type="date"
            value={publishDate}
            onChange={(e) => setPublishDate(e.target.value)}
          />
        </div>
      </div>

      <div className="post-editor-body">
        <BlockNoteView editor={editor} />
      </div>

      <div className="post-editor-actions">
        <button className="admin-btn admin-btn--ghost" disabled={saving} onClick={() => save('draft')}>
          Save draft
        </button>
        <button className="admin-btn" disabled={saving} onClick={() => save('published')}>
          {saving ? 'Saving…' : post?.status === 'published' ? 'Update' : 'Publish'}
        </button>
      </div>

      <style>{`
        .post-editor-title {
          font-size: 1.6rem;
          font-weight: 700;
          font-family: 'Quicksand', sans-serif;
          margin-bottom: 16px;
        }
        .post-editor-meta {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .post-editor-avatar { display: flex; align-items: center; gap: 10px; }
        .post-editor-avatar img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; }
        .post-editor-body {
          background: #fff;
          border: 1px solid rgba(0, 81, 73, 0.12);
          border-radius: 12px;
          padding: 14px 6px;
          min-height: 360px;
        }
        .post-editor-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
        .post-editor-error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
          border-radius: 10px;
          padding: 10px 14px;
          margin-bottom: 14px;
          font-size: 0.9rem;
        }
        @media (max-width: 640px) {
          .post-editor-meta { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
