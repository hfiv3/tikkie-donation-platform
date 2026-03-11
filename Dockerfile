# Simple single-stage build
FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build frontend (static export -> out/) and server (TypeScript -> dist/)
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# Create data directory for SQLite — mount as volume to persist across deploys!
RUN mkdir -p /app/data
VOLUME ["/app/data"]

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/server/index.js"]
