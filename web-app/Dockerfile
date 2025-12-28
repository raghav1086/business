FROM node:20-alpine AS builder

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
# Install dependencies with retry logic for network issues
RUN for i in 1 2 3 4 5; do \
    npm ci --legacy-peer-deps && break || \
    (echo "Attempt $i failed, retrying in 10 seconds..." && sleep 10); \
    done

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files and install production dependencies with retry logic
COPY package*.json ./
RUN for i in 1 2 3 4 5; do \
    npm ci --only=production --legacy-peer-deps && break || \
    (echo "Attempt $i failed, retrying in 10 seconds..." && sleep 10); \
    done

# Copy built application and necessary config files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]

