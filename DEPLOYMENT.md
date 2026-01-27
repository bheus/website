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

## Deployment Methods

### Method 1: Simple Build (Recommended)

This method builds the Gatsby site locally and only containerizes the static files. It's faster and uses less memory.

```bash
./deploy.sh
```

### Method 2: Full Docker Build

This method builds everything inside Docker. Use this if you want a completely reproducible build environment.

```bash
./deploy.sh --full-build
```

## What the Deployment Script Does

1. Builds your Gatsby site (locally or in Docker)
2. Creates a Docker image with nginx serving the static files
3. Transfers the image to your Raspberry Pi
4. Deploys and starts the container
5. Your site becomes available at `http://apple-pi`

## Manual Deployment Steps

If you prefer to deploy manually:

1. **Build the site locally:**
   ```bash
   npm run build
   ```

2. **Build the Docker image:**
   ```bash
   docker build -f Dockerfile.simple -t brendan-website:latest .
   ```

3. **Save and transfer the image:**
   ```bash
   docker save brendan-website:latest | gzip > brendan-website.tar.gz
   scp brendan-website.tar.gz bheussler@apple-pi:/home/bheussler/website/
   scp docker-compose.yml bheussler@apple-pi:/home/bheussler/website/
   ```

4. **Deploy on Raspberry Pi:**
   ```bash
   ssh bheussler@apple-pi
   cd /home/bheussler/website
   docker load < brendan-website.tar.gz
   docker compose down
   docker compose up -d
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

- `Dockerfile` - Full build (builds Gatsby inside Docker)
- `Dockerfile.simple` - Simple build (uses pre-built static files)
- `docker-compose.yml` - Container orchestration
- `nginx.conf` - Web server configuration
- `deploy.sh` - Automated deployment script
- `.dockerignore` - Files to exclude from Docker build

## Performance Tips

1. The nginx configuration includes gzip compression for faster loading
2. Static assets are cached for 1 year
3. The container uses minimal resources (perfect for Raspberry Pi)
4. Health checks ensure the container is always running

## Security

The nginx configuration includes:
- Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)
- Proper MIME type handling
- No directory listing

For HTTPS, consider setting up a reverse proxy (like Caddy or nginx-proxy) in front of this container.

