# Built by Brendan

Personal consulting site for Brendan Heussler, a software consultant based in San Diego, California.

## Local development

The project uses Vite and React. Both build and production server run Node 24 (active LTS).

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Production build

```bash
npm run build
```

The generated static site is written to `public/`. The build runs a client bundle, an SSR bundle, and `prerender.mjs`, which injects the rendered markup into `public/index.html` so the page is not a client-only shell.

## Docker

Build the complete production image:

```bash
docker compose build
```

Start it locally:

```bash
docker compose up -d
```

The container serves the site on port 80.

## Deployment

Pushing to `master` builds an arm64 image, publishes it to GHCR, and triggers the Portainer stack webhook on `apple-pi`. See `DEPLOYMENT.md`.

## Contact delivery

The contact form posts to a same-origin server endpoint, which relays the message through Resend. The destination address and API key exist only in the container environment; no email address is included in the browser bundle.

Copy `.env.example` to `.env` and provide `RESEND_API_KEY`, `CONTACT_TO`, and `CONTACT_FROM` before starting the container. The contact endpoint combines a JavaScript proof-of-work challenge with a honeypot, minimum completion time, origin validation, content checks, and IP-based rate limiting. These controls reduce automated submissions without adding a visible CAPTCHA.

## Primary files

- `index.html` — document shell, title, description, Open Graph, and icon links
- `src/App.jsx` — homepage structure and content
- `src/styles/site.css` — responsive visual system
- `static/brendan-profile.webp` — optimized profile artwork
- `server/index.js` — static server and protected contact relay
