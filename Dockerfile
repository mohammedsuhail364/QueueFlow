# Stage 1: install production dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: runtime image
FROM node:22-alpine
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 3000

# Default: run API server. docker-compose overrides this for the worker.
CMD ["node", "index.js"]
