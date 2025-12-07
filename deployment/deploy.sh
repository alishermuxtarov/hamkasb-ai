#!/bin/bash

# Hamkasb.AI Production Deployment Script
# This script automates the deployment process to hamkasb-ai.uz

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="${DEPLOY_USER:-alisher}"
SERVER_HOST="${DEPLOY_HOST:-75.119.128.223}"
DEPLOY_DIR="/opt/hamkasb-ai"
REPO_URL="https://github.com/alishermuxtarov/hamkasb-ai.git"
BRANCH="${DEPLOY_BRANCH:-master}"

echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Hamkasb.AI Production Deployment          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print step
print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if SSH key exists
print_step "Checking SSH configuration..."
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    print_error "No SSH key found. Please set up SSH key authentication."
    exit 1
fi
print_success "SSH key found"

# Test SSH connection
print_step "Testing SSH connection to $SERVER_HOST..."
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$SERVER_USER@$SERVER_HOST" "echo 'Connection successful'" > /dev/null 2>&1; then
    print_error "Cannot connect to $SERVER_HOST. Please check SSH configuration."
    exit 1
fi
print_success "SSH connection successful"

# Upload .env.production if it exists locally
if [ -f .env.production ]; then
    print_step "Uploading .env.production to server..."
    # Create directory first if it doesn't exist
    ssh "$SERVER_USER@$SERVER_HOST" "sudo mkdir -p $DEPLOY_DIR && sudo chown $SERVER_USER:$SERVER_USER $DEPLOY_DIR" || true
    scp .env.production "$SERVER_USER@$SERVER_HOST:$DEPLOY_DIR/.env.production" || {
        print_error "Failed to upload .env.production. Continuing anyway..."
    }
    print_success ".env.production uploaded"
else
    print_error ".env.production not found locally. Make sure to create it before deployment."
    exit 1
fi

# Deploy to server
print_step "Connecting to server and deploying..."

ssh "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOY_DIR="/opt/hamkasb-ai"
REPO_URL="https://github.com/alishermuxtarov/hamkasb-ai.git"
BRANCH="master"

echo -e "${BLUE}[Server] Starting deployment process...${NC}"

# Install required packages if not present
echo -e "${YELLOW}[Server] Checking system requirements...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}[Server] Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo systemctl enable docker
    sudo systemctl start docker
    sudo usermod -aG docker $USER || sudo usermod -aG docker alisher || true
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}[Server] Installing Docker Compose...${NC}"
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    sudo curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}[Server] Installing Nginx...${NC}"
    sudo apt-get update
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
fi

if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}[Server] Installing Git...${NC}"
    sudo apt-get update
    sudo apt-get install -y git
fi

echo -e "${GREEN}[Server] System requirements satisfied${NC}"

# Create deployment directory
if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}[Server] Creating deployment directory...${NC}"
    sudo mkdir -p "$DEPLOY_DIR"
    sudo chown $USER:$USER "$DEPLOY_DIR" || sudo chown alisher:alisher "$DEPLOY_DIR" || true
    cd "$DEPLOY_DIR"
    git clone "$REPO_URL" .
elif [ -d "$DEPLOY_DIR/.git" ]; then
    echo -e "${YELLOW}[Server] Updating repository...${NC}"
    cd "$DEPLOY_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
    git clean -fd
else
    echo -e "${YELLOW}[Server] Directory exists but not a git repo, backing up and cloning...${NC}"
    # Backup existing directory
    if [ -n "$(ls -A $DEPLOY_DIR 2>/dev/null)" ]; then
        sudo mv "$DEPLOY_DIR" "${DEPLOY_DIR}.backup.$(date +%s)" || true
    fi
    sudo mkdir -p "$DEPLOY_DIR"
    sudo chown $USER:$USER "$DEPLOY_DIR" || sudo chown alisher:alisher "$DEPLOY_DIR" || true
    cd "$DEPLOY_DIR"
    git clone "$REPO_URL" .
