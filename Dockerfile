# ==========================================
# Stage 1: Build API Server (Express)
# ==========================================
FROM node:22-bookworm-slim AS api-builder

WORKDIR /app/server
# Install build tools for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY server/package*.json server/tsconfig.json server/drizzle.config.ts ./
RUN npm ci --legacy-peer-deps

COPY server/src ./src
RUN npm run build

# ==========================================
# Stage 2: Build Web Frontend (Next.js)
# ==========================================
FROM node:22-bookworm-slim AS web-builder

WORKDIR /app/bqa-app
COPY bqa-app/package*.json ./
RUN npm ci --legacy-peer-deps

COPY bqa-app/ ./
# We don't need NEXT_PUBLIC_API_URL here because we proxy /api to localhost:4000
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ==========================================
# Stage 3: Runner (Unified Container)
# ==========================================
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DB_PATH=/app/data/bqa.db

RUN mkdir -p /app/data

# Install production dependencies for better-sqlite3 in API Server
# We must compile native bindings in the runner stage to ensure ABI compatibility
RUN apt-get update && apt-get install -y python3 make g++ curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package*.json ./
# Only install production dependencies!
RUN npm ci --omit=dev --legacy-peer-deps

# Remove the compilation tools to save hundreds of megabytes of space
RUN apt-get purge -y python3 make g++ && apt-get autoremove -y && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy API Server dist and files
COPY --from=api-builder /app/server/dist ./dist
COPY --from=api-builder /app/server/src/db ./src/db
COPY --from=api-builder /app/server/drizzle.config.ts ./drizzle.config.ts

# Copy Next.js Standalone
WORKDIR /app/bqa-app
COPY --from=web-builder /app/bqa-app/.next/standalone ./
# The standalone build doesn't include public and static files, we must copy them
COPY --from=web-builder /app/bqa-app/public ./public
COPY --from=web-builder /app/bqa-app/.next/static ./.next/static

# Setup startup script
WORKDIR /app
COPY start.sh ./
RUN chmod +x start.sh

# Expose ONLY port 3000 (Next.js), which proxies to 4000 (Express) internally
EXPOSE 3000

# Healthcheck hits Next.js, which guarantees it's up. 
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Run the unified start script
CMD ["./start.sh"]
