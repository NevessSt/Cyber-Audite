# syntax=docker/dockerfile:1.6

# Build Stage
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./
COPY prisma ./prisma/

# Install dependencies
RUN --mount=type=cache,target=/root/.npm \
	npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production Stage
FROM node:20

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3001

CMD ["node", "dist/index.js"]
