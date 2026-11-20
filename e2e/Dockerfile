# The browser image tag must equal the @playwright/test version in
# package-lock.json; run.sh reads it from there and passes it in.
ARG PLAYWRIGHT_VERSION
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

RUN apt-get update \
 && apt-get install -y --no-install-recommends rsync \
 && rm -rf /var/lib/apt/lists/*
ENV NPM_CONFIG_UPDATE_NOTIFIER=false
