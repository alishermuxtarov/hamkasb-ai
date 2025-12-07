# Production Dockerfile for Elysia API with Bun
# Multi-stage build for optimal image size and security
# Build context should be the project root to access workspace packages

# Stage 1: Dependencies
FROM oven/bun:1 AS deps
WORKDIR /app

# Copy root package files
COPY package.json bun.lockb* ./
COPY apps/api/package.json ./apps/api/

# Install dependencies (bun will handle workspaces)
RUN bun install --frozen-lockfile --production

# Stage 2: Builder
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy root package files
COPY package.json bun.lockb* tsconfig.base.json ./

# Copy workspace packages (if they exist in build context)
COPY packages ./packages

# Copy API app
COPY apps/api ./apps/api

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Build the application
WORKDIR /app/apps/api
RUN bun run build

# Stage 3: Production runner
FROM oven/bun:1-slim AS runner
WORKDIR /app

# Create non-root user for security
RUN groupadd --system --gid 1001 elysiajs && \
    useradd --system --uid 1001 --gid elysiajs elysiajs

# Copy necessary files from API app
COPY --from=builder --chown=elysiajs:elysiajs /app/apps/api/dist ./dist
COPY --from=builder --chown=elysiajs:elysiajs /app/apps/api/package.json ./
COPY --from=deps --chown=elysiajs:elysiajs /app/node_modules ./node_modules
COPY --from=deps --chown=elysiajs:elysiajs /app/apps/api/node_modules ./node_modules 2>/dev/null || true

# Copy Drizzle migrations and config
COPY --from=builder --chown=elysiajs:elysiajs /app/apps/api/src/lib/db/migrations ./src/lib/db/migrations
COPY --from=builder --chown=elysiajs:elysiajs /app/apps/api/drizzle.config.ts ./

# Switch to non-root user
USER elysiajs

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production \
    PORT=3001 \
    BUN_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run -e 'await fetch("http://localhost:3001/health").then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))'

# Start the application
CMD ["bun", "run", "dist/index.js"]
