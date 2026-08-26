# Deployment Guide for Raspberry Pi (apple-pi)

This guide explains how to deploy your Gatsby website as a Docker container to your Raspberry Pi.

## Prerequisites

### On your Raspberry Pi (apple-pi)

1. **Install Docker:**
   ```bash
   ssh bheussler@apple-pi
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker bheussler
   # Log out and back in for group changes to take effect
   ```

2. **Verify installation:**
   ```bash
   docker --version
   docker compose version
   ```

   Note: Modern Docker installations include Docker Compose V2 as a plugin. If `docker compose` doesn't work, you may need to install the plugin:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker-compose-plugin
   ```

## Automatic Deployment (primary path)

Every push to `master` builds an arm64 image, publishes it to GHCR, and asks
Portainer to redeploy the stack. Nothing needs to run from a laptop.

```
push to master
  -> .github/workflows/ci-release.yml
  -> ghcr.io/bheus/website:<sha> and :latest
  -> POST ${{ secrets.PORTAINER_WEBSITE_WEBHOOK }}
  -> Portainer re-pulls :latest and restarts brendan-website
```

The webhook is fired only after the image push succeeds, so the stack never
redeploys onto a stale image.

### One-time setup

1. **Create the Portainer stack.** The `website` stack (id 3) was originally an
   *external* stack, which cannot own a webhook. Recreate it as a Portainer-managed
   stack at <http://apple-pi.lan:9000> → Stacks → Add stack:
   - Name: `website`
   - Build method: **Web editor**, pasting this repository's `docker-compose.yml`
   - Environment variables: the contact/SMTP values from `.env.example`
   - Enable **GitOps updates** → **Webhook**, with **re-pull image** enabled
   - Copy the generated webhook UUID

2. **Store the webhook in GitHub, rewritten to the tunnel hostname.** Portainer's
   UI shows the webhook as `http://apple-pi.lan:9000/api/stacks/webhooks/<uuid>`,
   which GitHub's runners cannot reach — `apple-pi.lan` resolves only on the LAN.
   The Cloudflare tunnel exposes exactly this one path instead:

   ```yaml
   - hostname: deploy.builtbybrendan.com
     path: ^/api/stacks/webhooks/.*$
     service: http://localhost:9000
   - hostname: deploy.builtbybrendan.com
     service: http_status:404
   ```

   So keep the UUID and swap the host:

   ```bash
   gh secret set PORTAINER_WEBSITE_WEBHOOK --repo bheus/website
   # https://deploy.builtbybrendan.com/api/stacks/webhooks/<uuid>
   ```

   Without this secret the workflow still builds and publishes the image; it just
   skips the redeploy step. A `404` with `"Unable to find the stack by webhook ID"`
   means the UUID no longer matches a stack — deleting and recreating the stack
   usually preserves it, but confirm before assuming.

3. **Confirm GHCR visibility.** The Pi pulls anonymously, so the
   `ghcr.io/bheus/website` package must be public, or Portainer needs a registry
   credential for it.

### Configure contact delivery

Contact settings live in the Portainer stack's environment variables, using
`.env.example` as the template. They are never baked into the image and never
reach the browser: the form posts to the same-origin `/api/contact` endpoint,
which validates the submission before relaying it through SMTP.

Delivery goes through Resend: `SMTP_HOST=smtp.resend.com`, `SMTP_USER` is the
literal string `resend`, and `SMTP_PASS` is a Resend API key. Set `CONTACT_FROM`
explicitly — `server/index.js` falls back to `SMTP_USER` as the sender, which is
not an address, and `CONTACT_FROM` is absent from the required-variable check, so
omitting it fails only at send time. `TRUST_PROXY=true` is required behind the
tunnel; without it every visitor shares one rate-limit bucket.

The Resend API key is currently shared with the `guiltyspark` stack, so rotating
it means updating both.

Stack environment variables reach a container only on redeploy. Saving them in
Portainer changes nothing until the stack is redeployed or the webhook fires.

The compose file also reads an optional `.env` beside it if one is present, so an
existing `/home/bheussler/website/.env` keeps working.

## Manual Deployment (fallback)

`deploy.sh` still builds locally and ships the image over SSH. Use it only when
GitHub Actions or Portainer is unavailable — it bypasses the Portainer stack and
leaves the host on an image that no commit points at.

```bash
./deploy.sh              # build Gatsby locally, containerize the static output
./deploy.sh --full-build # build everything inside Docker
```

## Managing Your Deployment

### View logs:
```bash
ssh bheussler@apple-pi 'docker logs brendan-website'
```

### Follow logs in real-time:
```bash
ssh bheussler@apple-pi 'docker logs -f brendan-website'
```

### Restart the container:
```bash
ssh bheussler@apple-pi 'cd /home/bheussler/website && docker compose restart'
```

### Stop the container:
```bash
ssh bheussler@apple-pi 'cd /home/bheussler/website && docker compose down'
```

### Check container status:
```bash
ssh bheussler@apple-pi 'docker ps | grep brendan-website'
```

### Access the container shell:
```bash
ssh bheussler@apple-pi 'docker exec -it brendan-website sh'
```

## Troubleshooting

### Site not accessible
1. Check if container is running: `ssh bheussler@apple-pi 'docker ps'`
2. Check logs: `ssh bheussler@apple-pi 'docker logs brendan-website'`
3. Verify port 80 is not in use: `ssh bheussler@apple-pi 'sudo netstat -tulpn | grep :80'`

### Build fails locally
1. Clean Gatsby cache: `npm run clean`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Try building again: `npm run build`

### Docker image too large
The simple build method creates a much smaller image (~50MB) compared to the full build (~500MB+).

## File Structure

- `.github/workflows/ci-release.yml` - Build, publish to GHCR, trigger Portainer
- `Dockerfile` - Full build (builds Gatsby inside Docker); this is what CI publishes
- `Dockerfile.simple` - Simple build (uses pre-built static files), for `deploy.sh`
- `docker-compose.yml` - The stack Portainer deploys; pulls the published image
- `docker-compose.override.yml` - Local-only, restores `docker compose build`
- `server/index.js` - Static web server and contact relay
- `deploy.sh` - Fallback manual deployment script
- `.dockerignore` - Files to exclude from Docker build

## Performance Tips

1. The web server includes gzip compression for faster loading
2. Static assets are cached for 1 year
3. The container uses minimal resources (perfect for Raspberry Pi)
4. Health checks ensure the container is always running

## Security

The web server includes:
- A restrictive content security policy plus X-Frame-Options and X-Content-Type-Options headers
- Proper MIME type handling
- No directory listing
- Same-origin contact submissions, proof-of-work validation, a honeypot, and rate limiting

For HTTPS, consider setting up a reverse proxy (like Caddy or nginx-proxy) in front of this container.
