#!/bin/bash

# Deployment script for Raspberry Pi (apple-pi)
# Usage: ./deploy.sh [--full-build]
#
# By default, uses the simple build (builds Gatsby locally, containerizes static files)
# Use --full-build to build everything inside Docker (slower, more memory intensive)

set -e

# Configuration
PI_USER="bheussler"
PI_HOST="apple-pi"
PI_DEPLOY_DIR="/home/bheussler/website"
IMAGE_NAME="brendan-website"
CONTAINER_NAME="brendan-website"
USE_FULL_BUILD=false

# Parse arguments
if [[ "$1" == "--full-build" ]]; then
    USE_FULL_BUILD=true
fi

echo "🚀 Starting deployment to apple-pi..."

if [ "$USE_FULL_BUILD" = true ]; then
    echo "📦 Building Docker image (full build)..."
    docker build -t ${IMAGE_NAME}:latest .
else
    # Step 1: Build Gatsby site locally
    echo "🔨 Building Gatsby site locally..."
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi

    # Clean previous build
    npm run clean

    # Build the site
    npm run build

    # Step 2: Build Docker image with pre-built site
    echo "📦 Building Docker image (simple build)..."
    docker build -f Dockerfile.simple -t ${IMAGE_NAME}:latest .
fi

# Step 2: Save the image to a tar file
echo "💾 Saving Docker image to tar file..."
docker save ${IMAGE_NAME}:latest | gzip > ${IMAGE_NAME}.tar.gz

# Step 3: Create deployment directory on Pi
echo "📁 Creating deployment directory on Raspberry Pi..."
ssh ${PI_USER}@${PI_HOST} "mkdir -p ${PI_DEPLOY_DIR}"

# Step 4: Copy files to Raspberry Pi
echo "📤 Copying files to Raspberry Pi..."
scp ${IMAGE_NAME}.tar.gz ${PI_USER}@${PI_HOST}:${PI_DEPLOY_DIR}/
scp docker-compose.yml ${PI_USER}@${PI_HOST}:${PI_DEPLOY_DIR}/

# Step 5: Deploy on Raspberry Pi
echo "🔧 Deploying on Raspberry Pi..."
ssh ${PI_USER}@${PI_HOST} << 'ENDSSH'
cd /home/bheussler/website

# Load the Docker image
echo "Loading Docker image..."
docker load < brendan-website.tar.gz

# Stop and remove old container if exists
echo "Stopping old container..."
docker compose down || true

# Start new container
echo "Starting new container..."
docker compose up -d

# Clean up
echo "Cleaning up..."
rm brendan-website.tar.gz

# Show status
echo "Container status:"
docker ps | grep brendan-website

ENDSSH

# Step 6: Clean up local tar file
echo "🧹 Cleaning up local files..."
rm ${IMAGE_NAME}.tar.gz

echo "✅ Deployment complete!"
echo "🌐 Your website should be accessible at http://apple-pi"
echo ""
echo "Useful commands:"
echo "  View logs: ssh ${PI_USER}@${PI_HOST} 'docker logs ${CONTAINER_NAME}'"
echo "  Restart:   ssh ${PI_USER}@${PI_HOST} 'cd ${PI_DEPLOY_DIR} && docker compose restart'"
echo "  Stop:      ssh ${PI_USER}@${PI_HOST} 'cd ${PI_DEPLOY_DIR} && docker compose down'"

