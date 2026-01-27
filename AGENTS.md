# Agent Notes

This file contains important notes and reminders for AI agents working on this project.

## Docker Compose Command

**IMPORTANT**: Use `docker compose` (Docker Compose V2) instead of `docker-compose` (V1).

Docker Compose V2 is the modern, integrated version that comes with Docker Desktop and recent Docker installations. The command is:

```bash
# Correct (V2)
docker compose up -d
docker compose down
docker compose restart

# Incorrect (V1 - deprecated)
docker-compose up -d
docker-compose down
docker-compose restart
```

### Why This Matters

- Docker Compose V2 (`docker compose`) is now the default and recommended version
- It's integrated into the Docker CLI as a plugin
- V1 (`docker-compose`) is a standalone Python application that is deprecated
- Modern systems (including Raspberry Pi with recent Docker installations) use V2

### Files That Use Docker Compose

When updating or creating scripts, ensure these files use `docker compose`:
- `deploy.sh` - Deployment script
- `DEPLOYMENT.md` - Documentation
- Any other scripts or documentation that reference Docker Compose

## Project Structure

This is a Gatsby-based static website deployed as a Docker container to a Raspberry Pi.

### Key Technologies
- **Frontend**: Gatsby (React-based static site generator)
- **Theme**: @lekoarts/gatsby-theme-minimal-blog
- **Containerization**: Docker with nginx-alpine
- **Deployment Target**: Raspberry Pi (ARM architecture)

### Build Methods
1. **Simple Build** (recommended): Build Gatsby locally, containerize static files
2. **Full Build**: Build everything inside Docker (more memory intensive)

## Deployment Notes

- Target host: `apple-pi` (Raspberry Pi)
- User: `bheussler`
- Deploy directory: `/home/bheussler/website`
- Container name: `brendan-website`
- Port: 80

## Common Issues

### Memory Issues During Build
- Gatsby builds can be memory-intensive
- Use the simple build method (`Dockerfile.simple`) for resource-constrained environments
- The full build (`Dockerfile`) may fail on systems with limited RAM

