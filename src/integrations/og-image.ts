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
 * Generates a 1200×630 Open Graph card at build time.
 *
 * Layout: left column carries the headline "KHIN / SANDAR / KYAW" in
 * Antonio Black plus a tagline in Inter; right column shows the
 * grayscale portrait. Matches the site's visual language and gives
 * social previews a clear brand headline.
 *
 * Stack: satori renders JSX → SVG with proper webfont embedding,
 * resvg-js rasterises to PNG, sharp encodes the final JPEG.
 *
 * Output: dist/og.jpg (~50-80 KB)
 */
export default function ogImage(): AstroIntegration {
  return {
    name: 'og-image',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const cwd = process.cwd();
        const outDir = fileURLToPath(dir);
        const outPath = path.join(outDir, 'og.jpg');

        const [antonioWoff, interWoff, portraitRaw] = await Promise.all([
          // Antonio 700 STATIC — public/fonts/antonio-900.woff2 is the variable
          // file (axis 100-700) and opentype.js trips on its fvar table.
          fs.readFile(path.join(cwd, 'src/integrations/fonts/antonio-700.woff2')),
          fs.readFile(path.join(cwd, 'public/fonts/inter-600.woff2')),
          fs.readFile(path.join(cwd, 'src/assets/profile.jpg')),
        ]);

        // satori needs SFNT (TTF/OTF); our shipped fonts are WOFF2.
        // Decompress in-memory. wawoff2 wraps a single WASM instance, so
        // concurrent decompress calls trample each other's heap — sequential.
        const antonioTtf = Buffer.from(await woff2ToTtf(antonioWoff));
        const interTtf = Buffer.from(await woff2ToTtf(interWoff));

        // Pre-process the portrait: cover-crop to a 4:5 box at the size
        // the layout reserves for it, grayscale + a touch of contrast to
        // match the home hero treatment, then encode as JPEG.
        const portraitW = 380;
        const portraitH = 475;
        const portrait = await sharp(portraitRaw)
          .resize(portraitW, portraitH, { fit: 'cover' })
          .grayscale()
          .modulate({ brightness: 1.02 })
          .linear(1.08, -10)
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer();
        const portraitDataUrl = `data:image/jpeg;base64,${portrait.toString('base64')}`;

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
                          children: 'LANDSCAPE PAINTER · YANGON, MYANMAR',
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
                      backgroundImage: `url(${portraitDataUrl})`,
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

        await sharp(png).jpeg({ quality: 88, mozjpeg: true }).toFile(outPath);

        logger.info(`Generated OG image at ${outPath}`);
      },
    },
  };
}
