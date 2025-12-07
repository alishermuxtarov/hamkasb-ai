#!/bin/bash

# Hamkasb.AI Direct Deployment Script (без Docker)
# Устанавливает и запускает приложение напрямую на сервере

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
echo -e "${BLUE}║  Hamkasb.AI Direct Deployment (No Docker)     ║${NC}"
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

# Check if .env.production exists locally
if [ ! -f .env.production ]; then
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

echo -e "${BLUE}[Server] Starting direct deployment process...${NC}"

# Install system dependencies
echo -e "${YELLOW}[Server] Installing system dependencies...${NC}"
sudo apt-get update
sudo apt-get install -y curl git build-essential unzip

# Install Bun for API
if ! command -v bun &> /dev/null; then
    echo -e "${YELLOW}[Server] Installing Bun...${NC}"
    curl -fsSL https://bun.sh/install | bash
    export PATH="$HOME/.bun/bin:$PATH"
    echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
else
    echo -e "${GREEN}[Server] Bun already installed${NC}"
    export PATH="$HOME/.bun/bin:$PATH"
fi

# Install Node.js for Web
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}[Server] Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo -e "${GREEN}[Server] Node.js already installed: $(node --version)${NC}"
fi

# Install pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}[Server] Installing pnpm...${NC}"
    sudo corepack enable || npm install -g pnpm
    corepack prepare pnpm@latest --activate || pnpm --version || true
else
    echo -e "${GREEN}[Server] pnpm already installed${NC}"
fi

# Install PM2 for process management
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}[Server] Installing PM2...${NC}"
    sudo npm install -g pm2
else
    echo -e "${GREEN}[Server] PM2 already installed${NC}"
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo -e "${YELLOW}[Server] Installing Nginx...${NC}"
    sudo apt-get install -y nginx
    sudo systemctl enable nginx
fi

echo -e "${GREEN}[Server] System dependencies satisfied${NC}"

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
    if [ -n "$(ls -A $DEPLOY_DIR 2>/dev/null)" ]; then
        sudo mv "$DEPLOY_DIR" "${DEPLOY_DIR}.backup.$(date +%s)" || true
    fi
    sudo mkdir -p "$DEPLOY_DIR"
    sudo chown $USER:$USER "$DEPLOY_DIR" || sudo chown alisher:alisher "$DEPLOY_DIR" || true
    cd "$DEPLOY_DIR"
    git clone "$REPO_URL" .
fi

echo -e "${YELLOW}[Server] Repository updated, ready for .env.production upload${NC}"
ENDSSH

# Upload .env.production after git operations
print_step "Uploading .env.production to server..."
scp .env.production "$SERVER_USER@$SERVER_HOST:$DEPLOY_DIR/.env.production" || {
    print_error "Failed to upload .env.production"
    exit 1
}
print_success ".env.production uploaded"

# Continue with deployment
ssh "$SERVER_USER@$SERVER_HOST" << 'ENDSSH'
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOY_DIR="/opt/hamkasb-ai"

# Ensure we're in the deployment directory
cd "$DEPLOY_DIR"

# Load environment variables
if [ -f .env.production ]; then
    echo -e "${GREEN}[Server] Loading environment variables from .env.production${NC}"
    set -a
    source .env.production
    set +a
else
    echo -e "${RED}[Server] ERROR: .env.production not found!${NC}"
    exit 1
fi

# Export PATH for Bun
export PATH="$HOME/.bun/bin:$PATH"

# Create log directory
echo -e "${YELLOW}[Server] Setting up log directory...${NC}"
mkdir -p ~/hamkasb-logs
LOG_DIR="$HOME/hamkasb-logs"

# Stop existing PM2 processes
echo -e "${YELLOW}[Server] Stopping existing processes...${NC}"
pm2 stop hamkasb-api hamkasb-web 2>/dev/null || true
pm2 delete hamkasb-api hamkasb-web 2>/dev/null || true

# Install root dependencies
echo -e "${YELLOW}[Server] Installing root dependencies...${NC}"
bun install --frozen-lockfile || bun install

# Build and setup API
echo -e "${YELLOW}[Server] Building API...${NC}"
cd apps/api
bun install --frozen-lockfile || bun install
bun run build

