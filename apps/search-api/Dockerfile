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
RUN pnpm --filter search-api build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules and built dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/search-api/node_modules ./apps/search-api/node_modules
COPY --from=builder /app/apps/search-api/dist ./apps/search-api/dist
COPY --from=builder /app/apps/search-api/package.json ./apps/search-api/package.json

# Expose port
EXPOSE 4001

# Start script
WORKDIR /app
CMD ["node", "apps/search-api/dist/main.js"]
