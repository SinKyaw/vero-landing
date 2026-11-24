/* Guides: comparison tables get an expand button. It opens the full table in a popup card over a
   tinted screen; the cross, the tint or Esc closes it. Without JS the table just scrolls as before. */
(() => {
  'use strict';

  const doc = document;
  const wraps = Array.from(doc.querySelectorAll('.g-table-wrap'));
  if (!wraps.length || typeof HTMLDialogElement === 'undefined') return;

  const icon = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" /></svg>`;
  const EXPAND = icon('M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7');
  const CLOSE = icon('M6 6l12 12M18 6L6 18');

  let dialog = null;
  let opener = null;

  const build = () => {
    dialog = doc.createElement('dialog');
    dialog.className = 'g-modal';
    dialog.innerHTML =
      '<div class="g-modal__card">' +
      '<div class="g-modal__bar"><p class="g-modal__title"></p>' +
      `<button type="button" class="g-modal__close" aria-label="Close table">${CLOSE}</button></div>` +
      '<div class="g-modal__body"></div></div>';
    doc.body.appendChild(dialog);
    // A click on the tint (the dialog itself, outside the card) or on the cross closes it.
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target.closest('.g-modal__close')) dialog.close();
    });
    dialog.addEventListener('close', () => {
      doc.documentElement.classList.remove('g-modal-open');
      if (opener) opener.focus({ preventScroll: true });
      opener = null;
    });
  };

  const open = (wrap, btn) => {
    if (!dialog) build();
    const table = wrap.querySelector('table').cloneNode(true);
    table.style.removeProperty('--tmin');
    const caption = table.querySelector('caption');
    dialog.querySelector('.g-modal__title').textContent = caption ? caption.textContent : '';
    if (caption) caption.remove();
    dialog.querySelector('.g-modal__body').replaceChildren(table);
    opener = btn;
    doc.documentElement.classList.add('g-modal-open');
    dialog.showModal();
  };

  wraps.forEach((wrap) => {
    const box = doc.createElement('div');
    box.className = 'g-table-box';
    const bar = doc.createElement('div');
    bar.className = 'g-table-tools';
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.className = 'g-table-expand';
    btn.setAttribute('aria-label', 'Expand table');
    btn.title = 'Expand table';
    btn.innerHTML = EXPAND;
    btn.addEventListener('click', () => open(wrap, btn));
    bar.appendChild(btn);
    wrap.replaceWith(box);
    box.append(bar, wrap);
  });
})();

/* Guides (/guides, /vs/*, the evergreen guides): illustrations play once.
   Each .illo gets .is-in the first time it scrolls into view, then it is left
   alone, so nothing moves while someone is reading. The hidden start state
   only applies under html.g-anim, which this script adds, so without JS or
   with reduced motion every illustration is simply shown. */
(() => {
  'use strict';

  const doc = document;
  const illos = Array.from(doc.querySelectorAll('.illo'));
  if (!illos.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  // Anything already on screen when the page opens shows straight away.
  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  };
  const pending = illos.filter((el) => !onScreen(el));
  if (!pending.length) return;

  doc.documentElement.classList.add('g-anim');

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.3, rootMargin: '0px 0px -8% 0px' }
  );

  illos.forEach((el) => {
    if (pending.includes(el)) io.observe(el);
    else el.classList.add('is-in');
  });
})();
