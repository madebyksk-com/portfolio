// Mobile menu toggle + cursor-driven shadow parallax.
// Mounted once by Base.astro via <script>.

function initMobileMenu() {
  const menuBtn = document.querySelector<HTMLButtonElement>('.menu-btn');
  const mobileNav = document.querySelector<HTMLElement>('.mobile-nav');
  const body = document.body;
  if (!menuBtn || !mobileNav) return;

  function setMenu(open: boolean) {
    body.classList.toggle('menu-open', open);
    menuBtn!.setAttribute('aria-expanded', String(open));
    mobileNav!.setAttribute('aria-hidden', String(!open));
    menuBtn!.textContent = open ? 'CLOSE' : 'MENU';
  }

  menuBtn.addEventListener('click', () => {
    setMenu(!body.classList.contains('menu-open'));
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false);
  });
}

function initParallax() {
  const supportsParallax =
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!supportsParallax) return;

  const root = document.documentElement;
  const MAX_DRIFT = 22;
  let frame: number | null = null;

  window.addEventListener(
    'mousemove',
    (e) => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const nx = (e.clientX / window.innerWidth - 0.5) * 2;
        const ny = (e.clientY / window.innerHeight - 0.5) * 2;
        root.style.setProperty('--shadow-parallax-x', `${nx * MAX_DRIFT}px`);
        root.style.setProperty('--shadow-parallax-y', `${ny * MAX_DRIFT}px`);
      });
    },
    { passive: true }
  );
}

initMobileMenu();
initParallax();
