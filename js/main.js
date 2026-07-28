/**
 * Aura PM — Client Interactivity
 * 
 * Mobile navigation drawer: toggle, ARIA sync, backdrop,
 * keyboard escape, focus management.
 */
(function () {
  'use strict';

  const toggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('primary-nav');
  const backdrop = document.getElementById('nav-backdrop');

  if (!toggle || !nav) return;

  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    nav.classList.add('is-open');
    if (backdrop) backdrop.classList.add('is-visible');
    document.body.style.overflow = 'hidden';

    /* Move focus to first nav link for keyboard users */
    const firstLink = nav.querySelector('a, button');
    if (firstLink) firstLink.focus();
  }

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    if (backdrop) backdrop.classList.remove('is-visible');
    document.body.style.overflow = '';

    /* Return focus to toggle for keyboard continuity */
    toggle.focus();
  }

  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  toggle.addEventListener('click', function () {
    isOpen() ? closeMenu() : openMenu();
  });

  /* Close on backdrop click */
  if (backdrop) {
    backdrop.addEventListener('click', closeMenu);
  }

  /* Close on Escape key */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) {
      closeMenu();
    }
  });

  /* Auto-close if viewport resizes past the tablet breakpoint */
  const mql = window.matchMedia('(min-width: 768px)');
  mql.addEventListener('change', function (e) {
    if (e.matches && isOpen()) {
      closeMenu();
    }
  });
})();
