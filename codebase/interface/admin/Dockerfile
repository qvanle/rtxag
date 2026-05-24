# syntax=docker/dockerfile:1

FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json ./
RUN npm install

FROM node:22-alpine AS builder
WORKDIR /app
ENV CI=true

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY docker-server.mjs ./docker-server.mjs

EXPOSE 3000

CMD ["node", "docker-server.mjs"]
