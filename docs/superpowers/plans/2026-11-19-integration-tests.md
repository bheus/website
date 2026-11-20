# Integration and Visual Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Playwright suite (behavior + exact-pixel screenshots) that runs the production build and server, so Dependabot bumps are judged automatically.

**Architecture:** Port of `~/Documents/GitHub/abraham/frontend/e2e` (read it for reference): a pinned linux/arm64 Playwright container builds the site, starts a fake Resend and `server/index.js`, and runs desktop + phone projects. CI runs it only on Dependabot PRs; a pre-push hook runs it locally.

**Tech Stack:** `@playwright/test` (Chromium), Node 24, Docker, GitHub Actions `ubuntu-24.04-arm`.

**Spec:** `docs/superpowers/specs/2026-11-19-integration-tests-design.md`

## Global Constraints

- Never put Brendan's email, a real API key, or `.env` contents in the repo, the container, logs, or screenshots. Test env uses `CONTACT_TO=test@example.com`, `CONTACT_FROM=site@example.com`, `RESEND_API_KEY=re_test`.
- Do not change `server/index.js` protections (proof-of-work, honeypot, 2500 ms timing, origin, validation, rate limits) to make tests pass.
- `expect.toHaveScreenshot`: `maxDiffPixels: 0, threshold: 0, animations: 'disabled', caret: 'hide'`; `updateSnapshots: 'none'`; `retries: 0`; `forbidOnly: true`.
- Projects: `desktop` 1440×900 @1x; `phone` 390×844 @3x, `isMobile`, `hasTouch`. Both `reducedMotion: 'reduce'`, `locale: 'en-US'`, `timezoneId: 'America/Los_Angeles'`, `colorScheme: 'light'`.
- Container image tag = `@playwright/test` version from `package-lock.json`; `--platform linux/arm64`.
- `ci-release.yml` is not modified. Use `docker compose`, never `docker-compose`.
- Follow the comment rules in `~/.claude/CLAUDE.md`: comment only non-obvious nuance.

## Review Focus

1. Second contact submission in one test file hits the 5/hour limit → each test must send a unique `X-Forwarded-For` (fixture, Task 2; asserted by Task 3's "five sends in one run" test).
2. Fake Resend unreachable or wrong path → server returns 502 and the success test fails loudly rather than hanging (Task 2 health-checks the fake before tests).
3. Footer `new Date().getFullYear()` drifts the screenshot on Jan 1 → fixed clock (Task 2; Task 4 baselines show 2026).
4. Web font not loaded at capture → fixture awaits `document.fonts.ready` (Task 2).
5. Running the suite on macOS host instead of the container produces mismatched baselines → `playwright.config.js` refuses to run unless `process.env.E2E_CONTAINER === '1'` (Task 1).

---

### Task 1: Container runner and config

**Files:**
- Create: `e2e/Dockerfile`, `e2e/run.sh`, `e2e/in-container.sh`, `playwright.config.js`, `e2e/functional/smoke.spec.js` (temporary, deleted in Task 3)
- Modify: `package.json` (devDependency + scripts), `.gitignore` (`playwright-report/`, `test-results/`), `.dockerignore` (`e2e/`, `playwright-report/`, `test-results/`)

**Interfaces:**
- Produces: `npm run test:e2e [-- playwright args]`, `npm run test:visual:update`, `npm run test:e2e:report`. Env inside container: `E2E_CONTAINER=1`, `CI` passthrough, `E2E_CACHE_DIR` (host) for npm cache.

- [ ] **Step 1:** `npm i -D @playwright/test@latest` (lockfile records version).
- [ ] **Step 2:** `e2e/Dockerfile`: `ARG PLAYWRIGHT_VERSION` / `FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble`, install `rsync`. Confirm the image's Node major is ≥ 24; if not, install Node 24 from NodeSource in the Dockerfile.
- [ ] **Step 3:** `e2e/run.sh` modeled on Abraham's: build image `website-e2e:<version>`, mount repo read-only at `/src`, mount out-dirs for `e2e/__screenshots__`, `playwright-report`, `test-results`, npm cache volume `website-e2e-npm`, pass `E2E_CONTAINER=1`.
- [ ] **Step 4:** `e2e/in-container.sh`: rsync `/src` → `/work` excluding `.git node_modules server/node_modules .env dist dist-ssr playwright-report test-results`; `npm ci`, `(cd server && npm ci)`, `npm run build`, `npx playwright test "$@"`; copy artifacts back; exit with Playwright's status.
- [ ] **Step 5:** `playwright.config.js` with Global Constraints values, `snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}'`, `testDir: './e2e'`, `testIgnore` for non-spec files, `reporter: [['list'], ['html', { open: 'never' }]]`, `use.baseURL: 'http://127.0.0.1:8080'`, and a top-level throw if `E2E_CONTAINER !== '1'`. `webServer`: `node server/index.js`, url `http://127.0.0.1:8080/health`, env `PORT=8080 ACCESS_LOG=false` plus the contact env from Global Constraints (Resend wired in Task 2).
- [ ] **Step 6:** Smoke spec: `GET /health` is 200.
- [ ] **Step 7:** Run `npm run test:e2e`. Expected: 2 passed (desktop, phone). Running `npx playwright test` on the host must fail with the container message.
- [ ] **Step 8:** Commit `test: add containerized Playwright runner`.

### Task 2: Fake Resend and test fixture

**Files:**
- Create: `e2e/fake-resend.mjs`, `e2e/fixtures.js`, `e2e/functional/fake-resend.spec.js`
- Modify: `playwright.config.js` (webServer becomes an array)

**Interfaces:**
- Produces from `e2e/fake-resend.mjs` (standalone server on `127.0.0.1:8099`): `POST /emails` → records body, replies per mode; `GET /__sent` → JSON array of recorded bodies; `POST /__mode` body `{ mode: 'ok' | 'error' }`; `POST /__reset`; `GET /__health` → 200. `ok` replies `200 {"id":"test-email"}`; `error` replies `422 {"name":"validation_error","message":"fake failure","statusCode":422}`.
- Produces from `e2e/fixtures.js`: `test` (extends Playwright `test`), `expect`, `allowFailures(page, matchers: Array<{ path?: string|RegExp, status?: number, console?: string|RegExp }>)`, `expectBaseline(target, name, options)` (records name for the stale guard, then `toHaveScreenshot`), `fakeResend: { sent(): Promise<object[]>, setMode(mode): Promise<void> }` fixture (resets before each test), `gotoSettled(page, path = '/')` (goto, `networkidle`, `document.fonts.ready`).
- Fixture behavior: `page.setExtraHTTPHeaders({ 'X-Forwarded-For': <unique per test, e.g. 10.0.<worker>.<counter>> })`; `page.clock.install({ time: new Date('2026-06-15T12:00:00-07:00') })` **only for timers that don't block the 2.5 s server check** — the server uses real time, so tests that submit must wait real time (use `page.waitForTimeout(2600)` after the challenge is fetched; this is the builder's call from the spec); fail the test on console errors, page errors, and `/api/` responses ≥ 400 unless allowed.

