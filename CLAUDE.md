# Claude Project Guide

Read `AGENTS.md` before changing this project. It is the canonical, detailed handoff for product direction, architecture, validation, and deployment. The constraints below are the most important design decisions to preserve.

## Design Brief

- Build a minimalist, editorial landing page for Brendan Heussler's software consulting.
- The site should feel calm, capable, approachable, and down to earth through its design—not by literally calling Brendan "chill."
- Visible location copy should say **San Diego, California**.
- The warm sun, rolling hills, sage, clay, trails, and inland-valley atmosphere may be inspired by Poway, but **never say Poway on the site**.
- Do not advertise "available for work." Keep a simple **Contact me** section.
- Avoid generic SaaS styling, noisy effects, inflated language, and pushy sales copy.

## Work to Feature

Maintain the split between professional and personal projects:

- **TurboTax local stores and experts:** scalable discovery and profile infrastructure for hundreds of stores and thousands of experts serving local customers.
- **Certified Pickleball Player:** credentials, gear, community discovery, and match analysis.
- **Abraham:** a trading algorithm that beats the S&P 500 in historical testing. Keep the historical-testing qualifier, do not call it private, and link its CTA to the contact section.
- **GuiltySpark:** a log monitor/autonomous engineering tool that finds bugs and produces tested fixes.

The exact approved destinations and current copy are documented in `AGENTS.md` and implemented in `src/App.jsx`.

## Portrait

- Use `static/brendan-profile.webp` only as a compact circular headshot in the About section.
- Never make it a hero, full-height, or dominant desktop image.
- Preserve explicit square dimensions: 300px desktop, 230px tablet, and 180px mobile. Keep the combined portrait-and-copy block horizontally centered, with the desktop portrait aligned near the heading rather than the full copy column. These rules prevent the face from stretching into a tall oval or drifting toward the page edge.

## Privacy and Contact Form

- Never expose Brendan's email in HTML, JavaScript, metadata, `mailto:` links, screenshots, logs, or committed files.
- Keep contact delivery server-side through `/api/contact` and SMTP environment variables.
- Preserve the proof-of-work challenge, honeypot, timing check, origin validation, content validation, and rate limits.
- Never fake a successful send when SMTP is unavailable.
- Real values belong only in an ignored `.env`; use `.env.example` as a template.
- Missing SMTP configuration currently produces the intentional "Contact delivery is temporarily unavailable" response. Configure the environment rather than bypassing it.

## Technical Guardrails

- Vite frontend with custom React and CSS; do not restore Gatsby or the retired minimal-blog theme.
- The build prerenders the page through `prerender.mjs`. Never let it degrade to a client-only shell.
- Head metadata lives in `index.html` as plain tags. Do not reintroduce `react-helmet`.
- Node 18 production server handles static files and the contact relay; do not assume nginx-only hosting.
- Dockerized preview is on host port 80 and container port 8080. The dev server uses port 5173.
- Always use `docker compose`, never `docker-compose`.
- Pushing to `master` autodeploys: CI publishes `ghcr.io/bheus/website:latest` and then triggers the Portainer `website` stack webhook on `apple-pi`.
- `docker-compose.yml` is deployed by Portainer by itself. Keep it free of `build:` and give every variable an inline default. Local `docker compose build` comes from `docker-compose.override.yml`.
- Do not deploy to `apple-pi` by hand unless Brendan explicitly requests it.
- Validate material changes with `git diff --check`, a production build, desktop/mobile inspection, `/health`, and Lighthouse where appropriate.
- Deployment is autodeploy only; there is no `deploy.sh` fallback.

## Known Issues

`AGENTS.md` has a **Known Issues** section covering the Cloudflare cache override, two
failing accessibility audits, and a mobile FCP regression. Read it before assuming a
surprising measurement is new, and note that the cache issue is a Cloudflare zone
setting — changing `server/index.js` will not fix it, and neither will fingerprinting
the affected files. `robots.txt` and `llms.txt` are fetched at fixed well-known paths
and can never be hashed; `favicon.ico` is probed at the root the same way.

If this file and `AGENTS.md` ever disagree, follow `AGENTS.md` and update this summary to match.
