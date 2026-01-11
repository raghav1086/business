# Multi-stage Dockerfile for NestJS Microservices
# Build stage
FROM node:20-alpine AS builder

ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY nx.json ./
COPY tsconfig*.json ./
COPY jest.preset.js ./

# Install dependencies with retry logic for network issues
RUN for i in 1 2 3 4 5; do \
    npm ci --legacy-peer-deps && break || \
    (echo "Attempt $i failed, retrying in 10 seconds..." && sleep 10); \
    done

# Copy source code
COPY apps ./apps
COPY libs ./libs

# Build the specific service using local NX installation
RUN ./node_modules/.bin/nx build ${SERVICE_NAME} --prod

# Production stage
FROM node:20-alpine AS production

ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}
ENV NODE_ENV=production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files and install production dependencies with retry logic
COPY package*.json ./
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000
RUN for i in 1 2 3 4 5; do \
    echo "npm install attempt $i..." && \
    npm ci --only=production --legacy-peer-deps && break || \
    (echo "Attempt $i failed, waiting 30 seconds before retry..." && sleep 30); \
    done

# Copy built application
COPY --from=builder /app/dist/apps/${SERVICE_NAME} ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

USER nestjs

# Expose port (will be overridden by docker-compose)
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
