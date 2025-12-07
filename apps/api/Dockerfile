# Production Dockerfile for Elysia API with Bun
# Multi-stage build for optimal image size and security

# Stage 1: Dependencies
FROM oven/bun:1 AS deps
WORKDIR /app

# Copy dependency files
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Stage 2: Builder
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN bun run build

# Stage 3: Production runner
FROM oven/bun:1-slim AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 elysiajs && \
    adduser --system --uid 1001 elysiajs

# Copy necessary files
COPY --from=builder --chown=elysiajs:elysiajs /app/dist ./dist
COPY --from=builder --chown=elysiajs:elysiajs /app/package.json ./
COPY --from=deps --chown=elysiajs:elysiajs /app/node_modules ./node_modules

# Copy Drizzle migrations and config
COPY --from=builder --chown=elysiajs:elysiajs /app/src/lib/db/migrations ./src/lib/db/migrations
COPY --from=builder --chown=elysiajs:elysiajs /app/drizzle.config.ts ./

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
