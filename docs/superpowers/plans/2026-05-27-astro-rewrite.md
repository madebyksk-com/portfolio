# Astro + Tailwind Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the static `old-html/` portfolio as an Astro 5 + Tailwind v4 site with data-driven artworks, deployed to GitHub Pages at `madebyksk.com`. Visual design must match the old site at all three breakpoints (mobile / `md ≥768` / `lg ≥1024`).

**Architecture:** Astro 5 static output at the repo root. Tailwind v4 via `@tailwindcss/vite` with CSS-first `@theme` tokens. Artworks live in a content collection (`src/content/works/`) and render through Astro's `<Image>` pipeline. `old-html/` is kept until the rewrite is verified, then removed.

**Tech Stack:** Astro 5, Tailwind CSS v4, TypeScript (for content schema), Sharp (image optimization), self-hosted WOFF2 fonts, GitHub Actions + `withastro/action@v3` for Pages deploy.

**Verification model (no unit tests):** This is a static visual port with no business logic. "Verify" in each task means one or more of:
- `npm run build` succeeds with no errors
- `npx astro check` passes (type + content-collection validation)
- `npm run dev` + manual browser comparison against the matching page in `old-html/` at mobile (375 px), tablet (768 px), and desktop (1280 px) widths

The spec is at `docs/superpowers/specs/2026-05-27-astro-rewrite-design.md`. Reference it whenever a task is ambiguous.

---

## Task 1: Scaffold Astro project at repo root

**Files:**
- Create: `package.json`, `tsconfig.json`, `astro.config.mjs`, `.gitignore`, `src/env.d.ts`
- Modify: none

- [ ] **Step 1: Confirm working directory and that `old-html/` is preserved**

```bash
cd /Users/minkhantkyaw/Work/portfolio
ls
```

Expected output includes: `old-html`, `README.md`, `docs`. No `package.json` yet.

- [ ] **Step 2: Create `package.json`**

Write `/Users/minkhantkyaw/Work/portfolio/package.json`:

```json
{
  "name": "portfolio",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "astro": "astro"
  },
  "dependencies": {
    "astro": "^5.0.0"
  },
  "devDependencies": {
    "@astrojs/check": "^0.9.0",
    "typescript": "^5.6.0"
  }
}
```

- [ ] **Step 3: Create `tsconfig.json`**

Write `/Users/minkhantkyaw/Work/portfolio/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "old-html"]
}
```

- [ ] **Step 4: Create `.gitignore`**

Write `/Users/minkhantkyaw/Work/portfolio/.gitignore`:

```
# build output
dist/
.astro/

# deps
node_modules/

# env
.env
.env.production

# editor
.DS_Store
.vscode/
*.log
```

- [ ] **Step 5: Create minimal `astro.config.mjs`** (Tailwind added in Task 2)

Write `/Users/minkhantkyaw/Work/portfolio/astro.config.mjs`:

```js
import { defineConfig } from 'astro';

export default defineConfig({
  site: 'https://madebyksk.com',
  output: 'static',
});
```

- [ ] **Step 6: Create `src/env.d.ts`**

Write `/Users/minkhantkyaw/Work/portfolio/src/env.d.ts`:

```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 7: Install dependencies**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npm install
```

Expected: installs astro, @astrojs/check, typescript. No errors.

- [ ] **Step 8: Create a placeholder index page so the build succeeds**

Write `/Users/minkhantkyaw/Work/portfolio/src/pages/index.astro`:

```astro
---
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Scaffold OK</title>
  </head>
  <body>
    <p>scaffold</p>
  </body>
</html>
```

- [ ] **Step 9: Verify the build**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npm run build
```

Expected: `dist/index.html` is produced. No errors.

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json tsconfig.json .gitignore astro.config.mjs src/
git commit -m "Scaffold Astro 5 project at repo root"
```

---

## Task 2: Install and configure Tailwind CSS v4

**Files:**
- Modify: `package.json` (via npm), `astro.config.mjs`
- Create: `src/styles/global.css`

- [ ] **Step 1: Install Tailwind v4 and the Vite plugin**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npm install tailwindcss @tailwindcss/vite
```

Expected: `tailwindcss` and `@tailwindcss/vite` added to `dependencies`.

- [ ] **Step 2: Wire the Vite plugin into `astro.config.mjs`**

Replace the contents of `/Users/minkhantkyaw/Work/portfolio/astro.config.mjs` with:

```js
import { defineConfig } from 'astro';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://madebyksk.com',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 3: Create `src/styles/global.css` with tokens**

Write `/Users/minkhantkyaw/Work/portfolio/src/styles/global.css`:

