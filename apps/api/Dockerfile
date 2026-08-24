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
RUN pnpm --filter @saas/database db:generate
RUN pnpm --filter @saas/database build
RUN pnpm --filter @saas/shared build
RUN pnpm --filter api build

# Runner stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy node_modules and built dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/start.sh ./apps/api/start.sh

# Expose port (default nestjs port)
EXPOSE 4000

# Start script
WORKDIR /app
CMD ["sh", "./apps/api/start.sh"]
