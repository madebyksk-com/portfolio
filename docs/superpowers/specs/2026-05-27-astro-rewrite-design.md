# Astro + Tailwind Rewrite — Design Spec

**Date:** 2026-05-27
**Project:** Khin Sandar Kyaw portfolio (`portfolio/`)
**Status:** Design approved, ready for implementation plan

## Goal

Rewrite the existing static HTML/CSS/JS portfolio site as an Astro 5 project styled with Tailwind CSS v4, with artworks driven by an Astro content collection. The current visual design is preserved exactly. The site deploys to GitHub Pages at the custom domain `madebyksk.com`.

## Background

The current site (`old-html/`) is two static pages — `index.html` (hero + selected works strip) and `about.html` (bio + statement + contact) — sharing one ~800-line `index.css` and a small `index.js` (mobile menu toggle + cursor-driven shadow parallax). Two artwork tiles are hardcoded. Design tokens are already extracted as CSS variables. The folder name `old-html/` signals the rewrite was the planned next step.

## Goals

1. Migrate to Astro 5 (static output) with a clean component structure per page section.
2. Replace all styles with a Tailwind v4 reimplementation. Match the current look pixel-for-pixel.
3. Turn artworks into a content collection so adding a painting is a new file, not a code edit.
4. Self-host fonts (Antonio, Inter) instead of fetching from Google Fonts.
5. Use Astro's image pipeline (Sharp) for the painting tiles and portrait, replacing 3 MB PNGs with optimized WebP.
6. Deploy on every push to `main` via GitHub Actions to GitHub Pages on `madebyksk.com`.

## Non-Goals (explicitly out of scope)

- OG / social-share image and meta tags.
- Sitemap and `robots.txt`.
- Analytics.
- A real form for the "INQUIRE" CTA — it stays a `mailto:` link.
- Per-painting detail pages at `/works/[slug]`. The content collection schema supports it, but no route is added.

## Stack

- **Astro 5** — static output, zero JS by default.
- **Tailwind CSS v4** via `@tailwindcss/vite` (CSS-first config; no `tailwind.config.js`).
- **TypeScript** for the content collection schema (`src/content.config.ts`); component files are `.astro`.
- **Sharp** — Astro's default image service.
- **No UI framework** — mobile menu + cursor parallax remain ~50 lines of vanilla JS in a `<script>`.
- **Package manager:** npm.

## Folder structure

The Astro project lives at the repo root. `old-html/` is kept during the rewrite as a visual reference and deleted once the new site is verified.

```
portfolio/
├── old-html/                       # kept until verified, then removed
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── public/
│   ├── CNAME                       # contains: madebyksk.com
│   ├── fonts/                      # self-hosted Antonio + Inter WOFF2s
│   └── svg/                        # arrow-right-up, paint-mark-1
├── src/
│   ├── styles/global.css           # Tailwind import + @theme tokens + @font-face + small custom rules
│   ├── layouts/Base.astro          # html/head/fonts/header/footer/mobile-nav/interactions script
│   ├── components/
│   │   ├── Header.astro
│   │   ├── MobileNav.astro
│   │   ├── Hero.astro
│   │   ├── WorksStrip.astro
│   │   ├── Tile.astro
│   │   ├── AboutIntro.astro
│   │   ├── Statement.astro
│   │   ├── ContactList.astro
│   │   ├── Footer.astro
│   │   └── ArrowUpRight.astro
│   ├── scripts/interactions.ts     # mobile menu + parallax
│   ├── content.config.ts           # works collection schema
│   ├── content/works/
│   │   ├── fisherman-at-inle.md
│   │   ├── thingyan-festival.md
│   │   └── images/                 # painting source files referenced from the .md frontmatter
│   ├── assets/profile.jpg          # processed by Astro Image
│   └── pages/
│       ├── index.astro
│       └── about.astro
└── .github/workflows/deploy.yml
```

## Content collection

