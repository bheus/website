# Integration and visual tests

## Why

Dependabot opens dependency bumps (React 19 is waiting in #33/#34) and today the only
check is whether the Docker image builds. We want a suite that says, without a manual
look, whether a library update changed how the site behaves or looks.

## Goals

- Exercise the production path: `npm run build` (Vite + SSR + `prerender.mjs`), then
  `server/index.js` serving `dist/` and the contact relay.
- Behavior tests and exact-pixel screenshots at desktop and phone sizes.
- Run automatically on Dependabot PRs; run locally before pushes that touch the UI.

## Non-goals

- Unit tests, Lighthouse in CI, cross-browser coverage (Chromium only).
- Testing real Resend delivery.

## Anti-goals

- Flaky screenshots that train us to rerun or blindly update baselines.
- Any test setup that puts Brendan's email or a real API key in the repo, logs, or
  screenshots.
- Weakening a contact-form protection to make it testable.
- Slowing or gating the master autodeploy.

## Approaches

1. **Port Abraham's pattern, trimmed** — pinned Playwright container, exact pixels,
   Dependabot-only CI job plus pre-push hook. **Chosen**: deterministic baselines,
   proven in Abraham.
2. Host-run Playwright with a pixel tolerance — no Docker, but macOS and Linux
   rasterize differently and the tolerance hides small regressions.
3. Add a stage to `ci-release.yml` — one workflow, but every master push pays for it
   and a flaky shot could block deploys.

## Design

Mirrors `abraham/frontend/e2e` and `.github/workflows/frontend-e2e.yml`; drop the
scenarios, chart settling, and branch-coverage inventory, which have no equivalent here.

**Layout:** `e2e/` at the repo root with `Dockerfile`, `run.sh`, `in-container.sh`,
`fixtures.js`, `global-teardown.js`, `fake-resend.mjs`, `functional/*.spec.js`,
`visual/*.spec.js`, `__screenshots__/{desktop,phone}/...`. `playwright.config.js` at
the root. `@playwright/test` as a devDependency; npm scripts `test:e2e`,
`test:visual:update`, `test:e2e:report`.

**Container:** `mcr.microsoft.com/playwright:v<lockfile version>-noble`, linux/arm64,
version read from `package-lock.json`. Works on an rsync'd copy excluding `.env`,
`node_modules`, `.git`; runs `npm ci` (root and `server/`), `npm run build`, then
Playwright. Copies the report, results and screenshots back out.

**Config:** desktop 1440×900 @1x and phone 390×844 @3x touch; `maxDiffPixels: 0`,
`threshold: 0`, `animations: 'disabled'`, `updateSnapshots: 'none'`, `retries: 0`,
`forbidOnly`; locale `en-US`, timezone `America/Los_Angeles`, light scheme,
`reducedMotion: 'reduce'` (the `.reveal` animation). `webServer` starts the fake
Resend and `node server/index.js` on 8080 with test env: dummy `RESEND_API_KEY`,
`CONTACT_TO=test@example.com`, `CONTACT_FROM=site@example.com`,
`RESEND_BASE_URL` pointed at the fake, `ACCESS_LOG=false`; health URL `/health`.

**Fixture:** fails the test on any console error, page error, or unexpected 4xx/5xx
(tests can declare expected ones); waits for `document.fonts.ready`; installs a fixed
clock so the footer year is stable. Each test sends a unique `X-Forwarded-For` so the
5-per-hour submission limit never couples tests (the server already trusts the proxy
header by default).

**Fake Resend:** a tiny HTTP server that records `POST /emails` bodies and can be told
per test to succeed or return an error payload. Exposes the recorded mail for
assertions.

**Functional tests:**
- Raw HTML (JS disabled) already contains the hero, all four projects, About, and the
  contact form — never a client-only shell.
- Hydration produces no React warnings or errors.
- Project links point at the approved destinations in `AGENTS.md`; Abraham's CTA
  targets `#contact`; "San Diego, California" present; "Poway" absent; no `mailto:`
  and no `CONTACT_TO` value anywhere in the served HTML/JS.
- Portrait renders square at 300/180 px on desktop/phone.
- Contact form: valid send shows success and the fake received the message; Resend
  error → 502 and an honest failure message; server started without config →
  "Contact delivery is temporarily unavailable" (separate server instance or project);
  filled honeypot and too-fast submit are rejected; client validation blocks empty
  fields.
- `/health` returns OK; `robots.txt`, `llms.txt`, `favicon.ico` served.

**Visual tests:** full page, plus the contact section in its sent and failed states,
per project.

**Teardown guard:** fails a full run when a baseline PNG on disk is no longer used.

**CI:** `.github/workflows/e2e.yml` on `pull_request`, only when the author is
`dependabot[bot]`, on `ubuntu-24.04-arm`; caches npm; uploads the report on failure.
`ci-release.yml` unchanged.

**Pre-push hook:** `.githooks/pre-push` runs the suite when pushed commits touch
`src/`, `static/`, `index.html`, `server/`, `prerender.mjs`, `vite.config.*`,
`package*.json`, or `e2e/`; refuses if those paths have uncommitted changes. Enabled
with `git config core.hooksPath .githooks` (documented in `AGENTS.md`).

**Docs:** add a Testing section to `AGENTS.md` and a line to `CLAUDE.md`'s validation
guardrail.

## Left to the builder

- Exact wording of assertions and test names.
- How the "unconfigured" server instance is started (second `webServer` entry vs a
  dedicated project).
- Whether the timing check is satisfied by a real 2.5 s wait or by spacing actions.

## Follow-up (not this work)

Group `react`/`react-dom` in `.github/dependabot.yml`, then let the new suite judge the
React 19 PR.
