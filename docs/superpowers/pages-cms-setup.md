# Pages CMS — setup and verification

One-time setup steps the developer runs, plus a one-page cheat sheet to hand to the artist.

## 1. Install the GitHub App on this repo

1. Sign in at https://app.pagescms.org with your GitHub account.
2. Authorize the **Pages CMS** GitHub App.
3. When prompted, grant access to **only this repo** (`portfolio`).

The app stores no secrets in the repo. Auth lives in your browser session.

## 2. Verify the image-path behavior (do this BEFORE inviting the artist)

This is the single most likely failure mode and the only thing in the config that cannot be confirmed without a live upload.

1. In the Pages CMS UI, open the repo on branch `astro-rewrite` (or whichever branch carries `.pages.yml`).
2. Open the **Works** collection → **+ New entry**.
3. Fill in any test title, year `2024`, alt text. In the **Painting image** field, upload one small JPG.
4. Save.
5. Pages CMS will create a commit on the branch. Pull it locally and look at the new `.md`:

   ```bash
   git pull
   cat src/content/works/<your-test-title>.md
   ```

6. **The `image:` line must look like one of these:**

   ```yaml
   image: ./images/your-test-image.jpg     # ✅ good — Astro image() accepts this
   image: /src/content/works/images/your-test-image.jpg   # ✅ also good — Astro accepts project-root paths
   ```

   **Bad outcome:**

   ```yaml
   image: src/content/works/images/your-test-image.jpg    # ❌ no leading ./ or /
   image: works/images/your-test-image.jpg                # ❌ wrong base
   ```

7. Run the build and confirm it still passes:

   ```bash
   npm run build
   ```

   If it builds, you're good. Delete the test entry from the Pages CMS UI and move on.

### If the image-path test fails

If `output: ./images` does not actually produce a leading `./` or `/`:

- First try changing `output:` in `.pages.yml` to `/src/content/works/images` and re-test. Astro's `image()` accepts project-root-absolute paths.
- If neither relative nor project-absolute works, the fallback is to change the schema in `src/content.config.ts`:

  ```ts
  // before
  image: image(),
  // after
  image: z.string(),   // stores a string path
  ```

  Then resolve the image at render time in `Tile.astro` using `import.meta.glob`:

  ```ts
  const allImages = import.meta.glob<{ default: ImageMetadata }>(
    '/src/content/works/images/*.{jpg,jpeg,png,webp}'
  );
  const imageModule = allImages[work.data.image.replace(/^\.?\//, '/')];
  const resolved = imageModule ? (await imageModule()).default : null;
  ```

  Trade-off: lose Astro's build-time guarantee that the file exists. Gain: any path format Pages CMS writes will work.

## 3. Invite the artist

In Pages CMS → repo settings → Collaborators → invite by email. She receives a magic link; commits made through her session are attributed via the Pages CMS GitHub App.

## 4. Cheat sheet to hand to the artist

> **Adding or editing a painting**
>
> 1. Open the bookmark to Pages CMS.
> 2. Click **Works** in the sidebar.
> 3. To add a new painting, click **+ New entry**. To edit, click an existing painting.
> 4. Fill in title, year, and the painting image (drag-and-drop or click to upload).
> 5. The **Order** number controls where the painting appears on the home page — lower numbers first. Use **10, 20, 30, 40…** so you have room to insert later without renumbering.
> 6. Click **Save**.
> 7. The new painting appears on the live site in about 1–2 minutes.
>
> **Before uploading an image:** resize it so the longest side is around 2000 pixels. Phone photos straight from the camera are too large for the website.
>
> **If a painting doesn't appear on the site after a few minutes:** ping the developer.

## Notes / known limitations

- No drag-to-reorder for collection entries — the artist edits the `Order` number directly.
- No preview / dry-run inside the CMS. If the artist saves bad data and the site build fails, she will not see the error in Pages CMS — only the developer notices via the GitHub Actions tab.
- No image resize on upload — large files commit to the repo at full size. Hence the resize instruction above.
- Commits push directly to the current branch. There is no PR-review flow.

## What if Pages CMS goes away?

Because the CMS only writes to plain `.md` files in the repo, the site keeps working with zero changes if Pages CMS is ever removed. Editors would just have to edit `.md` files directly.