```css
@import "tailwindcss";

@theme {
  --color-bg: #FAF7F2;
  --color-ink: #1A1410;
  --color-muted: #857F75;
  --color-shadow: rgba(26, 20, 16, 0.20);

  --font-display: "Antonio", "Impact", sans-serif;
  --font-body: "Inter", system-ui, -apple-system, sans-serif;
}

/* Runtime CSS variables (written by interactions.ts) live outside @theme */
:root {
  --shadow-offset: 14px;
  --shadow-parallax-x: 0px;
  --shadow-parallax-y: 0px;
}
@media (min-width: 768px) { :root { --shadow-offset: 20px; } }
@media (min-width: 1024px) { :root { --shadow-offset: 24px; } }

/* Base resets that mirror the old index.css */
*, *::before, *::after { box-sizing: border-box; }
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  scroll-behavior: smooth;
}
body {
  background: var(--color-bg);
  color: var(--color-ink);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
}
a { color: inherit; text-decoration: none; }
img { max-width: 100%; display: block; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Replace `src/pages/index.astro` to import the stylesheet and prove Tailwind works**

Write `/Users/minkhantkyaw/Work/portfolio/src/pages/index.astro`:

```astro
---
import '../styles/global.css';
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Tailwind OK</title>
  </head>
  <body class="bg-bg text-ink font-body">
    <p class="font-display text-[clamp(48px,10vw,96px)] tracking-[-0.02em]">KHIN</p>
  </body>
</html>
```

- [ ] **Step 5: Verify the build emits CSS and the utilities exist**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npm run build
```

Expected: `dist/_astro/*.css` exists. Open `dist/index.html` and confirm a `<link rel="stylesheet">` to a CSS file under `_astro/`.

Spot-check the CSS file contains the tokens:

```bash
grep -E "FAF7F2|font-display" dist/_astro/*.css | head -5
```

Expected: matches for both.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json astro.config.mjs src/styles/ src/pages/index.astro
git commit -m "Add Tailwind v4 with @theme tokens"
```

---

## Task 3: Self-host fonts

**Files:**
- Create: `public/fonts/antonio-700.woff2`, `public/fonts/antonio-900.woff2`, `public/fonts/inter-400.woff2`, `public/fonts/inter-500.woff2`, `public/fonts/inter-600.woff2`, `public/fonts/inter-700.woff2`
- Modify: `src/styles/global.css` (add `@font-face` rules)

- [ ] **Step 1: Download the WOFF2 files**

The cleanest source is `https://fonts.bunny.net` (drop-in Google Fonts mirror, no tracking). Equivalent: `https://google-webfonts-helper.herokuapp.com/`. Either yields raw WOFF2 files.

Create the directory and download:

```bash
cd /Users/minkhantkyaw/Work/portfolio
mkdir -p public/fonts

# Antonio 700 & 900
curl -L -o public/fonts/antonio-700.woff2 "https://fonts.bunny.net/antonio/files/antonio-latin-700-normal.woff2"
curl -L -o public/fonts/antonio-900.woff2 "https://fonts.bunny.net/antonio/files/antonio-latin-900-normal.woff2"

# Inter 400, 500, 600, 700
curl -L -o public/fonts/inter-400.woff2 "https://fonts.bunny.net/inter/files/inter-latin-400-normal.woff2"
curl -L -o public/fonts/inter-500.woff2 "https://fonts.bunny.net/inter/files/inter-latin-500-normal.woff2"
curl -L -o public/fonts/inter-600.woff2 "https://fonts.bunny.net/inter/files/inter-latin-600-normal.woff2"
curl -L -o public/fonts/inter-700.woff2 "https://fonts.bunny.net/inter/files/inter-latin-700-normal.woff2"
```

Expected: 6 files, each between ~20 KB and ~100 KB.

```bash
ls -la public/fonts/
```

- [ ] **Step 2: Add `@font-face` declarations to `global.css`**

Insert this block at the top of `/Users/minkhantkyaw/Work/portfolio/src/styles/global.css`, **before** `@import "tailwindcss";`:

```css
@font-face {
  font-family: "Antonio";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/antonio-700.woff2") format("woff2");
}
@font-face {
  font-family: "Antonio";
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: url("/fonts/antonio-900.woff2") format("woff2");
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/inter-400.woff2") format("woff2");
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/fonts/inter-500.woff2") format("woff2");
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 600;
  font-display: swap;
  src: url("/fonts/inter-600.woff2") format("woff2");
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/fonts/inter-700.woff2") format("woff2");
}

```

