// Lightbox controller — opens a single <dialog> on click, syncs URL
// state to the painting slug, reacts to browser back/forward, and uses
// the View Transitions API to morph the gallery thumbnail into the
// modal HD image.
//
// URL pattern: /works/  → gallery, no modal.
//              /works/<slug>/  → gallery with the modal open for <slug>.

interface LightboxLinkDataset extends DOMStringMap {
  slug: string;
  title: string;
  meta: string;
  alt: string;
  hdSrc: string;
  hdWidth?: string;
  hdHeight?: string;
}

const VIEW_TRANSITION_NAME = 'lightbox-image';

declare global {
  interface Document {
    startViewTransition?: (cb: () => void | Promise<void>) => {
      finished: Promise<void>;
    };
  }
}

function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('dialog#lightbox');
  if (!dialog) return;

  const img = dialog.querySelector<HTMLImageElement>('.lightbox-image')!;
  const title = dialog.querySelector<HTMLElement>('.lightbox-title')!;
  const meta = dialog.querySelector<HTMLElement>('.lightbox-meta')!;
  const closeBtn = dialog.querySelector<HTMLButtonElement>('.lightbox-close')!;

  const linkBySlug = new Map<string, HTMLAnchorElement>();
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')) {
    const slug = (link.dataset as LightboxLinkDataset).slug;
    if (slug) linkBySlug.set(slug, link);
  }

  // The modal image always carries the view-transition-name; gallery
  // thumbnails only carry it while they're the source/target of an
  // active transition — set just before, cleared just after, so two
  // images never share the name at the same time.
  img.style.viewTransitionName = VIEW_TRANSITION_NAME;

  let currentSlug: string | null = null;

  function assignTransitionTo(galleryImg: HTMLImageElement | null) {
    for (const a of linkBySlug.values()) {
      const gi = a.querySelector<HTMLImageElement>('img');
      if (gi) gi.style.viewTransitionName = '';
    }
    if (galleryImg) galleryImg.style.viewTransitionName = VIEW_TRANSITION_NAME;
  }

  function populate(link: HTMLAnchorElement) {
    const d = link.dataset as LightboxLinkDataset;
    const galleryImg = link.querySelector<HTMLImageElement>('img');

    // Start with the thumbnail's already-cached src so the modal can
    // paint instantly. Then preload the HD variant and swap when ready.
    img.src = galleryImg?.currentSrc || galleryImg?.src || d.hdSrc;
    img.alt = d.alt;
    if (d.hdWidth) img.width = parseInt(d.hdWidth, 10);
    if (d.hdHeight) img.height = parseInt(d.hdHeight, 10);
    title.textContent = d.title;
    meta.textContent = (d.meta || '').toUpperCase();

    if (d.hdSrc && img.src !== d.hdSrc) {
      const hd = new window.Image();
      hd.onload = () => {
        if (currentSlug === d.slug) img.src = d.hdSrc;
      };
      hd.src = d.hdSrc;
    }
  }

  function withTransition(galleryImg: HTMLImageElement | null, mutate: () => void) {
    assignTransitionTo(galleryImg);
    if (
      document.startViewTransition &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const t = document.startViewTransition(mutate);
      t.finished.finally(() => assignTransitionTo(null));
    } else {
      mutate();
      assignTransitionTo(null);
    }
  }

  function open(slug: string, options: { pushUrl?: boolean } = {}) {
    const link = linkBySlug.get(slug);
    if (!link) return false;
    currentSlug = slug;
    const galleryImg = link.querySelector<HTMLImageElement>('img');
    withTransition(galleryImg, () => {
      populate(link);
      if (!dialog!.open) dialog!.showModal();
    });
    if (options.pushUrl) {
      const url = `/works/${slug}/`;
      if (location.pathname !== url) history.pushState({ slug }, '', url);
    }
    return true;
  }

  function close(options: { pushUrl?: boolean } = {}) {
    const link = currentSlug ? linkBySlug.get(currentSlug) : null;
    const galleryImg = link?.querySelector<HTMLImageElement>('img') ?? null;
    withTransition(galleryImg, () => {
      if (dialog!.open) dialog!.close();
    });
    currentSlug = null;
    if (options.pushUrl && location.pathname !== '/works/') {
      history.pushState({}, '', '/works/');
    }
  }

  // Intercept gallery link clicks — let cmd/ctrl/middle click through so
  // opening in a new tab still hits the real static page.
  for (const link of linkBySlug.values()) {
    link.addEventListener('click', (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      const slug = (link.dataset as LightboxLinkDataset).slug;
      open(slug, { pushUrl: true });
    });
  }

  closeBtn.addEventListener('click', () => close({ pushUrl: true }));

  // Backdrop click — the <dialog> element itself, not the figure inside.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close({ pushUrl: true });
  });

  // ESC fires the native 'close' event without a click — restore URL.
  // (Don't call close() here to avoid double-closing; just sync state.)
  dialog.addEventListener('close', () => {
    currentSlug = null;
    if (location.pathname !== '/works/') {
      history.pushState({}, '', '/works/');
    }
    assignTransitionTo(null);
  });

  // Browser back/forward — sync to whatever the URL says.
  window.addEventListener('popstate', () => {
    const slug = slugFromPath(location.pathname);
    if (slug) open(slug);
    else if (dialog!.open) close();
  });

  // Initial load — open if URL is /works/<slug>/.
  const initial =
    (window as unknown as { __lightboxSlug?: string }).__lightboxSlug ??
    slugFromPath(location.pathname);
  if (initial) open(initial);
}

function slugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/works\/([^/]+)\/?$/);
  return m ? m[1]! : null;
}

initLightbox();
