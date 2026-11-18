/* Vero site — shared behaviour for every page.
   Nav, dialogs, smooth scroll (Lenis), scroll reveals (GSAP + ScrollTrigger),
   pointer parallax and the final CTA panel. Core UI works without the
   animation libraries; motion is skipped for prefers-reduced-motion.
   Page scripts (home.js, feedback.js) run after this and use window.vero. */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const $ = (sel, ctx = doc) => ctx.querySelector(sel);
  const $$ = (sel, ctx = doc) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const motion = hasGSAP && !reduceMotion;
  if (motion) window.__veroMotion = true;

  const vero = { $, $$, reduceMotion, finePointer, motion, lenis: null };
  window.vero = vero;
  const navHeight = () => parseFloat(getComputedStyle(root).getPropertyValue('--nav-h')) || 72;

  /* ── Navigation ── */
  const nav = $('[data-nav]');
  const burger = nav && $('.site-nav__burger', nav);
  const toggleMenu = (open) => {
    if (!nav || !burger) return;
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  if (nav) {
    const setScrolled = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
    setScrolled();
    window.addEventListener('scroll', setScrolled, { passive: true });
    if (burger) burger.addEventListener('click', () => toggleMenu(!nav.classList.contains('is-open')));
    $$('.site-nav__links a', nav).forEach((a) => a.addEventListener('click', () => toggleMenu(false)));
    doc.addEventListener('click', (e) => {
      if (nav.classList.contains('is-open') && !nav.contains(e.target)) toggleMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 900 && nav.classList.contains('is-open')) toggleMenu(false);
    });
  }

  /* ── Dialogs (stackable, focus-trapped, Escape closes the top one) ── */
  const stack = [];
  const focusables = (el) => $$('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])', el)
    .filter((n) => n.offsetParent !== null || n === doc.activeElement);

  const openDialog = (dialog, opener = doc.activeElement) => {
    if (!dialog || dialog.classList.contains('is-open')) return;
    dialog._opener = opener;
    dialog.inert = false;
    dialog.setAttribute('aria-hidden', 'false');
    dialog.classList.add('is-open');
    stack.push(dialog);
    root.classList.add('modal-open');
    if (vero.lenis) vero.lenis.stop();
    toggleMenu(false);
    const first = $('[data-autofocus]', dialog) || $('.modal__close', dialog) || focusables(dialog)[0];
    if (first) requestAnimationFrame(() => first.focus({ preventScroll: true }));
    dialog.dispatchEvent(new CustomEvent('dialog:open'));
  };
  const closeDialog = (dialog) => {
    if (!dialog || !dialog.classList.contains('is-open')) return;
    dialog.classList.remove('is-open');
    dialog.setAttribute('aria-hidden', 'true');
    dialog.inert = true;
    stack.splice(stack.indexOf(dialog), 1);
    if (!stack.length) {
      root.classList.remove('modal-open');
      if (vero.lenis) vero.lenis.start();
    }
    const back = dialog._opener;
    if (back && doc.contains(back) && typeof back.focus === 'function') back.focus({ preventScroll: true });
    dialog.dispatchEvent(new CustomEvent('dialog:close'));
  };
  vero.openDialog = openDialog;
  vero.closeDialog = closeDialog;

  // Placeholder links (href="#", e.g. partners awaiting a URL) go nowhere
  doc.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#"]');
    if (a) e.preventDefault();
  });

  doc.addEventListener('click', (e) => {
    const download = e.target.closest('.js-download-choice');
    const opener = download || e.target.closest('[data-dialog-open]');
    if (opener) {
      const dialog = doc.getElementById(download ? 'download-options' : opener.dataset.dialogOpen);
      if (dialog) { e.preventDefault(); openDialog(dialog, opener); }
      return;
    }
    const closer = e.target.closest('[data-dialog-close]');
    if (closer) closeDialog(closer.closest('.modal'));
  });

  doc.addEventListener('keydown', (e) => {
    const top = stack[stack.length - 1];
    if (e.key === 'Escape') {
      if (top) { e.preventDefault(); closeDialog(top); }
      else if (nav && nav.classList.contains('is-open')) { toggleMenu(false); burger.focus(); }
    }
    if (e.key === 'Tab' && top) {
      const items = focusables(top);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (doc.activeElement === first || !top.contains(doc.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (doc.activeElement === last || !top.contains(doc.activeElement))) { e.preventDefault(); first.focus(); }
    }
  });

  /* ── Pointer delights (fine pointers only) ── */
  if (finePointer && !reduceMotion) {
    // Stickers drift a little with the pointer. Nothing moves on its own.
    $$('[data-parallax]').forEach((area) => {
      const items = $$('[data-depth]', area).map((el) => ({ el, d: parseFloat(el.dataset.depth) || 0.4 }));
      if (!items.length) return;
      const range = parseFloat(area.dataset.parallax) || 1;
      const target = { x: 0, y: 0 };
      const state = { x: 0, y: 0 };
      let raf = 0;
      const frame = () => {
        state.x += (target.x - state.x) * 0.08;
        state.y += (target.y - state.y) * 0.08;
        items.forEach(({ el, d }) => {
          el.style.translate = `${(state.x * d * 34 * range).toFixed(2)}px ${(state.y * d * 26 * range).toFixed(2)}px`;
        });
        const settled = Math.abs(target.x - state.x) < 0.001 && Math.abs(target.y - state.y) < 0.001;
        raf = settled ? 0 : requestAnimationFrame(frame);
      };
      const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
      area.addEventListener('pointermove', (e) => {
        const r = area.getBoundingClientRect();
        target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
        kick();
      });
      area.addEventListener('pointerleave', () => { target.x = 0; target.y = 0; kick(); });
    });

    // Cards tilt toward the cursor
    $$('[data-tilt]').forEach((card) => {
      const face = $('figure', card) || card;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        face.style.setProperty('--ry', `${(x * 10).toFixed(2)}deg`);
        face.style.setProperty('--rx', `${(-y * 8).toFixed(2)}deg`);
      });
      card.addEventListener('pointerleave', () => {
        face.style.setProperty('--ry', '0deg');
        face.style.setProperty('--rx', '0deg');
      });
    });

    // Confetti burst from a CTA button on hover
    const colors = ['#5DD5C8', '#F9C440', '#F2B1AE', '#A8C4EE', '#50E3C2', '#FFFFFF'];
    let lastBurst = 0;
    $$('[data-confetti]').forEach((btn) => {
      btn.addEventListener('pointerenter', () => {
        const now = performance.now();
        if (now - lastBurst < 1200 || !Element.prototype.animate) return;
        lastBurst = now;
        const r = btn.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        for (let i = 0; i < 18; i += 1) {
          const p = doc.createElement('span');
          p.className = 'burst';
          p.style.left = `${cx}px`;
          p.style.top = `${cy}px`;
          p.style.background = colors[i % colors.length];
          if (i % 3 === 0) { p.style.width = '9px'; p.style.height = '9px'; p.style.borderRadius = '50%'; }
          doc.body.appendChild(p);
          const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
          const dist = 70 + Math.random() * 90;
          const dx = Math.cos(angle) * dist;
          const dy = Math.sin(angle) * dist * 0.7 - 30;
          const spin = (Math.random() - 0.5) * 720;
          p.animate(
            [
              { transform: 'translate(-50%, -50%) rotate(0deg)', opacity: 1 },
              { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${spin}deg)`, opacity: 1, offset: 0.7 },
              { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + 40}px)) rotate(${spin * 1.2}deg)`, opacity: 0 },
            ],
            { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(0.33, 1, 0.68, 1)' },
          ).onfinish = () => p.remove();
        }
      });
    });
  }

  /* ── Motion layer ── */
  if (!motion) {
    root.classList.remove('js-anim');
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' }); // the app's out-cubic family, never a bounce
  vero.gsap = gsap;

  // Smooth scroll
  if (window.Lenis) {
    vero.lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    vero.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => vero.lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Links to a spot on this page glide there (and move focus for keyboard users)
  const samePage = (a) => {
    const strip = (p) => p.replace(/index\.html$/, '');
    return a.origin === location.origin && strip(a.pathname) === strip(location.pathname);
  };
  doc.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a || a.classList.contains('js-download-choice') || a.hasAttribute('data-dialog-open') || !samePage(a)) return;
    const id = a.hash;
    if (!id || id === '#' || id === '#download-options') return;
    const target = id === '#main' ? $('#main') : doc.getElementById(decodeURIComponent(id.slice(1)));
    if (!target) return;
    e.preventDefault();
    const done = () => {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };
    if (vero.lenis) vero.lenis.scrollTo(id === '#main' ? 0 : target, { offset: -(navHeight() + 12), duration: 1.3, onComplete: done });
    else { target.scrollIntoView({ behavior: 'smooth' }); done(); }
    history.replaceState(null, '', id);
  });

  /* Page hero intro (pages other than home) */
  if ($('.page-hero')) {
    gsap.timeline({ delay: 0.1, onComplete: () => root.classList.remove('js-anim') })
      .fromTo('.page-hero .line__in', { y: 0, yPercent: 108 }, { yPercent: 0, duration: 1, stagger: 0.1 })
      .fromTo('[data-page-in]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, '-=0.6')
      .fromTo('.page-hero .floaters', { opacity: 0 }, { opacity: 1, duration: 0.9 }, '-=0.8');
  } else if (!$('[data-intro]')) {
    root.classList.remove('js-anim');
  }

  /* Generic reveals */
  gsap.set('[data-reveal]', { opacity: 0, y: 32 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, overwrite: true }),
  });
  $$('[data-stagger]').forEach((group) => {
    gsap.fromTo(group.children, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, duration: 0.9, stagger: 0.1, clearProps: 'transform',
      scrollTrigger: { trigger: group, start: 'top 86%', once: true },
    });
  });

  // Highlighter markers sweep in once
  $$('.marker[data-sweep]').forEach((m) => {
    gsap.fromTo(m, { '--mk': 0 }, {
      '--mk': 1, duration: 0.8, ease: 'power3.inOut',
      scrollTrigger: { trigger: m, start: 'top 82%', once: true },
    });
  });

  // Numbers count up once, keeping their prefix/suffix
  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const counter = { v: 0 };
    gsap.to(counter, {
      v: end, duration: 1.4, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      onUpdate: () => { el.textContent = `${Math.round(counter.v)}${suffix}`; },
    });
  });

  /* Final CTA: the panel opens up as it arrives, then the copy and Verdi follow */
  const ctaPanel = $('.cta__panel');
  if (ctaPanel) {
    const ctaRadius = () => getComputedStyle(ctaPanel).borderTopLeftRadius || '40px';
    gsap.fromTo(ctaPanel, { clipPath: () => `inset(7% 5% 7% 5% round ${ctaRadius()})` }, {
      clipPath: () => `inset(0% 0% 0% 0% round ${ctaRadius()})`, ease: 'none', invalidateOnRefresh: true,
      scrollTrigger: { trigger: '.cta', start: 'top 92%', end: 'top 40%', scrub: 0.6 },
    });
    gsap.timeline({ scrollTrigger: { trigger: ctaPanel, start: 'top 70%', once: true } })
      .fromTo('.cta__title .line__in', { y: 0, yPercent: 108 }, { yPercent: 0, duration: 1, stagger: 0.12 })
      .fromTo('[data-cta-in]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, '-=0.7')
      .fromTo('.cta__art', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1.1 }, '-=1');
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