### Schema (`src/content.config.ts`)

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const works = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/works' }),
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

Description is the markdown body of each file (not a frontmatter field), so it can be a paragraph or two with light formatting. No UI surfaces it today; it is stored for future use.

### Example file (`src/content/works/fisherman-at-inle.md`)

```md
---
title: Fisherman at Inle
year: 2024
medium: Oil on canvas
image: ./images/fisherman-at-inle.jpg
alt: Fisherman at sunset on Inle Lake
order: 1
dimensions: 30 × 40 in
location: Inle Lake
---

A still morning on Inle, the lone fisherman framed against the sunrise…
```

### Rendering

`WorksStrip.astro` calls `getCollection('works')`, sorts by `order` ascending, and maps each entry to a `Tile`. `Tile` uses `<Image>` from `astro:assets` for responsive WebP output.

### File renames

The existing painting files are renamed during the migration to match slug-friendly names:

- `old-html/images/arts/sunset.png` → `src/content/works/images/fisherman-at-inle.jpg`
- `old-html/images/arts/thingyan.png` → `src/content/works/images/thingyan-festival.jpg`

(PNG → JPG is acceptable because Astro re-encodes to WebP at build time anyway; JPG is fine as a source.)

## Tailwind v4 translation

### Tokens (`src/styles/global.css`)

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

