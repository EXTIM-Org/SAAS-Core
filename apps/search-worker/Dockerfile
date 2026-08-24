# Base image
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

# Builder stage
FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @saas/shared build
RUN pnpm --filter search-worker build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules and built dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/search-worker/node_modules ./apps/search-worker/node_modules
COPY --from=builder /app/apps/search-worker/dist ./apps/search-worker/dist
COPY --from=builder /app/apps/search-worker/package.json ./apps/search-worker/package.json

# Start script
WORKDIR /app
CMD ["node", "apps/search-worker/dist/main.js"]
