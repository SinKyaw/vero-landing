/* Blog post pages (server-rendered by api/blog-post.js):
   - the reading-progress bar along the top of the screen
   - the "On this page" index: marks the section being read
   - YouTube blocks: swap the thumbnail for the player only when the reader presses play */
(() => {
  'use strict';

  const doc = document;
  const article = doc.querySelector('[data-post-body]');
  if (!article) return;

  const bar = doc.querySelector('[data-read-progress]');
  const tocLinks = Array.from(doc.querySelectorAll('[data-post-toc] a'));
  const headings = tocLinks.map((a) => doc.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  const navHeight = () => parseFloat(getComputedStyle(doc.documentElement).getPropertyValue('--nav-h')) || 72;

  let current = null;
  let queued = false;

  const update = () => {
    queued = false;
    const y = window.scrollY;
    const top = article.getBoundingClientRect().top + y;

    // 0 when the article starts at the top of the screen, 1 when its end reaches the bottom.
    if (bar) {
      const start = top - navHeight();
      const end = top + article.offsetHeight - window.innerHeight;
      const progress = end <= start ? (y >= start ? 1 : 0) : Math.min(1, Math.max(0, (y - start) / (end - start)));
      bar.style.transform = `scaleX(${progress})`;
    }

    // The section being read is the last heading that has passed under the nav.
    if (headings.length) {
      const line = navHeight() + 96;
      let active = null;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= line) active = h;
        else break;
      }
      if (active !== current) {
        current = active;
        tocLinks.forEach((a) => {
          if (active && a.hash === `#${active.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      }
    }
  };

  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('load', queue);
  update();

  // Click-to-play video: no YouTube request (or cookie) until the reader asks for it.
  doc.addEventListener('click', (e) => {
    const poster = e.target.closest('.post-video__poster');
    if (!poster || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const figure = poster.closest('[data-video]');
    const id = figure && figure.getAttribute('data-video');
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return;
    e.preventDefault();
    const frame = doc.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    frame.title = poster.getAttribute('aria-label') || 'Video';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.allowFullscreen = true;
    poster.replaceWith(frame);
    frame.focus();
  });
})();