- [ ] **Step 3: Verify the build copies fonts into `dist/`**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npm run build
ls dist/fonts/
```

Expected: all 6 WOFF2 files present in `dist/fonts/`.

- [ ] **Step 4: Spot-check fonts render in the dev server**

```bash
npm run dev
```

Open `http://localhost:4321`. The "KHIN" text should be displayed in Antonio (heavy condensed sans-serif), not Inter or system default. Stop the dev server with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add public/fonts/ src/styles/global.css
git commit -m "Self-host Antonio and Inter as WOFF2"
```

---

## Task 4: Migrate SVG icons and the portrait

**Files:**
- Create: `public/svg/arrow-right-up.svg`, `public/svg/paint-mark-1.svg`, `src/assets/profile.jpg`

- [ ] **Step 1: Copy SVG icons into `public/svg/`**

```bash
cd /Users/minkhantkyaw/Work/portfolio
mkdir -p public/svg
cp old-html/images/svg/arrow-right-up-svgrepo-com.svg public/svg/arrow-right-up.svg
cp old-html/images/svg/paint-mark-1-svgrepo-com.svg public/svg/paint-mark-1.svg
ls public/svg/
```

Expected: 2 SVGs at the new paths.

- [ ] **Step 2: Copy the portrait into `src/assets/`**

```bash
mkdir -p src/assets
cp old-html/images/900x1125-profile.jpg src/assets/profile.jpg
ls -la src/assets/
```

Expected: `profile.jpg` (~188 KB).

- [ ] **Step 3: Commit**

```bash
git add public/svg/ src/assets/
git commit -m "Migrate SVG icons and portrait into the new project"
```

---

## Task 5: Define the works content collection

**Files:**
- Create: `src/content.config.ts`, `src/content/works/images/fisherman-at-inle.jpg`, `src/content/works/images/thingyan-festival.jpg`, `src/content/works/fisherman-at-inle.md`, `src/content/works/thingyan-festival.md`

- [ ] **Step 1: Move and rename the painting files**

```bash
cd /Users/minkhantkyaw/Work/portfolio
mkdir -p src/content/works/images
cp old-html/images/arts/sunset.png src/content/works/images/fisherman-at-inle.jpg
cp old-html/images/arts/thingyan.png src/content/works/images/thingyan-festival.jpg
ls -la src/content/works/images/
```

(Renaming `.png` → `.jpg` here is intentional: the source file extension does not have to match the encoded format because Astro re-encodes everything through Sharp at build time. The output will be WebP regardless.)

- [ ] **Step 2: Create `src/content.config.ts`**

Write `/Users/minkhantkyaw/Work/portfolio/src/content.config.ts`:

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/works' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    year: z.number().int(),
    medium: z.string().default('Oil on canvas'),
    image: image(),
    alt: z.string(),
    order: z.number().int().default(999),
    dimensions: z.string().optional(),
    location: z.string().optional(),
  }),
});

export const collections = { works };
```

- [ ] **Step 3: Create the first entry (`fisherman-at-inle.md`)**

Write `/Users/minkhantkyaw/Work/portfolio/src/content/works/fisherman-at-inle.md`:

```md
---
title: Fisherman at Inle
year: 2024
medium: Oil on canvas
image: ./images/fisherman-at-inle.jpg
alt: Fisherman at sunset on Inle Lake, oil painting
order: 1
dimensions: 30 × 40 in
location: Inle Lake
---

A still morning on Inle, the lone fisherman framed against the sunrise.
```

- [ ] **Step 4: Create the second entry (`thingyan-festival.md`)**

Write `/Users/minkhantkyaw/Work/portfolio/src/content/works/thingyan-festival.md`:

```md
---
title: Thingyan Festival
year: 2024
medium: Oil on canvas
image: ./images/thingyan-festival.jpg
alt: Thingyan water-festival scene, oil painting
order: 2
location: Yangon
---

The water festival in full motion — colour, splash, joy.
```

- [ ] **Step 5: Verify the collection type-checks**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npx astro sync
npx astro check
```

Expected: `astro sync` generates `.astro/content.d.ts`. `astro check` reports 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/content.config.ts src/content/
git commit -m "Add works content collection with two paintings"
```

---

## Task 6: Interactions script (mobile menu + cursor parallax)

**Files:**
- Create: `src/scripts/interactions.ts`

- [ ] **Step 1: Create the script**

Write `/Users/minkhantkyaw/Work/portfolio/src/scripts/interactions.ts`:

```ts
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
```

- [ ] **Step 2: Commit (verification happens once the script is mounted in Task 7)**

```bash
git add src/scripts/
git commit -m "Add mobile menu + parallax interactions script"
```

---

## Task 7: Base layout, header, footer, mobile nav, ArrowUpRight

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/MobileNav.astro`, `src/components/Footer.astro`, `src/components/ArrowUpRight.astro`
- Modify: `src/styles/global.css` (wordmark splash decoration)

- [ ] **Step 1: Create `ArrowUpRight.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/components/ArrowUpRight.astro`:

```astro
---
// Inline arrow icon. Defined as an <span> background so it inherits sizing
// from the parent's font-size (1em), matching the old .arrow-up-right rule.
---
<span
  class="inline-block w-[1em] h-[1em] align-[-0.18em] ml-[0.2em] shrink-0 bg-[url('/svg/arrow-right-up.svg')] bg-no-repeat bg-center bg-contain"
  aria-hidden="true"
></span>
```

- [ ] **Step 2: Append the wordmark splash decoration to `global.css`**

Append to `/Users/minkhantkyaw/Work/portfolio/src/styles/global.css`:

```css
/* ------------------------------------------------------------
   Wordmark paint-splash decoration.
   Kept as plain CSS because pseudo-elements with background-image
   + hover-driven transform do not map cleanly to utilities.
   ------------------------------------------------------------ */
