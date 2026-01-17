# syntax=docker/dockerfile:1.6

# Build Stage
FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
COPY .npmrc ./
RUN --mount=type=cache,target=/root/.npm \
	npm ci --no-audit --no-fund

COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine

# Copy built assets to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Add custom Nginx config for React Router (SPA)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
