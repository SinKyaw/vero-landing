# Vero Landing Page

A static HTML/CSS landing page for the Vero financial‑wellness app.

## Tech Stack
- HTML5
- CSS3 (plain stylesheet)
- No JavaScript framework (pure HTML/CSS)

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
├── affiliate.html
├── privacy-policy.html
├── terms.html
├── style.css           # Main stylesheet
├── assets/
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

## Blog Images And Supabase Storage
Blog images uploaded in the admin editor are stored in the Supabase Storage
bucket called `blog-images`. On the Supabase Free plan, file storage is limited,
so keep blog images web-sized before uploading.

Practical guidance:
- Prefer compressed `.jpg`/`.webp` images for photos.
- Keep most blog images under about `500 KB` where possible.
- Avoid uploading original phone/camera images directly if they are multiple MB.
- The editor currently rejects images over `5 MB`.
- The first image in a post becomes the blog listing thumbnail.

To check or clean up image usage, open Supabase, then go to:

`Storage` -> `blog-images`

Delete unused uploads there if storage starts creeping up. The main things to
watch on the Free plan are total Storage size and bandwidth/egress from heavily
viewed images.

---
