import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import type { AstroIntegration } from 'astro';

/**
 * Generates a 1200×630 Open Graph image at build time.
 *
 * Composites the portrait centered on a cream canvas matching the site's
 * background color. One file, one size — the only size all major social
 * platforms (Facebook, Twitter, LinkedIn, iMessage, WhatsApp) crop from.
 *
 * Output: dist/og.jpg
 * Source: src/assets/profile.jpg
 */
export default function ogImage(): AstroIntegration {
  return {
    name: 'og-image',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const srcPath = path.join(process.cwd(), 'src/assets/profile.jpg');
        const outDir = fileURLToPath(dir);
        const outPath = path.join(outDir, 'og.jpg');

        // Portrait sized to fit on a 1200×630 canvas with breathing room.
        // 530px tall preserves the 4:5 source ratio → 424×530, centered.
        const portraitHeight = 530;
        const portraitWidth = Math.round(portraitHeight * (4 / 5));

        const resized = await sharp(srcPath)
          .resize(portraitWidth, portraitHeight, { fit: 'cover' })
          .grayscale()
          .modulate({ brightness: 1.02 })
          .toBuffer();

        await sharp({
          create: {
            width: 1200,
            height: 630,
            channels: 3,
            background: { r: 0xfa, g: 0xf7, b: 0xf2 },
          },
        })
          .composite([
            {
              input: resized,
              left: Math.round((1200 - portraitWidth) / 2),
              top: Math.round((630 - portraitHeight) / 2),
            },
          ])
          .jpeg({ quality: 88, mozjpeg: true })
          .toFile(outPath);

        logger.info(`Generated OG image at ${outPath}`);
      },
    },
  };
}
