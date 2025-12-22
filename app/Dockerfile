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

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY apps ./apps
COPY libs ./libs

# Build the specific service
RUN npx nx build ${SERVICE_NAME} --prod

# Production stage
FROM node:20-alpine AS production

ARG SERVICE_NAME
ENV SERVICE_NAME=${SERVICE_NAME}
ENV NODE_ENV=production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

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
