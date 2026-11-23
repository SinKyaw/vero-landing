/*
 * Reads the public blog API on vero-backend (`src/modules/blog/domains/public-blog`).
 * VERO_API_BASE_URL is the backend origin including its `/api` prefix,
 * e.g. https://<backend-host>/api. Set it in the Vercel project's environment variables.
 */

const TIMEOUT_MS = 8000;

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** GET a path and unwrap the backend's `{ success, message }` envelope. 404 → null. */
export const getJson = async (path) => {
  const base = (process.env.VERO_API_BASE_URL || '').replace(/\/+$/, '');
  if (!base) throw new ApiError(500, 'VERO_API_BASE_URL is not set');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (res.status === 404) return null;
    if (!res.ok) throw new ApiError(res.status, `Backend ${res.status} for ${path}`);
    const body = await res.json();
    return body?.message;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(503, `Backend unreachable for ${path}: ${err?.message || err}`);
  } finally {
    clearTimeout(timer);
  }
};
