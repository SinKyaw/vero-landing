/* Legal pages — builds the "On this page" list from the section headings and
   marks the section being read. Links glide via site.js. */
(() => {
  'use strict';

  const doc = document;
  const body = doc.querySelector('[data-legal]');
  const list = doc.querySelector('[data-toc]');
  if (!body || !list) return;

  const slug = (s) => s.toLowerCase().replace(/&amp;|&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const used = new Set();
  const headings = Array.from(body.querySelectorAll('.legal-section-heading'));

  headings.forEach((h) => {
    const section = h.closest('.legal-section, .legal-contact-card') || h;
    let id = slug(h.textContent.replace(/^\d+\.\s*/, '')) || 'section';
    while (used.has(id)) id += '-2';
    used.add(id);
    section.id = id;

    const li = doc.createElement('li');
    const a = doc.createElement('a');
    a.href = `#${id}`;
    a.textContent = h.textContent.trim();
    li.appendChild(a);
    list.appendChild(li);
  });

  const links = Array.from(list.querySelectorAll('a'));
  if (!('IntersectionObserver' in window)) return;
  const sections = links.map((a) => doc.getElementById(a.hash.slice(1)));
  const visible = new Map();
  const mark = () => {
    let current = null;
    sections.forEach((s) => { if (visible.get(s)) current = current || s; });
    if (!current) return;
    links.forEach((a) => {
      const on = a.hash === `#${current.id}`;
      if (on) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    const active = list.querySelector('[aria-current="true"]');
    const toc = list.closest('.legal__toc');
    if (active && toc && toc.scrollHeight > toc.clientHeight) {
      const top = active.offsetTop - toc.clientHeight / 2;
      toc.scrollTo({ top, behavior: 'smooth' });
    }
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => visible.set(e.target, e.isIntersecting));
    mark();
  }, { rootMargin: '-20% 0px -60% 0px' });
  sections.forEach((s) => io.observe(s));
})();
