# Vero Landing Page

A static HTML/CSS landing page for the Vero financial‑wellness app.

## Tech Stack
- HTML5 and plain CSS, no build step
- Home page motion: GSAP 3.12.5 + ScrollTrigger and Lenis 1.1.13 (smooth scroll), loaded from CDN.
  The page works without them, and they are skipped for `prefers-reduced-motion`.

## How to run locally

### Option 1: Open directly
Double‑click `index.html` (or right‑click → “Open with” → your browser).

### Option 2: Local static server (recommended)
You can use any static file server. Examples:

#### With Python
```bash
# From the repository root
python -m http.server 8000   # Python 3
# or: python -m SimpleHTTPServer 8000  # Python 2
```
Then visit <http://localhost:8000>.

#### With Node.js / npx
```bash
npx serve -l 8000
```
Visit <http://localhost:8000>.

#### With VS Code Live Server
Install the "Live Server" extension, then click **Go Live** while `index.html` is open.

## Project structure
```
vero-landing/
├── index.html          # Home page
├── about-us.html
├── feedback.html       # Community feedback board (mock UI, sample data)
├── verdi-companion.html
├── privacy-policy.html
├── terms.html          # Terms, Privacy and Verdi's page hide the site nav/footer
│                       # inside the app's web view (or with ?embed=app)
├── affiliate-v1.html   # Legacy page, still on style.css
├── api/                # Vercel functions: the server-rendered blog (see "Blog" below)
│   ├── blog-index.js   # /blog
│   ├── blog-post.js    # /blog/:slug
│   ├── sitemap.js      # /sitemap.xml
│   └── _lib/           # serialize.js (Plate JSON → HTML), layout.js + template.html (page shell), api.js
├── vercel.json         # Clean URLs, blog rewrites, old post.html redirects
├── robots.txt
├── style.css           # Legacy stylesheet (affiliate-v1 only)
├── assets/
│   ├── css/
│   │   ├── vero-ui.css  # Web port of the Vero design system (tokens, AppButton, …)
│   │   ├── site.css     # Shared chrome: nav, page hero, CTA, testimonials, footer, dialogs
│   │   ├── home.css     # Home page sections and app-screen mockups
│   │   ├── pages.css    # About, Blog, Legal, Meet Verdi
│   │   └── feedback.css # Feedback board
│   ├── js/
│   │   ├── site.js      # Shared: nav, dialogs, smooth scroll, reveals, pointer parallax
│   │   ├── home.js      # Home: app screens, tabs, FAQ, hero motion
│   │   ├── legal.js     # "On this page" contents for legal pages
│   │   └── feedback.js  # Feedback board (local preview sign-in)
│   ├── home/           # Optimised webp art for the home page
│   ├── companion/      # Images for Meet Verdi
│   ├── appstore-download.png
│   ├── favicon.ico
│   ├── logo-primary.png
│   ├── vero-streak.png
│   ├── vero-token.png
│   └── vero-xp.png
├── content/            # Downloadable PDFs and text files
│   ├── about-us.pdf
│   ├── Base.pdf
│   ├── privacy-policy.txt
│   ├── terms.txt
│   └── vero-web-context.pdf
├── .gitignore
├── .editorconfig
├── package.json        # npm scripts (lint, format, start)
├── .stylelintrc.json   # Stylelint config
└── .prettierrc.json    # Prettier config
```

## Linting & Formatting
The repo includes basic linting and formatting tools:

```bash
# Install dev dependencies (run once)
npm install

# Lint CSS and HTML
npm run lint

# Format HTML, CSS, and JSON with Prettier
npm run format
```

Scripts defined in `package.json`:
- `start`: runs a local server via `serve` (port 3000 by default)
- `lint`: runs `stylelint` on CSS and `htmlhint` on HTML
- `format`: runs `prettier --write` on HTML, CSS, JSON, and Markdown

## License
This project is provided as‑is. Feel free to use it as a reference or template.

---

## Blog

Posts are written in vero-admin (`/dashboard/blog`, Plate editor) and stored in vero-backend.
`/blog`, `/blog/:slug` and `/sitemap.xml` are Vercel functions (`api/`) that fetch the public
blog API and return complete HTML, so search engines get the text, title, canonical and
JSON-LD without running JavaScript. The CDN caches each page for 5 minutes
(`s-maxage=300, stale-while-revalidate`), so a publish shows up within about 5 minutes.

- **Env var:** `VERO_API_BASE_URL` = the backend origin including `/api` (set in Vercel).
- **Page shell:** `api/_lib/template.html` carries its own nav and footer. Change them there
  too when you change the other pages.
- **New editor block?** Add it to `api/_lib/serialize.js`, or it renders as plain text.
- **Post pages** also load `assets/js/post.js`: reading-progress bar, the "On this page" index
  (built from the post's H2/H3s) and click-to-play YouTube.
- **Local:** `npx vercel dev --listen 3200` with `VERO_API_BASE_URL` pointing at a local backend.
  A plain static server (`npx serve`) shows the static pages only.

