# SAAS-Core Platform

Welcome to the **SAAS-Core Platform**, a production-ready, reusable SaaS architecture designed to host multiple products without rewriting foundational code.

Our first built-in product is **Site Search as a Service**: a hosted search platform that allows customers to add fast, typo-tolerant, and filterable search (powered by Typesense) to their websites with minimal integration.

## 🚀 Features & Architecture

The system follows a **Coarse-Grained Product Services** architecture, with a unified SaaS Core.

### 🏢 SaaS Core (Foundation)
- **Authentication & Users**: Secure login, registration, and session management.
- **Project & Domain Management**: Tenant isolation and multi-project support.
- **Platform API (`apps/api`)**: Core business rules and secure API access.
- **Customer Dashboard (`apps/dashboard`)**: Authenticated customer UI.
- **Marketing Website (`apps/website`)**: Public-facing, SEO-optimized marketing pages.

### 🔍 Search Product (Service)
- **Search API (`apps/search-api`)**: Lightning-fast search endpoints and widget support.
- **Search Worker (`apps/search-worker`)**: Asynchronous crawling, extraction, and indexing (powered by BullMQ).
- **Core Capabilities**: Full-text search, Typo tolerance, Autocomplete, Filters, and Persian-language support.

## 🛠️ Technology Stack

- **Frontend**: Next.js App Router, React, Tailwind CSS, shadcn/ui
- **Backend**: NestJS, Fastify
- **Data & Search**: PostgreSQL, Prisma, Redis, Typesense, BullMQ
- **Infrastructure**: Docker, Docker Compose, GitHub Actions, Cloudflare

## ⚙️ Getting Started (Local Development)

Please refer to the comprehensive [DEVELOPMENT.md](./DEVELOPMENT.md) guide for detailed instructions on setting up your local environment, managing Docker containers, running SSH tunnels, and starting the development servers.

### Quick Start (Local Setup)

1. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```
2. Copy the environment configuration:
   ```bash
   cp .env.example .env
   ```
3. Start the infrastructure (Postgres, Redis, Typesense) via Docker:
   ```bash
   docker compose up -d
   ```
4. Generate Prisma Client and push the schema:
   ```bash
   pnpm --filter @saas/database db:generate
   pnpm --filter @saas/database db:push
   ```
5. Start the development servers:
   ```bash
   pnpm dev
   ```

## 📖 Documentation

For detailed architectural decisions, technology choices, and project scope, please review the following documents:
- [PROJECT.md](./PROJECT.md) - Vision, scope, and product details.
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Service boundaries and infrastructure shape.
- [DECISIONS.md](./DECISIONS.md) - Architectural Decision Records (ADRs).
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Local development and SSH tunnel guides.

## 📜 License

Proprietary Software. All rights reserved.
