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