/* CSS variables JS writes at runtime live outside @theme */
:root {
  --shadow-offset: 14px;
  --shadow-parallax-x: 0px;
  --shadow-parallax-y: 0px;
}
@media (min-width: 768px) { :root { --shadow-offset: 20px; } }
@media (min-width: 1024px) { :root { --shadow-offset: 24px; } }
```

Breakpoints (`md=768`, `lg=1024`) already match Tailwind defaults — no override needed.

### Translation rules

| Current CSS | Tailwind v4 |
|---|---|
| `font-size: clamp(72px, 22vw, 110px)` | `text-[clamp(72px,22vw,110px)]` |
| `mix-blend-mode: difference` | `mix-blend-difference` |
| `backdrop-filter: blur(14px) saturate(1.2)` | `backdrop-blur-[14px] backdrop-saturate-150` |
| `aspect-ratio: 4 / 5` | `aspect-[4/5]` |
| `letter-spacing: 0.32em` | `tracking-[0.32em]` |
| `container-type: inline-size` + `@container (min-width: 1024px)` | `@container` + `@[1024px]:…` (v4 native container queries) |
| `@media (prefers-reduced-motion: reduce)` | `motion-reduce:…` variants |
| Desktop hero absolute positioning (`top: 50px`, etc.) | `top-[50px]`, `left-0`, etc. |

### What stays as plain CSS (in `global.css`)

These four bits don't translate cleanly into utilities and stay as small, named CSS rules:

1. `@font-face` declarations for self-hosted Antonio and Inter WOFF2s.
2. The wordmark paint-splash decoration (`.wordmark::before` background-image + hover rotation).
3. The portrait + studio-photo shadow `::before`, whose `transform` references runtime CSS variables (`--shadow-parallax-x/y`).
4. Global reduced-motion reset (`*, *::before, *::after { animation-duration: 0.01ms !important; … }`).

Total custom CSS is expected to be well under 80 lines.

## Interactions

`src/scripts/interactions.ts`, loaded once in `Base.astro`:

- Mobile menu toggle (identical to current `index.js` behavior).
- Cursor parallax — writes `--shadow-parallax-x` and `--shadow-parallax-y` on `document.documentElement`, gated on `(pointer: fine)` and `(prefers-reduced-motion: no-preference)`.

## Fonts

Self-hosted as WOFF2 in `public/fonts/`:

- Antonio — weights 700, 900.
- Inter — weights 400, 500, 600, 700.

`@font-face` declarations in `global.css` use `font-display: swap`. The two display weights (Antonio 900, Inter 400) are preloaded from `<head>` in `Base.astro`.

## Image strategy

- **Paintings** — live next to their `.md` files in `src/content/works/images/`. Referenced via `image()` in the schema. Rendered with `<Image>` from `astro:assets` (auto WebP, responsive `srcset`, lazy by default).
- **Portrait** — `src/assets/profile.jpg`, imported into `Hero` and `AboutIntro`, rendered with `<Image>`. Eager-loaded on the home hero.
- **SVG icons** (arrow-right-up, paint-mark-1) — `public/svg/`, referenced as `background-image` from CSS. Not run through the image pipeline.

Expected payload reduction: the two 3 MB PNGs will end up well under 500 KB each as WebP at typical viewport sizes.

## Deployment

### `astro.config.mjs`

```js
import { defineConfig } from 'astro';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://madebyksk.com',
  output: 'static',
  vite: { plugins: [tailwindcss()] },
});
```

No `base` because the custom domain serves the site at root.

### Custom domain

- `public/CNAME` contains the single line `madebyksk.com`. Astro copies `public/` verbatim into `dist/`, so the file ends up at the root of the published site, which is what GitHub Pages expects.
- DNS records (A/AAAA for the apex, CNAME for `www`) must be set on the registrar to point at GitHub Pages. This is a manual step outside the codebase; the implementation plan will list the exact record values.

### GitHub Actions (`.github/workflows/deploy.yml`)

Standard `withastro/action@v3` workflow:

- Triggers on push to `main` and on manual `workflow_dispatch`.
- Node 20, `npm ci`, `astro build`, uploads `dist/` as a Pages artifact.
- A second job deploys via `actions/deploy-pages@v4`.
- On first run: in GitHub repo settings, **Settings → Pages → Source = GitHub Actions**.

## Component breakdown

| Component | Used on | Purpose |
|---|---|---|
| `Base.astro` (layout) | both pages | html/head, font preload, body, header slot, main slot, footer slot, mounts `interactions.ts` |
| `Header.astro` | both | topbar with wordmark, desktop nav, INQUIRE CTA, mobile MENU button |
| `MobileNav.astro` | both | full-screen overlay shown when `body.menu-open` |
| `Footer.astro` | both | bottom row with copyright + IG/FB/email links |
| `ArrowUpRight.astro` | scattered | the small `↗` icon used in labels and links |
| `Hero.astro` | `index` | year + headline (KHIN / SANDAR / KYAW) + portrait + bio + hero-bottom row |
| `WorksStrip.astro` | `index` | iterates `works` collection sorted by `order`, renders `Tile`s |
| `Tile.astro` | `index` (via WorksStrip) | one painting with caption overlay |
| `AboutIntro.astro` | `about` | studio photo + multi-paragraph bio |
| `Statement.astro` | `about` | pull-quote |
| `ContactList.astro` | `about` | EMAIL/INSTAGRAM/FACEBOOK/STUDIO/COMMISSIONS rows |

Pages (`index.astro`, `about.astro`) compose these inside `Base.astro`.

## Dev workflow

- `npm install` once.
- `npm run dev` — preview at `http://localhost:4321`.
- `npm run build` — produces `dist/`.
- `npm run preview` — serves the production build locally for verification.

## Verification

Before deleting `old-html/`:

1. Side-by-side compare at all three breakpoints (mobile, tablet ≥768, desktop ≥1024) for both `index` and `about`.
2. Confirm cursor parallax + mobile menu still behave correctly.
3. Confirm `(prefers-reduced-motion: reduce)` disables both.
4. Confirm Lighthouse scores haven't regressed (expect them to improve due to image optimization + self-hosted fonts).
5. Confirm GitHub Pages serves the site on `madebyksk.com` with valid HTTPS.

## Open follow-ups (after this rewrite ships)

- OG image + meta.
- Sitemap.
- Analytics choice.
- Decide whether per-painting detail pages are worth adding once there are more than ~6 paintings.
