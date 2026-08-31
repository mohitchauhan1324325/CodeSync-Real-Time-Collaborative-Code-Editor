# Multi-stage Dockerfile for CodeSync Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

USER node

CMD ["node", "src/server.js"]
