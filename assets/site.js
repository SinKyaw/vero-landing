(() => {
  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }

    callback();
  };


  const initNavbar = () => {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');

    if (!navbar || !hamburger) {
      return;
    }

    const navbarLinks = navbar.querySelectorAll('.navbar-links a');
    const shouldCloseOnOutsideClick =
      navbar.dataset.closeOnOutsideClick === 'true' ||
      document.body.dataset.navbarCloseOnOutsideClick === 'true';

    const closeMenu = () => {
      navbar.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    };

    const updateNavbarState = () => {
      navbar.classList.toggle('is-scrolled', window.scrollY > 12);
    };

    updateNavbarState();
    window.addEventListener('scroll', updateNavbarState, { passive: true });
    window.addEventListener('resize', updateNavbarState);

    hamburger.addEventListener('click', () => {
      const isOpen = navbar.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    navbarLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    if (shouldCloseOnOutsideClick) {
      document.addEventListener('click', (event) => {
        if (!navbar.classList.contains('open')) {
          return;
        }

        if (navbar.contains(event.target) || hamburger.contains(event.target)) {
          return;
        }

        closeMenu();
      });
    }
  };

  const initDownloadModal = () => {
    const modal = document.querySelector('.download-modal');

    if (!modal) {
      return;
    }

    const triggers = document.querySelectorAll('.js-download-choice');
    const closeControls = document.querySelectorAll('[data-download-close]');
    const closeButton = modal.querySelector('.download-modal-close');
    let previousFocus = null;

    const closeModal = () => {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');

      if (previousFocus && typeof previousFocus.focus === 'function') {
        previousFocus.focus();
      }
    };

    const openModal = () => {
      previousFocus = document.activeElement;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');

      if (closeButton) {
        closeButton.focus();
      }
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener('click', (event) => {
        event.preventDefault();
        openModal();
      });
    });

    closeControls.forEach((control) => {
      control.addEventListener('click', closeModal);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('is-open')) {
        closeModal();
      }
    });
  };

  const includePartials = async () => {
    const els = document.querySelectorAll('[data-include]');
    await Promise.all(Array.from(els).map(async (el) => {
      const includePath = el.dataset.include;

      try {

        const res = await fetch(includePath);
        if (!res.ok) throw new Error(res.statusText);
        el.innerHTML = await res.text();
      } catch (err) {
        // keep page functional even if include fails
        console.error('Include failed:', includePath, err);
      }
    }));
  };

  ready(() => {
    const initializePage = () => {
      initNavbar();
      initDownloadModal();
      if (typeof window.initSite === 'function') window.initSite();
    };

    const scheduleInitialisation = () => {
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
          includePartials().finally(initializePage);
        });
        return;
      }

      includePartials().finally(initializePage);
    };

    scheduleInitialisation();
  });
})();
