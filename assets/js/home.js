/* Vero home — page-specific interactions and motion.
   Runs after site.js (nav, dialogs, smooth scroll, reveals, CTA panel).
   Core UI (app screens, tabs, accordion) works without the animation libraries. */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const { $, $$, reduceMotion, finePointer, motion } = window.vero;

  /* ── App screens: clone each template into its phone ── */
  $$('[data-screen]').forEach((slot) => {
    const tpl = doc.getElementById(`tpl-${slot.dataset.screen}`);
    if (tpl) slot.appendChild(tpl.content.cloneNode(true));
  });

  /* ── How it works: tabs ── */
  const tablist = $('[data-tabs]');
  if (tablist) {
    const tabs = $$('[role="tab"]', tablist);
    const panels = tabs.map((t) => doc.getElementById(t.getAttribute('aria-controls')));
    let current = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');

    const keepTabInView = (tab) => {
      if (tablist.scrollWidth <= tablist.clientWidth) return;
      const left = tab.offsetLeft - parseFloat(getComputedStyle(tablist).paddingLeft || 0);
      tablist.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    };

    const select = (index, { focus = false } = {}) => {
      if (index === current) { if (focus) tabs[index].focus(); return; }
      tabs.forEach((tab, i) => {
        const on = i === index;
        tab.setAttribute('aria-selected', String(on));
        tab.tabIndex = on ? 0 : -1;
      });
      panels.forEach((panel, i) => {
        const on = i === index;
        panel.classList.toggle('is-active', on);
        panel.setAttribute('aria-hidden', String(!on));
        panel.inert = !on;
      });
      current = index;
      if (focus) tabs[index].focus({ preventScroll: true });
      keepTabInView(tabs[index]);
    };

    panels.forEach((panel, i) => {
      panel.setAttribute('aria-hidden', String(i !== current));
      panel.inert = i !== current;
    });

    tabs.forEach((tab, i) => {
      tab.addEventListener('click', () => select(i));
      tab.addEventListener('keydown', (e) => {
        const last = tabs.length - 1;
        let next = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = last;
        if (next !== null) { e.preventDefault(); select(next, { focus: true }); }
      });
    });

    $$('[data-next-tab]').forEach((btn) => {
      btn.addEventListener('click', () => select(Math.min(current + 1, tabs.length - 1), { focus: true }));
    });
  }

  /* ── FAQ accordion (single open) ── */
  const faqItems = $$('.faq-item');
  let refreshTimer = null;
  const setOpen = (item, open) => {
    const btn = $('.faq-item__q', item);
    const panel = $('.faq-item__a', item);
    item.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    panel.inert = !open;
  };
  faqItems.forEach((item, i) => {
    setOpen(item, i === 0);
    $('.faq-item__q', item).addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      faqItems.forEach((other) => { if (other !== item) setOpen(other, false); });
      setOpen(item, willOpen);
      if (motion) {
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => window.ScrollTrigger.refresh(), 360);
      }
    });
  });

  /* ── Pricing spotlight follows the cursor ── */
  if (finePointer && !reduceMotion) {
    $$('[data-spotlight]').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ── Motion layer ── */
  if (!motion) return;
  const { gsap } = window.vero;

  /* Hero intro — plays once; the phones rise in and then stay put */
  gsap.timeline({ delay: 0.1, onComplete: () => root.classList.remove('js-anim') })
    // y: 0 discards the px offset GSAP parses from the CSS start state
    .fromTo('.hero .line__in', { y: 0, yPercent: 108 }, { yPercent: 0, duration: 1.05, stagger: 0.12 })
    .fromTo('.hero .mark__bg', { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'power3.inOut' }, '-=0.55')
    .fromTo('[data-hero-in]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, '-=0.55')
    .fromTo('[data-hero-phone]', { opacity: 0, y: 140 }, { opacity: 1, y: 0, duration: 1.2, stagger: { each: 0.1, from: 'center' } }, '-=0.75')
    .fromTo('.hero__floaters', { opacity: 0 }, { opacity: 1, duration: 0.9 }, '-=1');

  /* Hero on scroll: only the copy drifts and fades; the phone mockups don't move */
  gsap.to('.hero__inner', {
    y: 90, opacity: 0.25, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.6 },
  });

  /* Why Vero */
  gsap.fromTo('.why__ribbon path', { strokeDashoffset: 1 }, {
    strokeDashoffset: 0, ease: 'none', stagger: 0.08,
    scrollTrigger: { trigger: '.why', start: 'top 75%', end: 'center 45%', scrub: 1 },
  });
  gsap.fromTo('.why .marker', { '--mk': 0 }, {
    '--mk': 1, duration: 0.8, ease: 'power3.inOut',
    scrollTrigger: { trigger: '.why .section-head', start: 'top 72%', once: true },
  });
  gsap.fromTo('.why__col--l [data-why-card]', { opacity: 0, x: -48 }, {
    opacity: 1, x: 0, duration: 1, stagger: 0.12, clearProps: 'transform',
    scrollTrigger: { trigger: '.why__grid', start: 'top 78%', once: true },
  });
  gsap.fromTo('.why__col--r [data-why-card]', { opacity: 0, x: 48 }, {
    opacity: 1, x: 0, duration: 1, stagger: 0.12, delay: 0.06, clearProps: 'transform',
    scrollTrigger: { trigger: '.why__grid', start: 'top 78%', once: true },
  });
  gsap.fromTo('.why__disc', { scale: 0.82, opacity: 0 }, {
    scale: 1, opacity: 1, duration: 1.1,
    scrollTrigger: { trigger: '.why__hero', start: 'top 80%', once: true },
  });
  gsap.fromTo('.why__verdi', { y: 60, opacity: 0 }, {
    y: 0, opacity: 1, duration: 1.1, delay: 0.1,
    scrollTrigger: { trigger: '.why__hero', start: 'top 80%', once: true },
  });
  $$('.why__hero [data-speed]').forEach((el) => {
    gsap.fromTo(el, { y: () => -parseFloat(el.dataset.speed) * 260 }, {
      y: () => parseFloat(el.dataset.speed) * 260, ease: 'none',
      scrollTrigger: { trigger: '.why__hero', start: 'top bottom', end: 'bottom top', scrub: 0.8, invalidateOnRefresh: true },
    });
  });

  /* How it works: tab cards rise in */
  gsap.fromTo('.steps .step-tab', { opacity: 0, y: 28 }, {
    opacity: 1, y: 0, duration: 0.8, stagger: 0.08, clearProps: 'transform',
    scrollTrigger: { trigger: '.steps', start: 'top 86%', once: true },
  });
})();
