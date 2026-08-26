# Built by Brendan

Personal consulting site for Brendan Heussler, a software consultant based in San Diego, California.

## Local development

The project uses Gatsby 4 and expects Node 18.

```bash
npm install
npm run develop
```

Open `http://localhost:8000`.

## Production build

```bash
npm run build
```

The generated static site is written to `public/`.

## Docker

Build the complete production image:

```bash
docker compose build
```

Start it locally:

```bash
docker compose up -d
```

The container serves the site on port 80. The repository's `deploy.sh` script builds and deploys the image to `apple-pi`.

## Contact delivery

The contact form posts to a same-origin server endpoint. The destination address and SMTP credentials exist only in the container environment; no email address is included in the browser bundle.

Copy `.env.example` to `.env` and provide the SMTP values before starting the container. The contact endpoint combines a JavaScript proof-of-work challenge with a honeypot, minimum completion time, origin validation, content checks, and IP-based rate limiting. These controls reduce automated submissions without adding a visible CAPTCHA.

## Primary files

- `src/pages/index.jsx` — homepage structure and content
- `src/styles/site.css` — responsive visual system
- `static/brendan-profile.webp` — optimized profile artwork
- `server/index.js` — static server and protected contact relay