.wordmark { position: relative; display: inline-flex; align-items: center; }
.wordmark::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  transform: translate(-50%, -50%);
  background: url('/svg/paint-mark-1.svg') no-repeat center / contain;
  z-index: 1;
  pointer-events: none;
  transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1);
}
.topbar:hover .wordmark::before {
  transform: translate(-50%, -50%) rotate(20deg);
}
.wordmark-text {
  position: relative;
  z-index: 2;
  color: var(--color-bg);
  mix-blend-mode: difference;
  user-select: none;
}
```

- [ ] **Step 3: Create `Header.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/components/Header.astro`:

```astro
---
import ArrowUpRight from './ArrowUpRight.astro';
const { current } = Astro.props as { current?: 'home' | 'about' };
---
<header class="topbar relative z-[60] flex justify-between items-center gap-6 bg-bg px-[var(--pad-page)] pt-8 pb-1
  md:px-12 lg:px-20 lg:pt-14 lg:pb-4">
  <a class="wordmark font-bold text-[14px] tracking-[0.1em] leading-none" href="/" aria-label="Khin Sandar Kyaw — Home">
    <span class="wordmark-text">KHIN</span>
  </a>

  <nav class="hidden md:inline-flex gap-6" aria-label="Primary">
    <a class="text-[12px] tracking-[0.1em] font-medium" href="/#works" aria-current={current === 'home' ? 'page' : undefined}>[ WORKS ]</a>
    <a class="text-[12px] tracking-[0.1em] font-medium" href="/about" aria-current={current === 'about' ? 'page' : undefined}>[ ABOUT ]</a>
    <a class="text-[12px] tracking-[0.1em] font-medium" href="/#contact">[ CONTACT ]</a>
  </nav>

  <a class="hidden md:inline-block text-[12px] tracking-[0.1em] font-semibold underline" href="mailto:hello@khinsandarkyaw.com">
    INQUIRE<ArrowUpRight />
  </a>

  <button class="menu-btn md:hidden font-semibold text-[11px] tracking-[0.12em] underline" aria-expanded="false" aria-controls="mobile-nav">
    MENU
  </button>
</header>

<style is:global>
  :root { --pad-page: 24px; }
  @media (min-width: 768px) { :root { --pad-page: 48px; } }
  @media (min-width: 1024px) { :root { --pad-page: 80px; } }
  /* Underline indicator on the active page in nav */
  nav a[aria-current="page"] { text-decoration: underline; text-underline-offset: 6px; }
</style>
```

- [ ] **Step 4: Create `MobileNav.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/components/MobileNav.astro`:

```astro
---
import ArrowUpRight from './ArrowUpRight.astro';
const { current } = Astro.props as { current?: 'home' | 'about' };
---
<nav
  id="mobile-nav"
  class="mobile-nav fixed inset-0 bg-bg z-50 flex flex-col items-center justify-center gap-8 opacity-0 pointer-events-none transition-opacity duration-200 ease-linear md:hidden"
  aria-hidden="true"
>
  <a class="font-display font-bold text-[32px] tracking-[0.02em]" href="/#works" aria-current={current === 'home' ? 'page' : undefined}>[ WORKS ]</a>
  <a class="font-display font-bold text-[32px] tracking-[0.02em]" href="/about" aria-current={current === 'about' ? 'page' : undefined}>[ ABOUT ]</a>
  <a class="font-display font-bold text-[32px] tracking-[0.02em]" href="/#contact">[ CONTACT ]</a>
  <a class="font-display font-bold text-[32px] tracking-[0.02em]" href="mailto:hello@khinsandarkyaw.com">INQUIRE<ArrowUpRight /></a>
</nav>

<style is:global>
  body.menu-open .mobile-nav { opacity: 1; pointer-events: auto; }
  body.menu-open { overflow: hidden; }
</style>
```

- [ ] **Step 5: Create `Footer.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/components/Footer.astro`:

```astro
---
import ArrowUpRight from './ArrowUpRight.astro';
---
<footer id="contact" class="flex flex-col gap-3 font-semibold text-[11px] tracking-[0.16em] px-[var(--pad-page)] py-[var(--pad-page)] pt-16 md:flex-row md:justify-between md:items-center lg:pt-30 lg:max-w-[1280px] lg:mx-auto">
  <div>KHIN SANDAR KYAW&nbsp;&nbsp;·&nbsp;&nbsp;YANGON, MYANMAR</div>
  <div class="flex flex-wrap gap-4 md:gap-6">
    <span>© 2026</span>
    <a href="https://www.instagram.com/khinsandar798" target="_blank" rel="noopener">IG<ArrowUpRight /></a>
    <a href="https://www.facebook.com/khin.sandarphone.kyaw" target="_blank" rel="noopener">FB<ArrowUpRight /></a>
    <a href="mailto:hello@khinsandarkyaw.com">EMAIL<ArrowUpRight /></a>
  </div>
</footer>
```

- [ ] **Step 6: Create `Base.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/layouts/Base.astro`:

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';
import MobileNav from '../components/MobileNav.astro';
import Footer from '../components/Footer.astro';

const { title, current } = Astro.props as { title: string; current?: 'home' | 'about' };
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title}</title>
    <link rel="preload" href="/fonts/antonio-900.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="preload" href="/fonts/inter-400.woff2" as="font" type="font/woff2" crossorigin />
  </head>
  <body class="bg-bg text-ink font-body min-h-screen">
    <Header current={current} />
    <MobileNav current={current} />
    <main id="top" class="lg:max-w-[1280px] lg:mx-auto">
      <slot />
    </main>
    <Footer />
    <script>
      import '../scripts/interactions.ts';
    </script>
  </body>
</html>
```

- [ ] **Step 7: Replace `src/pages/index.astro` with a minimal smoke page that uses the layout**

Write `/Users/minkhantkyaw/Work/portfolio/src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Khin Sandar Kyaw — Landscape Painter, Myanmar" current="home">
  <p class="px-[var(--pad-page)] py-20">Hero goes here.</p>
</Base>
```