- [ ] **Step 1:** Write `fake-resend.spec.js`: with mode `ok`, a `POST` via `request` to `http://127.0.0.1:8099/emails` then `fakeResend.sent()` has length 1; after `setMode('error')` the POST returns 422.
- [ ] **Step 2:** Run it; expect FAIL (no fake server).
- [ ] **Step 3:** Implement `fake-resend.mjs` and `fixtures.js`; add the fake as first `webServer` (url `/__health`) and set `RESEND_BASE_URL=http://127.0.0.1:8099` on the site server (verify the SDK appends `/emails` to that base; adjust the fake's path if not).
- [ ] **Step 4:** Run; expect PASS on both projects.
- [ ] **Step 5:** Commit `test: add fake Resend and shared fixture`.

### Task 3: Functional tests

**Files:**
- Create: `e2e/functional/page.spec.js`, `e2e/functional/contact.spec.js`, `e2e/functional/unconfigured.spec.js`, `e2e/helpers.js`
- Delete: `e2e/functional/smoke.spec.js`
- Modify: `playwright.config.js` (third webServer: site on port 8081 with `RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM` unset; `unconfigured.spec.js` uses `test.use({ baseURL: 'http://127.0.0.1:8081' })`)

**Interfaces:**
- Produces `e2e/helpers.js`: `fillContact(page, { name, email, company?, message, website? })`, `submitContact(page)` (waits 2600 ms real time since page load, clicks "Send it", returns the `/api/contact` response).

These tests verify existing behavior, so each should pass on first run; prove each one can fail by temporarily breaking the asserted thing (e.g., edit a href in the built `dist/index.html` inside the container or change an expected string) before committing.

- [ ] **Step 1:** `page.spec.js`:
  - `prerendered HTML is complete`: `request.get('/')` text contains `I do serious software consulting`, `id="work"`, `id="about"`, `class="contact-form"`, and the four project hrefs.
  - `hydrates without errors` (fixture enforces) and form inputs become interactive.
  - `project links`: TurboTax → `https://turbotax.intuit.com/local-tax-offices/ny/new-york/d51a4afe6691489aa78ee8793a6bc278/`; Certified Pickleball Player → `https://www.certifiedpickleballplayer.com/`; Abraham CTA → `#contact`; GuiltySpark → `https://guiltyspark.builtbybrendan.com/`.
  - `privacy and copy`: served HTML and every `/assets/*.js` contain no `mailto:`, no `test@example.com`, and no `Poway` (case-insensitive).
  - `portrait is square`: `img[src="/brendan-profile.webp"]` bounding box width === height === 300 (desktop) / 180 (phone).
  - `fixed-path files`: `/robots.txt`, `/llms.txt`, `/favicon.ico` return 200.
- [ ] **Step 2:** `contact.spec.js`:
  - `sends a message`: fill valid fields, submit → 200, status text `Thanks — your message is on its way.`, `fakeResend.sent()` length 1 with `to` `test@example.com` and the message text.
  - `reports a Resend failure`: `setMode('error')`, `allowFailures` 502 on `/api/contact` → status shows `The message could not be delivered. Please try again later.`; nothing claims success.
  - `honeypot`: fill `website`, submit → no email recorded.
  - `too-fast submit`: submit without the 2600 ms wait (`allowFailures` 400) → `This browser could not be verified. Please try again.`, nothing recorded.
  - `required fields`: click "Send it" empty → no `/api/contact` request made.
  - `five sends in one run`: loop five successful sends from fresh pages → all succeed (proves per-test IPs isolate the rate limit).
- [ ] **Step 3:** `unconfigured.spec.js`: valid submit → 503, status `Contact delivery is temporarily unavailable.`
- [ ] **Step 4:** Run `npm run test:e2e`; all pass on both projects. Do the break-it check per test.
- [ ] **Step 5:** Commit `test: add functional coverage for page and contact form`.

### Task 4: Visual baselines and stale-baseline guard

**Files:**
- Create: `e2e/visual/page.spec.js`, `e2e/global-teardown.js`, `e2e/__screenshots__/**` (generated)
- Modify: `playwright.config.js` (`globalTeardown`)

**Interfaces:**
- Consumes: `expectBaseline`, `gotoSettled`, `fillContact`, `submitContact`, `fakeResend`.
- `global-teardown.js`: port Abraham's `isPartialRun` + `staleBaselines` (drop branch inventory); throws listing any PNG under `e2e/__screenshots__` not recorded by `expectBaseline` in a full run.

- [ ] **Step 1:** Specs: `full page` (`full-page.png`, `fullPage: true`); `contact sent` and `contact failed` (`contact-sent.png`, `contact-failed.png`, screenshot of `#contact`).
- [ ] **Step 2:** `npm run test:e2e` → FAIL with missing baselines (proves `updateSnapshots: 'none'`).
- [ ] **Step 3:** `npm run test:visual:update`, then open each PNG and check by eye: portrait round and correct size, footer year 2026, no animation mid-state, no email visible.
- [ ] **Step 4:** Run `npm run test:e2e` three times; all pass every time (determinism).
- [ ] **Step 5:** Add a dummy PNG under `__screenshots__`; full run fails naming it; delete it.
- [ ] **Step 6:** Commit `test: add visual baselines`.

### Task 5: CI workflow, pre-push hook, docs

**Files:**
- Create: `.github/workflows/e2e.yml`, `.githooks/pre-push`
- Modify: `AGENTS.md` (new **Testing** section), `CLAUDE.md` (validation guardrail line)

- [ ] **Step 1:** `e2e.yml`: name `Integration and visual tests`; `on: pull_request`; job `if: github.event.pull_request.user.login == 'dependabot[bot]'`; `runs-on: ubuntu-24.04-arm`; `permissions: contents: read`; concurrency by `head_ref` with cancel; checkout (same version as `ci-release.yml`), `actions/cache` on `${{ runner.temp }}/e2e-cache` keyed by `hashFiles('package-lock.json','server/package-lock.json')`; run `e2e/run.sh` with `CI=true E2E_CACHE_DIR=...`; upload `playwright-report/` and `test-results/` on failure, 14-day retention.
- [ ] **Step 2:** `.githooks/pre-push` modeled on Abraham's, with paths `^(src/|static/|server/|e2e/|index\.html$|prerender\.mjs$|vite\.config\.|package(-lock)?\.json$|playwright\.config\.js$)`; blocks on uncommitted changes in those paths; runs `npm run test:e2e`; failure message tells you to run `npm run test:visual:update` and review PNG diffs for intended changes. `chmod +x`.
- [ ] **Step 3:** Docs: how to run, update baselines, enable the hook (`git config core.hooksPath .githooks`), why it runs in a container, that CI covers only Dependabot PRs.
- [ ] **Step 4:** Verify: `git config core.hooksPath .githooks`; a push touching only docs skips the suite; `git diff --check` clean; `actionlint` (if installed) clean.
- [ ] **Step 5:** Commit `ci: run integration tests on Dependabot PRs and pre-push`.
