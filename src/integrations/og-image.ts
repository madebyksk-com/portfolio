import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
// @ts-expect-error — wawoff2 has no published type declarations
import wawoff2 from 'wawoff2';
const woff2ToTtf: (buf: Uint8Array) => Promise<Uint8Array> = wawoff2.decompress;
import type { AstroIntegration } from 'astro';

/**
 * Generates Open Graph cards at build time.
 *
 * Two cards, same editorial layout (brand headline left, image right
 * on the cream background) — differ only in the image they feature:
 *
 *   dist/og.jpg        — portrait of the artist; used by / and /about
 *   dist/og-works.jpg  — first painting (by `order`); used by /works
 *
 * Stack: satori renders JSX → SVG with proper webfont embedding,
 * resvg-js rasterises to PNG, sharp encodes the final JPEG.
 */
export default function ogImage(): AstroIntegration {
  return {
    name: 'og-image',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const cwd = process.cwd();
        const outDir = fileURLToPath(dir);

        const [antonioWoff, interWoff] = await Promise.all([
          // Antonio 700 STATIC — public/fonts/antonio-900.woff2 is the variable
          // file (axis 100-700) and opentype.js trips on its fvar table.
          fs.readFile(path.join(cwd, 'src/integrations/fonts/antonio-700.woff2')),
          fs.readFile(path.join(cwd, 'public/fonts/inter-600.woff2')),
        ]);

        // satori needs SFNT (TTF/OTF); our shipped fonts are WOFF2.
        // Decompress in-memory. wawoff2 wraps a single WASM instance, so
        // concurrent decompress calls trample each other's heap — sequential.
        const antonioTtf = Buffer.from(await woff2ToTtf(antonioWoff));
        const interTtf = Buffer.from(await woff2ToTtf(interWoff));

        const renderCard = async (opts: {
          imageBuffer: Buffer;
          grayscale: boolean;
          tagline: string;
          outPath: string;
        }) => {
          const portraitW = 380;
          const portraitH = 475;

          let pipeline = sharp(opts.imageBuffer).resize(portraitW, portraitH, {
            fit: 'cover',
          });
          if (opts.grayscale) {
            pipeline = pipeline
              .grayscale()
              .modulate({ brightness: 1.02 })
              .linear(1.08, -10);
          }
          const image = await pipeline
            .jpeg({ quality: 82, mozjpeg: true })
            .toBuffer();
          const imageDataUrl = `data:image/jpeg;base64,${image.toString('base64')}`;

          const svg = await satori(
            {
              type: 'div',
              props: {
                style: {
                  width: 1200,
                  height: 630,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '60px 80px',
                  background: '#FAF7F2',
                  color: '#1A1410',
                  fontFamily: 'Inter',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        flex: 1,
                        gap: 28,
                      },
                      children: [
                        {
                          type: 'div',
                          props: {
                            style: {
                              display: 'flex',
                              flexDirection: 'column',
                              fontFamily: 'Antonio',
                              fontWeight: 700,
                              fontSize: 130,
                              lineHeight: 0.9,
                              letterSpacing: '-0.02em',
                            },
                            children: [
                              { type: 'span', props: { children: 'KHIN' } },
                              { type: 'span', props: { children: 'SANDAR' } },
                              { type: 'span', props: { children: 'KYAW' } },
                            ],
                          },
                        },
                        {
                          type: 'div',
                          props: {
                            style: {
                              fontFamily: 'Inter',
                              fontWeight: 600,
                              fontSize: 18,
                              letterSpacing: '0.2em',
                              marginTop: 8,
                            },
                            children: opts.tagline,
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        width: portraitW,
                        height: portraitH,
                        display: 'flex',
                        marginLeft: 40,
                        backgroundImage: `url(${imageDataUrl})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      },
                    },
                  },
                ],
              },
            },
            {
              width: 1200,
              height: 630,
              fonts: [
                { name: 'Antonio', data: antonioTtf, weight: 700, style: 'normal' },
                { name: 'Inter', data: interTtf, weight: 600, style: 'normal' },
              ],
            },
          );

          const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } })
            .render()
            .asPng();

          await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(opts.outPath);

          logger.info(`Generated OG image at ${opts.outPath}`);
        };

        // Apple touch icon: 180×180 opaque PNG of the favicon mark on
        // the brand's cream background. iOS home-screen icons can't use
        // adaptive SVG and don't honour transparency, so this is its
        // own pre-rendered artefact.
        const faviconSvg = await fs.readFile(
          path.join(cwd, 'public/favicon.svg'),
          'utf8',
        );
        const appleIconPng = new Resvg(faviconSvg, {
          fitTo: { mode: 'width', value: 360 },
          background: '#FAF7F2',
        })
          .render()
          .asPng();
        await sharp(appleIconPng)
          .resize(180, 180)
          .png({ quality: 95 })
          .toFile(path.join(outDir, 'apple-touch-icon.png'));
        logger.info(`Generated apple-touch-icon.png`);

        // Card 1: portrait — used by / and /about.
        const portraitBuffer = await fs.readFile(
          path.join(cwd, 'src/assets/profile.jpg'),
        );
        await renderCard({
          imageBuffer: portraitBuffer,
          grayscale: true,
          tagline: 'LANDSCAPE PAINTER · YANGON, MYANMAR',
          outPath: path.join(outDir, 'og.jpg'),
        });

        // Card 2: first painting (by `order`) — used by /works.
        const firstPaintingPath = await findFirstPaintingImage(cwd);
        if (firstPaintingPath) {
          const paintingBuffer = await fs.readFile(firstPaintingPath);
          await renderCard({
            imageBuffer: paintingBuffer,
            grayscale: false,
            tagline: 'SELECTED OIL PAINTINGS · MYANMAR',
            outPath: path.join(outDir, 'og-works.jpg'),
          });
        } else {
          logger.warn('No paintings found for /works OG card');
        }
      },
    },
  };
}

/**
 * Find the painting with the lowest `order` value in the works
 * collection. Returns the absolute filesystem path to its image, or
 * an empty string if no paintings exist. Pragmatic frontmatter parse
 * (line-based regex) — sufficient for our flat schema, no YAML dep.
 */
async function findFirstPaintingImage(cwd: string): Promise<string> {
  const worksDir = path.join(cwd, 'src/content/works');
  const files = await fs.readdir(worksDir);
  let best: { order: number; imagePath: string } = {
    order: Infinity,
    imagePath: '',
  };
  for (const f of files) {
    if (!f.endsWith('.md')) continue;
    const text = await fs.readFile(path.join(worksDir, f), 'utf8');
    const fmMatch = text.match(/^---\n([\s\S]+?)\n---/);
    if (!fmMatch) continue;
    const fm = fmMatch[1];
    const orderStr = fm.match(/^order:\s*(\d+)/m)?.[1];
    const imageStr = fm.match(/^image:\s*(.+?)$/m)?.[1]?.trim();
    if (!imageStr) continue;
    const order = orderStr ? parseInt(orderStr, 10) : 999;
    if (order < best.order) {
      // Image path in frontmatter is relative to the .md file
      // (Pages CMS writes either ./images/foo.jpg or images/foo.jpg).
      best = {
        order,
        imagePath: path.resolve(worksDir, imageStr),
      };
    }
  }
  return best.imagePath;
}