- [ ] **Step 8: Verify build, dev preview, and interactions**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npx astro check
npm run dev
```

Open `http://localhost:4321`:
- Header is visible, wordmark "KHIN" shows with the paint splash behind it.
- At < 768 px width, "MENU" button shows. Click it → full-screen overlay appears with WORKS / ABOUT / CONTACT / INQUIRE links in display font. Click any link or press Escape → closes.
- At ≥ 768 px width, MENU disappears; horizontal nav and INQUIRE link visible.
- Footer at the bottom with copyright + social links.

Stop dev server with Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add src/layouts/ src/components/ src/styles/global.css src/pages/index.astro
git commit -m "Add Base layout with Header, MobileNav, Footer"
```

---

## Task 8: Hero component

**Files:**
- Create: `src/components/Hero.astro`
- Modify: `src/pages/index.astro`, `src/styles/global.css` (portrait shadow ::before)

- [ ] **Step 1: Append the portrait-shadow CSS to `global.css`**

Append to `/Users/minkhantkyaw/Work/portfolio/src/styles/global.css`:

```css
/* ------------------------------------------------------------
   Portrait + studio shadow. Parallax-driven via CSS variables
   that interactions.ts writes on mousemove. Kept as plain CSS
   because the calc() in transform mixes runtime vars.
   ------------------------------------------------------------ */
