# Agent Notes

This is the canonical product, design, and implementation brief for agents working on Brendan Heussler's personal consulting website. Preserve these decisions unless Brendan explicitly changes them.

## Product Direction

- This is a minimalist, single-page landing site for Brendan's software consulting and selected work.
- The experience should feel calm, capable, personal, and down to earth. Communicate that through restraint, spacing, color, typography, and landscape motifs—not by calling Brendan "chill."
- Brendan is based in **San Diego, California**. The visual atmosphere may draw from inland North County valleys: warm sun, rolling dry hills, trails, sage, clay, and quiet residential foothills.
- Never mention **Poway** in visible site copy. It is visual inspiration only.
- Do not say Brendan is "available for work." Use a straightforward **Contact me** section and let visitors initiate a conversation.
- Avoid generic startup/SaaS aesthetics, loud gradients, excessive animation, inflated claims, and sales-heavy prose.

## Current Visual System

- The page uses a warm editorial palette defined in `src/styles/site.css`: forest green, sage, cream, paper, sand, and clay.
- Landscape elements are made with CSS so the San Diego valley atmosphere stays subtle and fast-loading.
- Typography pairs a restrained system sans-serif with an editorial serif for selected accents.
- The layout should remain spacious and composed on desktop, then stack cleanly on mobile.
- Motion is quiet and optional. Respect `prefers-reduced-motion`.

### Profile image

- Use `static/brendan-profile.webp`, derived from Brendan's supplied illustrated portrait.
- Treat it as a small profile/headshot accent in the About section, never as a hero image or full-height desktop image.
- Keep the crop circular and explicitly square to prevent grid stretching.
- Current intended sizes are 300×300px desktop, 230×230px tablet, and 180×180px mobile. The centered two-column composition and `--portrait-size` rules in `src/styles/site.css` are intentional.
- On desktop, align the portrait near the heading rather than vertically centering it against the entire copy-and-values column.
- Preserve `object-fit: cover` and the current face-centered crop unless a replacement portrait is supplied.

## Content Decisions

The homepage separates **Professional work** from **Personal work**.

### Professional work

1. **TurboTax local stores and experts**
   - Explain the scalable system for hundreds of stores and thousands of expert pages that connect local customers with tax services.
   - Example destination: `https://turbotax.intuit.com/local-tax-offices/ny/new-york/d51a4afe6691489aa78ee8793a6bc278/`
2. **Certified Pickleball Player**
   - Present it as a player platform spanning credentials, personalized gear, community discovery, and match analysis.
   - Destination: `https://www.certifiedpickleballplayer.com/`

### Personal work

1. **Abraham**
   - Describe it as a trading algorithm/system.
   - The current claim is that it beats the S&P 500 **in historical testing**; preserve that qualification.
   - Do not label Abraham "private" or dwell on its access model.
   - There is no public product link. Send interested visitors to the contact section with language such as "Contact me to learn more."
2. **GuiltySpark**
   - Describe it as a log-monitoring/autonomous engineering tool that finds bugs in context and turns incidents into tested fixes.
   - Destination: `https://guiltyspark.builtbybrendan.com/`

Keep the prose confident but plainspoken. The work itself should establish credibility.

## Contact and Privacy

- Never put Brendan's email address in client HTML, JavaScript, metadata, a `mailto:` URL, or other browser-delivered assets.
- The form posts to the same-origin `/api/contact` endpoint in `server/index.js`. Destination and sender addresses exist only in server environment variables.
- Preserve the current anti-bot layers: one-time challenge, client-side SHA-256 proof of work, minimum completion time, honeypot, same-origin validation, content checks, and per-IP rate limiting.
- Do not replace failed delivery with a fake success response. A submission is successful only after the SMTP relay accepts it.
- SMTP configuration belongs in an uncommitted `.env`, using `.env.example` as the template. Never commit, print, or expose real credentials.
- Without SMTP variables, a valid local submission intentionally returns HTTP 503 with "Contact delivery is temporarily unavailable."
- At the time these notes were written, neither this checkout nor `/home/bheussler/website` on `apple-pi` had a real `.env`; contact delivery still requires configuration.
- HTML responses use `no-cache, max-age=0, must-revalidate` so redesigns do not remain hidden behind stale HTML. Fingerprinted JS and CSS remain immutable.

## Architecture