fi

# .env.production should be uploaded before this script runs
# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}[Server] ERROR: .env.production file not found!${NC}"
    echo -e "${YELLOW}[Server] Please upload .env.production file to $DEPLOY_DIR/.env.production${NC}"
    echo -e "${YELLOW}[Server] The deploy script should upload it automatically from local machine${NC}"
    exit 1
fi
echo -e "${GREEN}[Server] .env.production file found${NC}"

# Stop existing containers
echo -e "${YELLOW}[Server] Stopping existing containers...${NC}"
docker compose -f docker-compose.production.yml down || docker-compose -f docker-compose.production.yml down || true

# Build and start containers
echo -e "${YELLOW}[Server] Building Docker images...${NC}"
docker compose -f docker-compose.production.yml build --no-cache || docker-compose -f docker-compose.production.yml build --no-cache

echo -e "${YELLOW}[Server] Starting containers...${NC}"
docker compose -f docker-compose.production.yml up -d || docker-compose -f docker-compose.production.yml up -d

# Wait for services to be healthy
echo -e "${YELLOW}[Server] Waiting for services to start...${NC}"
sleep 10

# Check container status
if docker ps | grep -q hamkasb-api && docker ps | grep -q hamkasb-web; then
    echo -e "${GREEN}[Server] Containers are running${NC}"
else
    echo -e "${RED}[Server] ERROR: Containers failed to start${NC}"
    docker compose -f docker-compose.production.yml logs || docker-compose -f docker-compose.production.yml logs
    exit 1
fi

# Ensure landing page directory exists
echo -e "${YELLOW}[Server] Setting up landing page directory...${NC}"
if [ ! -d /var/www/hamkasb-landing ]; then
    sudo mkdir -p /var/www/hamkasb-landing
    echo -e "${GREEN}[Server] Landing page directory created${NC}"
fi

# Configure Nginx
echo -e "${YELLOW}[Server] Configuring Nginx...${NC}"
if [ -f deployment/nginx/hamkasb-ai.conf ]; then
    sudo cp deployment/nginx/hamkasb-ai.conf /etc/nginx/sites-available/hamkasb-ai
    
    # Remove default nginx site if it exists
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Enable our site
    sudo ln -sf /etc/nginx/sites-available/hamkasb-ai /etc/nginx/sites-enabled/hamkasb-ai
    
    # Test Nginx configuration
    if sudo nginx -t; then
        echo -e "${GREEN}[Server] Nginx configuration is valid${NC}"
        sudo systemctl reload nginx || sudo systemctl restart nginx
    else
        echo -e "${RED}[Server] ERROR: Nginx configuration is invalid${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}[Server] Warning: Nginx config not found, skipping...${NC}"
fi

# Run database migrations
echo -e "${YELLOW}[Server] Running database migrations...${NC}"
docker exec hamkasb-api bun run db:migrate || echo -e "${YELLOW}[Server] Warning: Migration failed or not needed${NC}"

echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Deployment completed successfully!         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo -e "  ${GREEN}Landing Page:${NC} http://hamkasb-ai.uz/"
echo -e "  ${GREEN}Demo App:${NC}     http://hamkasb-ai.uz/demo"
echo -e "  ${GREEN}API:${NC}          http://hamkasb-ai.uz/api"
echo ""
echo -e "${BLUE}Container Status:${NC}"
docker ps --filter name=hamkasb

ENDSSH

print_success "Deployment completed!"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Visit ${GREEN}http://hamkasb-ai.uz/demo${NC} to test the application"
echo -e "  2. Set up SSL certificate: ${YELLOW}ssh $SERVER_USER@$SERVER_HOST 'certbot --nginx -d hamkasb-ai.uz -d www.hamkasb-ai.uz'${NC}"
echo -e "  3. Update .env.production with HTTPS URLs after SSL setup"
echo ""