.portrait-shadow { position: relative; }
.portrait-shadow::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-shadow);
  transform: translate(
    calc(var(--shadow-offset) + var(--shadow-parallax-x, 0px)),
    calc(var(--shadow-offset) + var(--shadow-parallax-y, 0px))
  );
  z-index: -1;
  transition: transform 0.25s ease-out;
  will-change: transform;
}
@media (prefers-reduced-motion: reduce) {
  .portrait-shadow::before { transition: none; }
}
```

- [ ] **Step 2: Create `Hero.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/components/Hero.astro`:

```astro
---
import { Image } from 'astro:assets';
import profile from '../assets/profile.jpg';
import ArrowUpRight from './ArrowUpRight.astro';
---
<section class="hero flex flex-col gap-5 px-[var(--pad-page)] md:gap-8 lg:gap-4 lg:relative lg:py-0">
  <span class="year block text-right font-bold text-[11px] tracking-[0.16em] lg:hidden">2026</span>

  <div class="headline-block relative flex flex-col gap-6 lg:h-[605px] lg:[container-type:inline-size]">
    <h1 class="headline font-display font-black text-ink relative z-[2]
        text-[clamp(72px,22vw,110px)] leading-[1.0] tracking-[-0.02em]
        md:text-[clamp(110px,14vw,140px)]
        lg:absolute lg:top-[50px] lg:left-0 lg:right-0 lg:flex lg:justify-between lg:items-baseline
        lg:text-[clamp(140px,14cqw,220px)] lg:leading-[0.85] lg:tracking-[-0.022em] lg:m-0 lg:p-0">
      <span class="block lg:inline-block">KHIN</span>
      <span class="block lg:inline-block">SANDAR</span>
      <span class="block lg:inline-block">KYAW</span>
    </h1>

    <figure class="portrait portrait-shadow relative mx-auto mt-[-20%]
        w-[86%] aspect-[4/5]
        md:w-[60%] md:mt-[-18%] md:aspect-square
        lg:w-[380px] lg:aspect-square lg:absolute lg:top-[140px] lg:left-1/2 lg:-translate-x-1/2 lg:mt-0
        z-[1]">
      <Image
        src={profile}
        alt="Portrait of the artist, Khin Sandar Kyaw"
        loading="eager"
        class="w-full h-full object-cover object-center filter grayscale contrast-[1.08] brightness-[1.02] bg-muted"
      />
    </figure>

    <span class="based font-semibold text-[11px] tracking-[0.32em]
        lg:absolute lg:top-[calc(50px+clamp(140px,14cqw,220px)*0.85+40px)] lg:right-0 lg:text-right">
      BASED IN MYANMAR
    </span>

    <!-- Desktop-only year tag (hidden via container's absolute layout on lg) -->
    <span class="hidden lg:block lg:absolute lg:top-6 lg:right-0 font-body font-bold text-[12px] tracking-[0.16em] text-ink">2026</span>
  </div>

  <p class="bio text-[14px] text-center max-w-[320px] mx-auto mt-2 md:max-w-[480px] lg:max-w-[400px] lg:-mt-11">
    Oil on canvas, capturing the light of Myanmar's landscapes since 2010. Subjects span Inle Lake, Bagan, and the Shan highlands.
  </p>

  <div class="hero-bottom hidden md:flex justify-between items-start gap-8 mt-12 pt-4 lg:mt-14 lg:pt-6">
    <div class="flex flex-col gap-2">
      <span class="font-semibold text-[11px] tracking-[0.16em]">AVAILABLE FOR COMMISSIONS<ArrowUpRight /></span>
      <a class="text-[14px] font-medium underline" href="mailto:hello@khinsandarkyaw.com">hello@khinsandarkyaw.com</a>
    </div>
    <div class="flex flex-col gap-2 text-right">
      <span class="font-semibold text-[11px] tracking-[0.16em]">RECENT WORK<ArrowUpRight /></span>
      <a class="font-display font-bold text-[18px] tracking-[0.03em]" href="#works">FISHERMAN AT INLE</a>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Wire Hero into `src/pages/index.astro`**

Replace `/Users/minkhantkyaw/Work/portfolio/src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
---
<Base title="Khin Sandar Kyaw — Landscape Painter, Myanmar" current="home">
  <Hero />
</Base>
```

- [ ] **Step 4: Verify against the old hero**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npm run dev
```

Open two browser tabs side-by-side:
- New: `http://localhost:4321/`
- Old: open `old-html/index.html` directly with `open old-html/index.html` (separate command)

Compare at viewports 375 px, 768 px, 1280 px. The headline, portrait, "BASED IN MYANMAR" label, bio paragraph, and the hero-bottom row (commissions / recent work) should sit in the same positions and the cursor parallax should drift the portrait shadow.

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/Hero.astro src/pages/index.astro src/styles/global.css
git commit -m "Add Hero component matching old-html"
```

---

## Task 9: WorksStrip + Tile components

**Files:**
- Create: `src/components/WorksStrip.astro`, `src/components/Tile.astro`
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Create `Tile.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/components/Tile.astro`:

```astro
---
import { Image } from 'astro:assets';
import type { CollectionEntry } from 'astro:content';

const { work } = Astro.props as { work: CollectionEntry<'works'> };
const { title, year, medium, image, alt } = work.data;
---
<article class="tile relative bg-muted overflow-hidden aspect-[3/2] lg:aspect-auto lg:h-[70vh] lg:max-h-[560px] lg:flex-[0_0_70vw] lg:max-w-[840px] lg:snap-start" role="listitem">
  <Image
    src={image}
    alt={alt}
    loading="lazy"
    class="w-full h-full object-cover transition-transform duration-500 ease-out hover:scale-[1.04]"
  />
  <div class="tile-caption absolute left-4 bottom-4 px-3.5 py-2.5 bg-[rgba(26,20,16,0.28)] backdrop-blur-[14px] backdrop-saturate-150 text-bg pointer-events-none flex flex-col gap-1 md:left-6 md:bottom-6">
    <h3 class="font-display font-bold text-[18px] tracking-[0.03em] md:text-[22px]">{title.toUpperCase()}</h3>
    <span class="text-[10px] tracking-[0.14em] font-medium">{year} · {medium.toUpperCase()}</span>
  </div>
</article>
```

- [ ] **Step 2: Create `WorksStrip.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/components/WorksStrip.astro`:

```astro
---
import { getCollection } from 'astro:content';
import Tile from './Tile.astro';

const works = (await getCollection('works')).sort(
  (a, b) => a.data.order - b.data.order
);
---
<section id="works" class="strip px-[var(--pad-page)] pt-16 md:pt-24 lg:pt-30" aria-labelledby="strip-label">
  <h2 id="strip-label" class="font-semibold text-[11px] tracking-[0.16em] mb-8">SELECTED WORKS — 2018 / 2025</h2>

  <div class="strip-track flex flex-col gap-8 lg:flex-row lg:gap-24 lg:overflow-x-auto lg:overflow-y-hidden lg:snap-x lg:snap-mandatory lg:pb-4 lg:[-webkit-overflow-scrolling:touch] lg:[&::-webkit-scrollbar]:h-0" role="list">
    {works.map((work) => <Tile work={work} />)}
  </div>
</section>
```

- [ ] **Step 3: Wire WorksStrip into the index page**

Replace `/Users/minkhantkyaw/Work/portfolio/src/pages/index.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import WorksStrip from '../components/WorksStrip.astro';
---
<Base title="Khin Sandar Kyaw — Landscape Painter, Myanmar" current="home">
  <Hero />
  <WorksStrip />
</Base>
```

- [ ] **Step 4: Verify build + tile rendering**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npx astro check
npm run dev
```

In the browser:
- Two tiles render in `order: 1, 2` (Fisherman at Inle, then Thingyan Festival).
- Captions are visible bottom-left with the blurred dark background.
- At ≥ 1024 px, the strip becomes a horizontal scroller with snap points.
- Confirm `npm run build` succeeds and that the tile images in `dist/_astro/` are WebP and smaller than the originals (`ls -la dist/_astro/ | grep -E "(webp|jpg|png)"`).

Stop the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/components/Tile.astro src/components/WorksStrip.astro src/pages/index.astro
git commit -m "Add WorksStrip and Tile fed by the works collection"
```

---

## Task 10: About page

**Files:**
- Create: `src/components/AboutIntro.astro`, `src/components/Statement.astro`, `src/components/ContactList.astro`, `src/pages/about.astro`

- [ ] **Step 1: Create `AboutIntro.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/components/AboutIntro.astro`:

```astro
---
import { Image } from 'astro:assets';
import profile from '../assets/profile.jpg';
---
<section class="about-intro px-[var(--pad-page)] max-w-[1280px] mx-auto mt-8 grid grid-cols-1 gap-6 items-start
    md:grid-cols-[5fr_7fr] md:gap-10 md:mt-12
    lg:gap-16 lg:mt-16">
  <figure class="about-studio portrait-shadow relative m-0 w-full">
    <Image
      src={profile}
      alt="Khin Sandar Kyaw in her Yangon studio"
      loading="lazy"
      class="relative z-[1] w-full h-auto aspect-[4/5] object-cover filter grayscale contrast-[1.05] bg-muted"
    />
    <figcaption class="mt-3 text-[11px] font-semibold tracking-[0.16em] text-muted">
      The studio, Yangon — 2025
    </figcaption>
  </figure>

  <div class="about-bio flex flex-col gap-6 text-[16px] leading-[1.65] md:pt-2">
    <p>Khin Sandar Kyaw is an oil painter based in Yangon, Myanmar. Her work captures the country's landscapes — from the still mornings on Inle Lake to the dust-warm afternoons across the Bagan plain — with a focus on light, atmosphere, and the rhythms of rural life.</p>
    <p>Painting since 2010, she works primarily in oil on linen canvas. Each piece begins with field sketches and photographs gathered across her travels in Myanmar, then is built up slowly in the studio over weeks of layered glazes. Her preferred sizes range from intimate 12×18&nbsp;inch studies to larger 30×40&nbsp;inch panel works.</p>
    <p>Her subjects span the country's regional contrasts — Inle's fishermen, Bagan's temples at sunrise, the highlands of Shan, and the everyday spectacle of Thingyan festival. The shared thread is light: the moment the sun touches a horizon, a wall, a face, a stretch of paddy field.</p>
  </div>
</section>
```

- [ ] **Step 2: Create `Statement.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/components/Statement.astro`:

```astro
---
---
<blockquote class="about-statement px-[var(--pad-page)] max-w-[880px] mx-auto mt-14">
  <p class="font-display font-bold leading-[1.15] tracking-[-0.01em] m-0 text-[clamp(28px,4.4vw,52px)]">
    "I paint Myanmar the way I remember it at first light — when the colour has not yet decided what it wants to be."
  </p>
  <cite class="block mt-6 not-italic font-body font-semibold text-[11px] tracking-[0.32em] text-muted">— KHIN SANDAR KYAW</cite>
</blockquote>
```

- [ ] **Step 3: Create `ContactList.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/components/ContactList.astro`:

```astro
---
import ArrowUpRight from './ArrowUpRight.astro';
---
<section id="contact" class="about-contact px-[var(--pad-page)] max-w-[880px] mx-auto mt-14 mb-16 md:mb-24">
  <h2 class="text-[11px] font-semibold tracking-[0.32em] m-0 mb-8">CONTACT&nbsp;·&nbsp;COMMISSIONS</h2>
  <ul class="list-none p-0 m-0 flex flex-col">
    <li class="grid grid-cols-1 gap-2 text-[14px] border-t border-muted py-4 md:grid-cols-[180px_1fr] md:gap-8 md:items-baseline">
      <span class="text-[11px] font-semibold tracking-[0.16em] text-muted">EMAIL</span>
      <a class="underline" href="mailto:hello@khinsandarkyaw.com">hello@khinsandarkyaw.com</a>
    </li>
    <li class="grid grid-cols-1 gap-2 text-[14px] border-t border-muted py-4 md:grid-cols-[180px_1fr] md:gap-8 md:items-baseline">
      <span class="text-[11px] font-semibold tracking-[0.16em] text-muted">INSTAGRAM</span>
      <a class="underline" href="https://www.instagram.com/khinsandar798" target="_blank" rel="noopener">@khinsandar798<ArrowUpRight /></a>
    </li>
    <li class="grid grid-cols-1 gap-2 text-[14px] border-t border-muted py-4 md:grid-cols-[180px_1fr] md:gap-8 md:items-baseline">
      <span class="text-[11px] font-semibold tracking-[0.16em] text-muted">FACEBOOK</span>
      <a class="underline" href="https://www.facebook.com/khin.sandarphone.kyaw" target="_blank" rel="noopener">Khin Sandar Phone Kyaw<ArrowUpRight /></a>
    </li>
    <li class="grid grid-cols-1 gap-2 text-[14px] border-t border-muted py-4 md:grid-cols-[180px_1fr] md:gap-8 md:items-baseline">
      <span class="text-[11px] font-semibold tracking-[0.16em] text-muted">STUDIO</span>
      <span>Yangon, Myanmar — visits by appointment</span>
    </li>
    <li class="grid grid-cols-1 gap-2 text-[14px] border-t border-muted py-4 md:grid-cols-[180px_1fr] md:gap-8 md:items-baseline">
      <span class="text-[11px] font-semibold tracking-[0.16em] text-muted">COMMISSIONS</span>
      <span>Open for landscape and portrait commissions, oil on canvas</span>
    </li>
  </ul>
</section>
```

- [ ] **Step 4: Create `src/pages/about.astro`**

Write `/Users/minkhantkyaw/Work/portfolio/src/pages/about.astro`:

```astro
---
import Base from '../layouts/Base.astro';
import AboutIntro from '../components/AboutIntro.astro';
import Statement from '../components/Statement.astro';
import ContactList from '../components/ContactList.astro';
---
<Base title="About — Khin Sandar Kyaw" current="about">
  <section class="about-hero relative px-[var(--pad-page)] pt-13">
    <span class="year absolute top-4 right-[var(--pad-page)] font-bold text-[11px] tracking-[0.16em]">2026</span>
    <h1 class="about-title font-display font-black m-0 leading-[0.85] tracking-[-0.022em] text-[clamp(56px,11vw,140px)]">ABOUT</h1>
    <p class="about-tag text-[11px] font-semibold tracking-[0.32em] mt-5">LANDSCAPE PAINTER&nbsp;·&nbsp;YANGON, MYANMAR</p>
  </section>
  <AboutIntro />
  <Statement />
  <ContactList />
</Base>
```

- [ ] **Step 5: Verify the About page against `old-html/about.html`**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npx astro check
npm run dev
```

Navigate to `http://localhost:4321/about`. Compare to `old-html/about.html` at 375 / 768 / 1280 px. Check:
- "ABOUT" headline, tag, year-tag in top-right.
- Two-column layout on tablet+ (studio photo left, bio right).
- Pull-quote centered with cite.
- Contact list with `border-top` separators, 180-px key column on tablet+.
- "ABOUT" link in nav is underlined (`aria-current="page"`).

Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add src/components/AboutIntro.astro src/components/Statement.astro src/components/ContactList.astro src/pages/about.astro
git commit -m "Add About page with intro, statement, contact list"
```

---

## Task 11: GitHub Pages deploy workflow

**Files:**
- Create: `public/CNAME`, `.github/workflows/deploy.yml`

- [ ] **Step 1: Create `public/CNAME`**

Write `/Users/minkhantkyaw/Work/portfolio/public/CNAME` (single line, no trailing newline content beyond one `\n`):

```
madebyksk.com
```

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

Write `/Users/minkhantkyaw/Work/portfolio/.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: withastro/action@v3
        with:
          node-version: 20
          package-manager: npm@latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Verify the build still includes CNAME**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npm run build
ls dist/CNAME
cat dist/CNAME
```

Expected: `dist/CNAME` exists and contains `madebyksk.com`.

- [ ] **Step 4: Commit**

```bash
git add public/CNAME .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deploy workflow + CNAME"
```

- [ ] **Step 5: Manual steps to flag to the user (NOT executed by the agent)**

Tell the user — do NOT execute:

> Before the first deploy works end-to-end:
> 1. Push the branch to GitHub.
> 2. In the repo on GitHub: **Settings → Pages → Source = GitHub Actions**.
> 3. DNS on the registrar for `madebyksk.com`:
>    - Apex: 4 A records pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
>      and 4 AAAA records: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
>    - `www`: CNAME → `<your-github-username>.github.io`
> 4. In **Settings → Pages**, set the custom domain to `madebyksk.com` and enable "Enforce HTTPS" once the cert provisions (can take up to 24 hours).

---

## Task 12: Final verification and removal of `old-html/`

**Files:**
- Delete: `old-html/` (entire directory)

- [ ] **Step 1: Full verification pass**

```bash
cd /Users/minkhantkyaw/Work/portfolio
npx astro check
npm run build
npm run preview
```

`astro check`: 0 errors.
`build`: succeeds, prints page list (`/`, `/about/`).
`preview`: opens at `http://localhost:4321`. Walk through both pages at 375, 768, 1280 px viewports and compare to opening `old-html/index.html` + `old-html/about.html` in adjacent tabs. Confirm:

- Hero: headline, portrait position + grayscale + parallax shadow, bio, hero-bottom row.
- Works strip: 2 tiles, captions, horizontal scroll-snap on lg.
- About: title, year, intro 2-col layout, statement, contact-list separators.
- Mobile menu: opens, closes on link click, closes on Escape.
- Header wordmark splash rotates on `:hover` of the topbar (≥ 1024 px).
- Footer links work.
- No console errors in DevTools.

Stop preview server.

- [ ] **Step 2: Remove `old-html/`**

```bash
cd /Users/minkhantkyaw/Work/portfolio
git rm -r old-html
```

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "Remove old-html, rewrite verified"
```

- [ ] **Step 4: Hand off**

Report to user:
- The Astro + Tailwind rewrite is committed on `main`.
- Manual steps from Task 11 Step 5 (Pages source, DNS, custom-domain config) are needed before the live site goes up on `madebyksk.com`.
- Suggested follow-ups (deferred during brainstorming): OG image + meta, sitemap, analytics. Detail-page route for `/works/[slug]` is easy to add later — the content schema already supports it.

---

## Self-review notes (filled in by the author of this plan)

- **Spec coverage:** all spec sections mapped — scaffold (T1), Tailwind (T2), fonts (T3), assets (T4), collection (T5), interactions (T6), layout/components (T7–T10), deploy (T11), verification + cleanup (T12).
- **No placeholders found.** Every code step contains the actual file contents; every command step contains the actual command.
- **Type / name consistency:** `current` prop is typed identically across `Base`, `Header`, `MobileNav`. `portrait-shadow` class is defined in `global.css` (T8) and reused in `AboutIntro` (T10). `CollectionEntry<'works'>` is consistent with the collection name in `content.config.ts`.
- **Verification model deviation from default TDD:** explicitly called out at the top of the plan — visual ports do not have unit-test seams, so each task ends in build + type-check + manual browser parity instead.