# Copy pdf.js files needed by pdf-parse (Bun doesn't copy them automatically)
echo -e "${YELLOW}[Server] Copying pdf.js files for pdf-parse...${NC}"
if [ -d "node_modules/pdf-parse/lib/pdf.js" ]; then
    # Copy to dist for bundled code
    mkdir -p dist/pdf.js
    cp -r node_modules/pdf-parse/lib/pdf.js/* dist/pdf.js/ 2>/dev/null || true
    # Also copy to root of apps/api so relative paths work from cwd
    mkdir -p pdf.js
    cp -r node_modules/pdf-parse/lib/pdf.js/* pdf.js/ 2>/dev/null || true
    echo -e "${GREEN}[Server] pdf.js files copied${NC}"
else
    echo -e "${YELLOW}[Server] Warning: pdf.js directory not found${NC}"
fi

cd "$DEPLOY_DIR"

# Build and setup Web
echo -e "${YELLOW}[Server] Building Web...${NC}"
cd apps/web
# Remove packageManager field for pnpm
node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('../../package.json')); delete pkg.packageManager; fs.writeFileSync('../../package.json', JSON.stringify(pkg, null, 2));" || true
# Create pnpm-workspace.yaml
printf "packages:\n  - 'apps/*'\n  - 'packages/*'\n" > ../../pnpm-workspace.yaml
pnpm install --frozen-lockfile || pnpm install
pnpm build

# Copy static files to standalone directory (Next.js standalone doesn't copy them automatically)
echo -e "${YELLOW}[Server] Copying static files to standalone...${NC}"
mkdir -p .next/standalone/apps/web/.next
cp -r .next/static .next/standalone/apps/web/.next/ 2>/dev/null || true
# Also copy to the root of standalone for proper path resolution
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
echo -e "${GREEN}[Server] Static files copied${NC}"

cd "$DEPLOY_DIR"

# Create PM2 ecosystem config with environment variables
echo -e "${YELLOW}[Server] Creating PM2 ecosystem config...${NC}"
cd "$DEPLOY_DIR"
# Load environment variables from .env.production
export $(cat .env.production | grep -v '^#' | xargs)
# Create ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'hamkasb-api',
      script: 'src/index.ts',
      interpreter: '/home/alisher/.bun/bin/bun',
      cwd: '/opt/hamkasb-ai/apps/api',
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: '${DATABASE_URL}',
        QDRANT_URL: '${QDRANT_URL}',
        QDRANT_API_KEY: '${QDRANT_API_KEY}',
        OPENAI_API_KEY: '${OPENAI_API_KEY}',
        BLOB_READ_WRITE_TOKEN: '${BLOB_READ_WRITE_TOKEN}',
        NEXT_PUBLIC_APP_URL: '${NEXT_PUBLIC_APP_URL}',
        NEXT_PUBLIC_API_URL: '${NEXT_PUBLIC_API_URL}',
      },
    },
    {
      name: 'hamkasb-web',
      script: 'apps/web/.next/standalone/apps/web/server.js',
      interpreter: 'node',
      cwd: '/opt/hamkasb-ai',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        DATABASE_URL: '${DATABASE_URL}',
        QDRANT_URL: '${QDRANT_URL}',
        QDRANT_API_KEY: '${QDRANT_API_KEY}',
        OPENAI_API_KEY: '${OPENAI_API_KEY}',
        BLOB_READ_WRITE_TOKEN: '${BLOB_READ_WRITE_TOKEN}',
        NEXT_PUBLIC_APP_URL: '${NEXT_PUBLIC_APP_URL}',
        NEXT_PUBLIC_API_URL: '${NEXT_PUBLIC_API_URL}',
      },
    },
  ],
}
EOF

# Start applications with PM2
echo -e "${YELLOW}[Server] Starting applications with PM2...${NC}"
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Save PM2 configuration
pm2 save
pm2 startup systemd -u $USER --hp $HOME | grep -v "PM2" | sudo bash || true

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
cd "$DEPLOY_DIR/apps/api"
bun run db:migrate || echo -e "${YELLOW}[Server] Warning: Migration failed or not needed${NC}"

# Check PM2 status
echo -e "${YELLOW}[Server] Checking PM2 status...${NC}"
pm2 status

echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Deployment completed successfully!         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo -e "  ${GREEN}Landing Page:${NC} http://hamkasb-ai.uz/"
echo -e "  ${GREEN}Demo App:${NC}     http://hamkasb-ai.uz/demo"
echo -e "  ${GREEN}API:${NC}          http://hamkasb-ai.uz/api"
echo ""
echo -e "${BLUE}PM2 Status:${NC}"
pm2 list

ENDSSH

print_success "Deployment completed!"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Visit ${GREEN}http://hamkasb-ai.uz/demo${NC} to test the application"
echo -e "  2. Check logs: ${YELLOW}pm2 logs${NC}"
echo -e "  3. Set up SSL certificate: ${YELLOW}ssh $SERVER_USER@$SERVER_HOST 'sudo certbot --nginx -d hamkasb-ai.uz -d www.hamkasb-ai.uz'${NC}"
echo ""

