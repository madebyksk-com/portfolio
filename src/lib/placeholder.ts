import fs from 'node:fs/promises';
import sharp from 'sharp';
import { rgbaToThumbHash, thumbHashToDataURL } from 'thumbhash';
import type { ImageMetadata } from 'astro';

// In-process memo so repeated builds within the same dev server don't
// re-read and re-hash the same file. Keyed on fsPath; cleared on dev restart.
const cache = new Map<string, string>();

/**
 * Generate a ThumbHash data-URL placeholder from an Astro ImageMetadata.
 *
 * Runs at build time only. Reads the source file via Sharp, downscales to
 * at most 100px on the long edge, encodes a ThumbHash, decodes back to a
 * tiny PNG data URL suitable for `background-image:` on the tile wrapper.
 */
export async function getPlaceholder(image: ImageMetadata): Promise<string> {
  const fsPath = (image as ImageMetadata & { fsPath?: string }).fsPath;
  if (!fsPath) {
    throw new Error(
      'ImageMetadata.fsPath is not present — getPlaceholder requires Astro 5+.',
    );
  }

  const cached = cache.get(fsPath);
  if (cached) return cached;

  const buf = await fs.readFile(fsPath);
  const { data, info } = await sharp(buf)
    .resize(100, 100, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hash = rgbaToThumbHash(info.width, info.height, new Uint8Array(data));
  const url = thumbHashToDataURL(hash);
  cache.set(fsPath, url);
  return url;
}
