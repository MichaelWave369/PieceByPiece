# GitHub Pages — playable PieceByPiece

The **game itself** is the website. GitHub Pages hosts the compiled Vite bundle, not repository source files.

**Expected public link, after initial deployment:**
https://michaelwave369.github.io/PieceByPiece/

## One-time owner setup

1. Merge the Pages workflow PR into `main`.
2. In [PieceByPiece Settings → Pages](https://github.com/MichaelWave369/PieceByPiece/settings/pages), choose **Build and deployment → Source → GitHub Actions**. GitHub's project-site hosting source must be enabled for the deployment action.
3. Visit the repository **Actions** tab, open **Publish PieceByPiece to GitHub Pages**, and inspect the run. If a deployment ran before Pages was configured, choose **Run workflow** (main) to try again. Wait for the deploy job to say success before announcing the site as live.

The workflow builds and publishes automatically whenever `main` changes. It also supports manual triggers. Pull requests do **not** deploy to the public site. The existing validation workflow exercises the Pages build and asset-path verification during PR checks.

## How it works

- `npm run build:pages` produces `dist/` with an explicit Vite base of `/PieceByPiece/`, required for project hosting.
- `npm run verify:pages` checks that the output HTML points to JS and CSS assets actually present under that base. This prevents accidental blank pages caused by root-relative asset URLs.
- `actions/upload-pages-artifact` uploads `dist/`, and `actions/deploy-pages` publishes it using the workflow's short-lived GitHub token. No deploy key, personal access token, hosting subscription, or third-party service required.
- The existing `npm run build` remains relative-path friendly for downloaded standalone builds.
- Campaign saves remain browser-local under the same keys as before. GitHub Pages does not receive or synchronize player progress.
- No external network calls are required by the in-game puzzle engine or city pack format; the page itself must be loaded online. Full offline reload support requires a later service-worker/cache rung.

## Testing

For local testing:
```bash
npm install
npm run check
npm run build:pages
npm run verify:pages
```

For normal local development, continue with `npm run dev`.

After successful deployment:

- Open the public site from a desktop browser and verify the game renders, the part tray works, and a placed piece remains saved after refresh.
- In a private window, confirm the game starts fresh and nothing reads another browser's saved progress.
- Open the published HTTPS URL in Quest Browser. Check Enter VR, both controller rays, puzzle selection, full-scale city mode, navigation, conversations, and circuit relays on physical hardware.
- Confirm the URL ends in `/PieceByPiece/` and JS/CSS assets return successfully rather than HTTP 404.
- A passing Actions build is not evidence of headset performance. Quest 3 comfort checks are still manual.

## Future custom domain

The GitHub Pages link is the initial canonical URL. A custom domain can be added later through repository Settings → Pages and DNS. Do not add a `CNAME` file or change Vite's base to `/` until a specific domain has been configured and tested.
