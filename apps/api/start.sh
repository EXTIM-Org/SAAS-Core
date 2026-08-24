#!/bin/sh
set -e
echo "Running Prisma migrations..."
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
echo "Starting NestJS API..."
exec node apps/api/dist/main.js
