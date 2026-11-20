#!/usr/bin/env bash
# Runs inside the e2e image (see run.sh). Works on a copy so the read-only
# source mount and .env are never touched.
set -euo pipefail

rsync -a --exclude .git --exclude node_modules --exclude .env --exclude '.env.*' \
  --exclude dist --exclude dist-ssr --exclude .superpowers \
  --exclude playwright-report --exclude test-results \
  /src/ /work/
cd /work

npm ci --no-audit --no-fund --loglevel=error
(cd server && npm ci --no-audit --no-fund --loglevel=error)
npm run build --silent >/dev/null

status=0
npx playwright test "$@" || status=$?

rm -rf /out/playwright-report/* /out/test-results/*
cp -R playwright-report/. /out/playwright-report/ 2>/dev/null || true
cp -R test-results/. /out/test-results/ 2>/dev/null || true
cp -R e2e/__screenshots__/. /out/screenshots/ 2>/dev/null || true
exit "$status"
