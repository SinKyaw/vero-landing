/* Vero feedback board — mock UI.
   Anyone can read posts and comments. Posting, voting and commenting need an
   account; sign-in here is a local preview (nothing leaves the page) so the
   whole flow can be reviewed before accounts are connected. */
(() => {
  'use strict';

  const doc = document;
  const { $, $$, openDialog, closeDialog } = window.vero;

  /* ── Sample data ── */
  const CATS = {
    idea: { label: 'Idea', icon: 'i-bulb' },
    issue: { label: 'Issue', icon: 'i-bug' },
    question: { label: 'Question', icon: 'i-help' },
    praise: { label: 'Praise', icon: 'i-heart' },
  };
  const STATUS = { open: 'Open', review: 'Under review', planned: 'Planned', progress: 'In progress', done: 'Done' };
  const COLORS = ['#005149', '#1F8075', '#3D6FB0', '#A0527A', '#9A6A12', '#5A4FA0'];

  // ago = hours since posting
  let posts = [
    {
      id: 'p1', cat: 'idea', status: 'review', votes: 214, ago: 30, author: 'Maya K.',
      title: 'A home screen widget for my safe-to-spend number',
      body: 'I open Vero mostly to check what I can spend today. A small widget on my home screen with the safe-to-spend number (and maybe my streak) would save me a few taps every day.\n\nBonus points if Verdi is on it.',
      reply: 'Love this. Widgets are being looked at for both iPhone and Android, starting with safe-to-spend and your streak. We’ll update this post when there’s news.',
      comments: [
        { author: 'Tom R.', ago: 26, text: 'Yes please. A lock screen one would be even better.' },
        { author: 'Priya S.', ago: 20, text: 'Seconding the streak on it, it would keep me honest.' },
      ],
    },
    {
      id: 'p2', cat: 'issue', status: 'progress', votes: 96, ago: 12, author: 'Josh T.',
      title: 'My streak reset after I flew to a different time zone',
      body: 'Flew from London to Bangkok and logged on both days, but my 23-day streak went back to zero when I landed. I think the day boundary moved under me.\n\nSteps: log a spend, change time zone forward, log again the next local morning.',
      reply: 'Thanks for the clear steps, Josh. We can reproduce it and a fix is in progress. Your streak will be restored once it ships.',
      comments: [
        { author: 'Lena M.', ago: 9, text: 'Same thing happened to me going to New York.' },
        { team: true, author: 'Vero team', ago: 6, text: 'If this happened to you too, reply here with roughly when, and we’ll make sure your streak comes back.' },
      ],
    },
    {
      id: 'p3', cat: 'idea', status: 'open', votes: 163, ago: 72, author: 'Aisha B.',
      title: 'Dark mode, please',
      body: 'I log most of my spending late at night and the bright mint is a lot at 1am. A dark theme (that keeps Verdi cute) would be amazing.',
      comments: [
        { author: 'Chris D.', ago: 60, text: 'Following. Even an automatic one that follows the phone setting.' },
      ],
    },
    {
      id: 'p4', cat: 'question', status: 'done', votes: 41, ago: 50, author: 'Ben W.',
      title: 'Does auto-tracking work with my bank’s notifications?',
      body: 'I’m thinking about Vero Plus mostly for automated logging. Does it work with any bank, or only some?',
      reply: 'Automated logging reads your payment notifications, so it works with any bank app that sends them, as long as notifications stay on. On iPhone you set it up once in Shortcuts; on Android you allow it in the Vero app. No open banking needed.',
      comments: [
        { author: 'Ben W.', ago: 44, text: 'Perfect, thank you! Set up in two minutes.' },
      ],
    },
    {
      id: 'p5', cat: 'idea', status: 'planned', votes: 128, ago: 120, author: 'Sofia L.',
      title: 'A weekly view next to the monthly plan',
      body: 'I get paid monthly but I think in weeks. It would help to see how much of this week’s share I have left, alongside the monthly plan.',
      reply: 'This is planned. We’re designing a weekly breakdown that sits inside your monthly plan, so nothing about your pockets changes.',
      comments: [],
    },
    {
      id: 'p6', cat: 'praise', status: 'open', votes: 77, ago: 8, author: 'Hannah P.',
      title: 'Verdi’s trips got me through exam season',
      body: 'Logging every coffee during revision felt pointless until I started sending Verdi on trips. I saved enough on gift card discounts to cover a night out after my last exam. Thank you!',
      comments: [
        { team: true, author: 'Vero team', ago: 5, text: 'This made our day. Congrats on finishing exams, Hannah! 🐘' },
      ],
    },
    {
      id: 'p7', cat: 'issue', status: 'open', votes: 34, ago: 5, author: 'Daniel O.',
      title: 'Voice logging hears “fifteen” as “fifty”',
      body: 'When I say “coffee fifteen” it sometimes logs £50 instead of £15. I catch it most of the time, but not always.',
      comments: [],
    },
    {
      id: 'p8', cat: 'idea', status: 'review', votes: 88, ago: 200, author: 'Rachel N.',
      title: 'More grocery brands in Verdi’s rewards',
      body: 'Grocery discounts are the rewards I actually use. More supermarket options would make every trip feel worth it.',
      comments: [
        { author: 'Elly G.', ago: 180, text: 'Grocery vouchers are my favourite too.' },
        { author: 'Sam K.', ago: 150, text: 'Would love a discount for the big weekly shop.' },
      ],
    },
    {
      id: 'p9', cat: 'question', status: 'done', votes: 22, ago: 300, author: 'Oliver J.',
      title: 'Can I export my spending as a CSV?',
      body: 'I want to pull my spending into a spreadsheet at the end of the year. Is that possible?',
      reply: 'Yes. CSV export is part of Vero Plus, along with custom categories. You’ll find it in Settings.',
      comments: [],
    },
  ];

  /* ── State ── */
  const state = { cat: 'all', status: 'all', sort: 'trending', q: '', user: null, voted: new Set(), pending: null, openId: null };
  try {
    const saved = JSON.parse(sessionStorage.getItem('vero-feedback-preview') || 'null');
    if (saved && saved.user) { state.user = saved.user; state.voted = new Set(saved.voted || []); }
  } catch { /* storage unavailable: stay signed out */ }
  const persist = () => {
    try {
      if (state.user) sessionStorage.setItem('vero-feedback-preview', JSON.stringify({ user: state.user, voted: [...state.voted] }));
      else sessionStorage.removeItem('vero-feedback-preview');
    } catch { /* ignore */ }
  };

  /* ── Helpers ── */
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ago = (h) => {
    if (h < 1) return 'Just now';
    if (h < 24) return `${Math.round(h)}h ago`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
    const w = Math.round(d / 7);
    return `${w} week${w === 1 ? '' : 's'} ago`;
  };
  const colorFor = (name) => COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const avatar = (name, team, lg) => (team
    ? `<span class="avatar avatar--team${lg ? ' avatar--lg' : ''}" aria-hidden="true"><img src="assets/home/sticker-vero.webp" alt="" /></span>`
    : `<span class="avatar${lg ? ' avatar--lg' : ''}" style="--c:${colorFor(name)}" aria-hidden="true">${esc(name.trim()[0] || '?').toUpperCase()}</span>`);
  const icon = (id) => `<svg aria-hidden="true"><use href="#${id}" /></svg>`;
  const catTag = (c) => `<span class="tag tag--${c}">${icon(CATS[c].icon)}${CATS[c].label}</span>`;
  const statusTag = (s) => `<span class="tag status status--${s}">${STATUS[s]}</span>`;
  const voteBtn = (p, lg) => {
    const on = state.voted.has(p.id);
    const n = p.votes + (on ? 1 : 0);
    return `<button class="vote${lg ? ' vote--lg' : ''}" type="button" data-vote="${p.id}" aria-pressed="${on}" aria-label="Upvote: ${n} votes">${icon('i-up')}<span>${n}</span></button>`;
  };
  const appBtn = (label, attrs, variant = '') => `<button class="app-btn${variant}" type="button" ${attrs}><span class="app-btn__face"><span class="app-btn__surface">${label}</span></span></button>`;
  const byId = (id) => posts.find((p) => p.id === id);

  /* ── Toast ── */
  const toastEl = $('[data-toast]');
  let toastTimer = 0;
  const toast = (msg) => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 3200);
  };

  /* ── Account panel ── */
  const accountEl = $('[data-account]');
  const renderAccount = () => {
    if (state.user) {
      accountEl.innerHTML = `
        <p class="fb-panel__h">Your account</p>
        <div class="fb-me">
          ${avatar(state.user.name, false, true)}
          <span><b>${esc(state.user.name)}</b><small>Signed in · preview</small></span>
          <button class="fb-me__out" type="button" data-signout>Sign out</button>
        </div>`;
    } else {
      accountEl.innerHTML = `
        <div class="fb-account">
          <img src="assets/home/verdi-winks.webp" alt="" width="280" height="280" />
          <h3>Join the conversation</h3>
          <p>Reading is open to everyone. Sign in to post, vote and comment.</p>
          <div class="fb-account__actions">
            ${appBtn('Create account', 'data-auth="up"', ' app-btn--block')}
            ${appBtn('Sign in', 'data-auth="in"', ' app-btn--white app-btn--block')}
          </div>
        </div>`;
    }
  };

  /* ── Feed ── */
  const feedEl = $('[data-feed]');
  const emptyEl = $('[data-empty]');
  const resultEl = $('[data-result]');

  const score = (p) => (p.votes + (state.voted.has(p.id) ? 1 : 0) + p.comments.length * 3) / Math.pow(p.ago + 12, 0.55);
  const visible = () => {
    const q = state.q.trim().toLowerCase();
    const list = posts.filter((p) => (state.cat === 'all' || p.cat === state.cat)
      && (state.status === 'all' || p.status === state.status)
      && (!q || `${p.title} ${p.body}`.toLowerCase().includes(q)));
    const votes = (p) => p.votes + (state.voted.has(p.id) ? 1 : 0);
    if (state.sort === 'top') list.sort((a, b) => votes(b) - votes(a));
    else if (state.sort === 'new') list.sort((a, b) => a.ago - b.ago);
    else list.sort((a, b) => score(b) - score(a));
    return list;
  };

  const renderCounts = () => {
    $$('[data-count-for]').forEach((el) => {
      const c = el.dataset.countFor;
      el.textContent = c === 'all' ? posts.length : posts.filter((p) => p.cat === c).length;
    });
  };

  const renderFeed = (newId) => {
    const list = visible();
    feedEl.innerHTML = list.map((p, i) => {
      const team = p.reply || p.comments.some((c) => c.team);
      return `
        <li class="fb-post${p.id === newId ? ' is-new' : ''}" style="animation-delay:${Math.min(i, 8) * 40}ms">
          ${voteBtn(p)}
          <div class="fb-post__body">
            <div class="fb-tags">${catTag(p.cat)}${statusTag(p.status)}</div>
            <h3 class="fb-post__title"><button type="button" data-open="${p.id}">${esc(p.title)}</button></h3>
            <p class="fb-post__excerpt">${esc(p.body.split('\n')[0])}</p>
            <div class="fb-meta">
              <span class="fb-meta__who">${avatar(p.author)}${esc(p.author)}</span>
              <span>${ago(p.ago)}</span>
              <span class="fb-meta__item">${icon('i-chat')}${p.comments.length}<span class="sr-only"> comments</span></span>
              ${team ? '<span class="fb-meta__team"><img src="assets/home/sticker-vero.webp" alt="" />Vero replied</span>' : ''}
            </div>
          </div>
        </li>`;
    }).join('');
    emptyEl.hidden = list.length > 0;
    resultEl.textContent = list.length
      ? `${list.length} post${list.length === 1 ? '' : 's'}${state.q ? ` matching “${state.q.trim()}”` : ''}`
      : '';
    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
  };

  /* ── Detail drawer ── */
  const drawer = $('#post-dialog');
  const detailEl = $('[data-detail]');
  const renderDetail = () => {
    const p = byId(state.openId);
    if (!p) return;
    const composer = state.user
      ? `<form class="comment-form" data-comment-form>
          <div class="field">
            <label for="comment-text">Add a comment as ${esc(state.user.name)}</label>
            <textarea id="comment-text" name="text" rows="3" maxlength="800" placeholder="Share what you think or add details" required></textarea>
          </div>
          <p class="field__error" data-error role="alert"></p>
          <button class="app-btn" type="submit"><span class="app-btn__face"><span class="app-btn__surface">Post comment</span></span></button>
        </form>`
      : `<div class="locked">
          <span class="locked__ico">${icon('i-lock')}</span>
          <b>Sign in to join the conversation</b>
          <p>You can read everything here. To comment or vote, sign in or create a free account.</p>
          <div class="locked__actions">
            ${appBtn('Create account', 'data-auth="up" data-reason="Create an account to comment on this post."')}
            ${appBtn('Sign in', 'data-auth="in" data-reason="Sign in to comment on this post."', ' app-btn--white')}
          </div>
        </div>`;
    detailEl.innerHTML = `
      <div class="fb-tags">${catTag(p.cat)}${statusTag(p.status)}</div>
      <h2 class="fb-detail__title" id="post-title">${esc(p.title)}</h2>
      <div class="fb-detail__who">${avatar(p.author, false, true)}<span><b>${esc(p.author)}</b><small>Posted ${ago(p.ago).toLowerCase()}</small></span></div>
      <div class="fb-detail__text">${esc(p.body)}</div>
      <div class="fb-detail__bar">${voteBtn(p, true)}<span>${p.comments.length} comment${p.comments.length === 1 ? '' : 's'}</span></div>
      ${p.reply ? `<div class="team-reply">
        <div class="team-reply__head">${avatar('Vero', true)}<b>Vero team</b><span class="team-reply__badge">Official</span></div>
        <p>${esc(p.reply)}</p>
      </div>` : ''}
      <h3 class="fb-comments__h">Comments</h3>
      ${p.comments.length ? `<ol class="fb-comments">${p.comments.map((c) => `
        <li class="fb-comment${c.team ? ' is-team' : ''}">
          ${avatar(c.author, c.team)}
          <div><div class="fb-comment__head"><b>${esc(c.author)}</b><small>${ago(c.ago)}</small></div><p>${esc(c.text)}</p></div>
        </li>`).join('')}</ol>` : '<p class="fb-detail__none">No comments yet. Start the conversation.</p>'}
      ${composer}`;
  };
  const openPost = (id, opener) => {
    state.openId = id;
    renderDetail();
    openDialog(drawer, opener);
    drawer.querySelector('.modal__panel').scrollTop = 0;
  };
  drawer.addEventListener('dialog:close', () => {
    // The feed may have re-rendered while the drawer was open; return focus to this post's card
    const id = state.openId;
    state.openId = null;
    if (!doc.activeElement || doc.activeElement === doc.body) {
      const back = $(`[data-open="${id}"]`);
      if (back) back.focus({ preventScroll: true });
    }
  });

  /* ── Auth ── */
  const auth = $('#auth-dialog');
  const reasonEl = $('[data-auth-reason]');
  const authTabs = $$('.auth-tabs [role="tab"]', auth);
  const setAuthTab = (which, focus) => {
    authTabs.forEach((t) => {
      const on = t.getAttribute('aria-controls') === `auth-${which}`;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    $$('.auth-form', auth).forEach((f) => { f.hidden = f.id !== `auth-${which}`; });
  };
  authTabs.forEach((t, i) => {
    t.addEventListener('click', () => setAuthTab(t.getAttribute('aria-controls').slice(5)));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      setAuthTab(authTabs[(i + 1) % 2].getAttribute('aria-controls').slice(5), true);
    });
  });
  const requireAuth = (opener, reason, action, tab = 'up') => {
    state.pending = action;
    reasonEl.textContent = reason || 'Sign in to post, vote and comment.';
    setAuthTab(tab);
    $$('[data-error]', auth).forEach((e) => { e.textContent = ''; });
    openDialog(auth, opener);
    requestAnimationFrame(() => { const f = $(`#auth-${tab} input`, auth); if (f) f.focus(); });
  };
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  $$('[data-auth-form]', auth).forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const err = $('[data-error]', form);
      const email = String(data.get('email') || '').trim();
      const pass = String(data.get('password') || '');
      const isUp = form.dataset.authForm === 'up';
      const name = isUp ? String(data.get('name') || '').trim() : '';
      if (isUp && !name) { err.textContent = 'Add your name so the herd knows who you are.'; return; }
      if (!emailOk(email)) { err.textContent = 'Enter a valid email address.'; return; }
      if (isUp && pass.length < 8) { err.textContent = 'Use at least 8 characters for your password.'; return; }
      if (!isUp && !pass) { err.textContent = 'Enter your password.'; return; }
      err.textContent = '';

      const fallback = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      state.user = { name: name || fallback };
      persist();
      form.reset();
      const pending = state.pending;
      state.pending = null;
      closeDialog(auth);
      renderAccount();
      if (state.openId) renderDetail();
      toast(isUp ? `Welcome to the herd, ${state.user.name}!` : `Signed in as ${state.user.name}`);
      if (pending) setTimeout(pending, 320);
      else if (state.openId) setTimeout(() => { const box = $('#comment-text'); if (box) box.focus(); }, 60);
    });
  });

  /* ── Actions ── */
  const toggleVote = (id) => {
    if (state.voted.has(id)) state.voted.delete(id);
    else state.voted.add(id);
    persist();
    renderFeed();
    if (state.openId) renderDetail();
  };

  const compose = $('#compose-dialog');
  const composeForm = $('[data-compose-form]');
  const openCompose = (opener) => {
    if (!state.user) {
      requireAuth(opener, 'Create an account to share your feedback.', () => openDialog(compose, opener));
      return;
    }
    openDialog(compose, opener);
  };
  composeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(composeForm);
    const title = String(data.get('title') || '').trim();
    const body = String(data.get('body') || '').trim();
    const err = $('[data-error]', composeForm);
    if (title.length < 6) { err.textContent = 'Give it a title of at least a few words.'; return; }
    if (body.length < 10) { err.textContent = 'Add a little more detail so the team can help.'; return; }
    err.textContent = '';
    const post = { id: `u${Date.now()}`, cat: String(data.get('cat')), status: 'open', votes: 0, ago: 0, author: state.user.name, title, body, comments: [] };
    posts = [post, ...posts];
    state.voted.add(post.id);
    composeForm.reset();
    closeDialog(compose);
    Object.assign(state, { cat: 'all', status: 'all', q: '', sort: 'new' });
    syncControls();
    renderCounts();
    renderFeed(post.id);
    toast('Posted! Thanks for helping shape Vero.');
  });

  doc.addEventListener('click', (e) => {
    const t = e.target;
    const vote = t.closest('[data-vote]');
    if (vote) {
      const id = vote.dataset.vote;
      if (!state.user) requireAuth(vote, 'Sign in to vote for this post.', () => toggleVote(id));
      else toggleVote(id);
      return;
    }
    const open = t.closest('[data-open]');
    if (open) { openPost(open.dataset.open, open); return; }
    const authBtn = t.closest('[data-auth]');
    if (authBtn) { requireAuth(authBtn, authBtn.dataset.reason, null, authBtn.dataset.auth); return; }
    const composeBtn = t.closest('[data-compose]');
    if (composeBtn) { openCompose(composeBtn); return; }
    if (t.closest('[data-signout]')) {
      state.user = null;
      state.voted.clear();
      persist();
      renderAccount();
      renderFeed();
      toast('Signed out');
    }
  });

  detailEl.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-comment-form]');
    if (!form) return;
    e.preventDefault();
    const text = String(new FormData(form).get('text') || '').trim();
    if (!text) { $('[data-error]', form).textContent = 'Write something first.'; return; }
    byId(state.openId).comments.push({ author: state.user.name, ago: 0, text });
    renderDetail();
    renderFeed();
    toast('Comment posted');
    const list = $('.fb-comments', detailEl);
    if (list) list.lastElementChild.scrollIntoView({ block: 'nearest' });
  });

  /* ── Filters, sort, search ── */
  const syncControls = () => {
    $$('[data-filter="cat"] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === state.cat)));
    $$('[data-sort] button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === state.sort)));
    $('[data-status-filter]').value = state.status;
    $('[data-search]').value = state.q;
  };
  $$('[data-filter="cat"] button').forEach((b) => b.addEventListener('click', () => { state.cat = b.dataset.value; syncControls(); renderFeed(); }));
  $$('[data-sort] button').forEach((b) => b.addEventListener('click', () => { state.sort = b.dataset.value; syncControls(); renderFeed(); }));
  $('[data-status-filter]').addEventListener('change', (e) => { state.status = e.target.value; renderFeed(); });
  let qTimer = 0;
  $('[data-search]').addEventListener('input', (e) => {
    clearTimeout(qTimer);
    qTimer = setTimeout(() => { state.q = e.target.value; renderFeed(); }, 140);
  });

  renderAccount();
  renderCounts();
  renderFeed();
})();
