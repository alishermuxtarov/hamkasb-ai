# Production Dockerfile for Next.js Web App
# Multi-stage build with standalone output for minimal image size
# Build context should be the project root to access workspace packages

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root package.json and workspace files
COPY package.json pnpm-lock.yaml* ./
COPY apps/web/package.json ./apps/web/
COPY packages ./packages

# Create pnpm-workspace.yaml for pnpm
WORKDIR /app
RUN echo "packages:\n  - 'apps/*'\n  - 'packages/*'" > pnpm-workspace.yaml

# Install dependencies (pnpm will handle workspaces)
# Remove packageManager field using node to preserve JSON validity, then install
RUN node -e "const fs=require('fs'); const pkg=JSON.parse(fs.readFileSync('package.json')); delete pkg.packageManager; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));" && \
    (test -f pnpm-lock.yaml && pnpm install --frozen-lockfile --prod || pnpm install --prod)

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy root package files
COPY package.json pnpm-lock.yaml* tsconfig.base.json ./

# Copy workspace packages
COPY packages ./packages

# Copy web app
COPY apps/web ./apps/web

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Install all dependencies (including dev) for build
WORKDIR /app/apps/web
RUN pnpm install --frozen-lockfile

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Copy standalone output and static files from web app
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/demo', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start Next.js
CMD ["node", "server.js"]
