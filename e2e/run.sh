#!/usr/bin/env bash
# Run the Playwright suite in the pinned linux/arm64 container.
# Usage: e2e/run.sh [playwright test args…]   e.g. --update-snapshots
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
version="$(node -p "require('$repo/package-lock.json').packages['node_modules/@playwright/test'].version")"
image="website-e2e:$version"

docker build --quiet --platform linux/arm64 --build-arg "PLAYWRIGHT_VERSION=$version" \
  -t "$image" "$repo/e2e" >/dev/null

# The npm cache persists between runs: a named volume locally, a host dir in CI.
if [[ -n "${E2E_CACHE_DIR:-}" ]]; then
  mkdir -p "$E2E_CACHE_DIR/npm"
  cache=(-v "$E2E_CACHE_DIR/npm:/root/.npm")
else
  cache=(-v website-e2e-npm:/root/.npm)
fi

tty=()
[[ -t 0 && -t 1 ]] && tty=(-it)

mkdir -p "$repo/e2e/__screenshots__" "$repo/playwright-report" "$repo/test-results"
exec docker run --rm --init --ipc=host --platform linux/arm64 ${tty[@]+"${tty[@]}"} \
  -v "$repo:/src:ro" \
  -v "$repo/e2e/__screenshots__:/out/screenshots" \
  -v "$repo/playwright-report:/out/playwright-report" \
  -v "$repo/test-results:/out/test-results" \
  "${cache[@]}" \
  -e CI="${CI:-}" -e E2E_CONTAINER=1 \
  "$image" bash /src/e2e/in-container.sh "$@"