- **Frontend:** Vite building a custom React static page. Gatsby was removed once the page stopped using any Gatsby API; the build is `vite build` plus an SSR pass.
- **Prerendering:** `prerender.mjs` renders `src/App.jsx` to markup and injects it into `public/index.html`. The page must not ship as a client-only shell — crawlers and social unfurlers would receive an empty root element.
- **Head metadata:** plain tags in `index.html`. `react-helmet` was removed; it never worked here, because `gatsby-plugin-react-helmet` was not installed and the head block never reached the static HTML.
- **Styling:** Custom CSS in `src/styles/site.css`; the old `@lekoarts/gatsby-theme-minimal-blog` UI is no longer used.
- **Production runtime:** Node 18 serves the generated site and implements the protected contact relay. Production is no longer nginx-only.
- **Containerization:** Docker / Docker Compose.
- **Deployment target:** Raspberry Pi.

### Primary files

- `src/App.jsx` — homepage structure, copy, project cards, and contact form client logic
- `index.html` — document shell, title, description, Open Graph, and icon links
- `vite.config.js` / `prerender.mjs` — build configuration and the static prerender pass
- `src/styles/site.css` — responsive layout and visual system
- `static/brendan-profile.webp` — optimized portrait
- `server/index.js` — static server, cache/security headers, anti-bot validation, and SMTP relay
- `.env.example` — server-only contact configuration template
- `docker-compose.yml` — local/production container configuration
- `DEPLOYMENT.md` — Raspberry Pi deployment instructions

## Local Development and Validation

The build needs Node 22 or newer (Vite's floor). The production server still runs Node 18.

```bash
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

For the production container:

```bash
docker compose build
docker compose up -d
```

The Dockerized site is available at `http://localhost` on host port **80**; the Node process listens on container port **8080**.

Before handing off visual changes:

1. Run `git diff --check`.
2. Run a production build, preferably `docker compose build`.
3. Restart with `docker compose up -d` when local preview should reflect the change.
4. Verify `http://127.0.0.1/health` returns `{"ok":true}`.
5. Inspect both desktop and mobile layouts. Measure critical image dimensions in the browser when a crop or stretching bug is involved.
6. Run Lighthouse for material frontend changes. The redesign previously reached 98 Performance and 100 Accessibility, Best Practices, and SEO; avoid regressions.

## Docker Compose Command

**Always use Docker Compose V2:** `docker compose`, never the deprecated `docker-compose` command.

When updating scripts or documentation, preserve this command in `DEPLOYMENT.md` and other operational files.

## Deployment Notes

- Target host: `apple-pi` / `apple-pi.lan` (Raspberry Pi)
- User: `bheussler`
- Container name: `brendan-website`
- Public host port: 80
- Container port: 8080
- Orchestrated by the Portainer stack named `website` at <http://apple-pi.lan:9000>.
- Keep contact/SMTP values in the Portainer stack's environment variables, outside the Docker image and Git repository. An optional `.env` beside the compose file is still honored.

### Autodeploy

Pushing to `master` runs `.github/workflows/ci-release.yml`, which builds a native
arm64 image, publishes `ghcr.io/bheus/website:<sha>` and `:latest`, then POSTs the
Portainer stack webhook held in the `PORTAINER_WEBSITE_WEBHOOK` repository secret.
This mirrors the pipeline in the `guiltyspark` and `abraham` repositories.

Order matters: the webhook fires only after the image push, so Portainer never
redeploys onto a stale `:latest`. If the secret is absent the workflow still
publishes the image and simply skips the redeploy.

The secret must use the tunnel hostname `https://deploy.builtbybrendan.com/api/stacks/webhooks/<uuid>`,
not the `apple-pi.lan:9000` URL Portainer's UI displays — GitHub's runners cannot
resolve `apple-pi.lan`. Cloudflare exposes only that one path and 404s everything
else on the host, so the rest of the Portainer API stays unreachable.

Stack environment variables (contact/SMTP) reach the container only on redeploy;
saving them in Portainer alone changes nothing. Delivery uses Resend, whose API
key is shared with the `guiltyspark` stack — rotating it means updating both.

`docker-compose.yml` is the file Portainer deploys, so it must stand alone — no
`build:` section, and every variable needs an inline default, because Portainer
supplies no `.env` and no override file. `docker-compose.override.yml` is local
only and is what keeps `docker compose build` working on a laptop.

There is no manual deployment path any more. `deploy.sh`, `Dockerfile.simple`, and
`.dockerignore.simple` were removed with the Gatsby migration: they bypassed Portainer
and left the host on an image no commit pointed at. Deploy by pushing to `master`.

## Working Safely

- Preserve Brendan's unrelated uncommitted changes.
- Do not deploy to the Pi unless Brendan asks for deployment.
- Do not weaken the privacy or anti-bot behavior to make local demonstrations appear successful.
- If contact credentials are missing, explain the configuration requirement instead of inventing credentials or exposing an email address.
