# SaaS Core Platform

## 1. Vision

Build a production-ready, reusable SaaS platform that can host multiple products without requiring a rewrite of the foundational architecture.

The first product is **Site Search as a Service**: a hosted search platform that lets customers add fast, typo-tolerant, filterable search to their websites with minimal integration effort.

The platform is designed for real customers and production use, not as a demo.

## 2. Primary Priorities

When trade-offs exist, use this default hierarchy:

1. SEO — highest priority for the public Website
2. Performance
3. Maintainability
4. Security
5. Scalability
6. Developer Experience

Security, data integrity and production safety are hard constraints and must not be sacrificed.

## 3. Long-Term Product Family

The SaaS Core should be reusable for:

- Site Search as a Service
- Form Backend
- AI Chat
- SEO Platform
- Monitoring
- Analytics
- Email Platform

Future products are added as independent coarse-grained services that integrate with the SaaS Core.

## 4. Architecture Style

The system follows **Coarse-Grained Product Services with a Unified SaaS Core** (see ADR-013).

- **SaaS Core**: Authentication, users, projects, domains, settings, Website and Dashboard.
- **Search Service**: Crawling, indexing, search API and widget (first product).
- **Future products**: Each new product becomes its own service connected to the Core.

This shape keeps authentication and tenancy simple, isolates heavy workloads, and gives AI coding agents smaller and clearer contexts.

## 5. First Product — Site Search as a Service

**Target customers:**

- Online stores
- Content websites
- Technical documentation
- Directories and listing sites

**Core customer value:**

- Fast search
- Typo tolerance
- Instant suggestions / autocomplete
- Filters
- Persian-language support
- Minimal integration through an embeddable widget

## 6. MVP Scope

### Search Product

- Sitemap ingestion
- Controlled web crawling
- Content extraction and normalization
- Typesense indexing
- Full-text search
- Typo tolerance
- Autocomplete
- Filters
- Persian-language support
- Search API
- Embeddable widget

### SaaS Core

- Authentication
- Users
- Tenant / project isolation
- Project and domain management
- Secure API access
- Basic dashboard
- Usage foundation where required

### Explicitly Deferred

Do not add these unless a concrete MVP need or approved architectural reason appears:

- AI search
- Image search
- Vector search
- Advanced analytics
- Complex enterprise organizations
- Enterprise SSO
- Multi-region infrastructure
- Kubernetes
- Fine-grained microservices

## 7. Repository & Runtime Shape

```text
apps/
  website/          # Public marketing + documentation (SEO)
  dashboard/        # Authenticated customer UI
  api/              # SaaS Core API
  search-api/       # Search product API
  search-worker/    # Crawl, extract, index

packages/
  auth/
  database/
  billing/
  logger/
  queue/
  storage/
  ui/
  emails/
  shared/
```

### Runtime Responsibilities

- `website` → Public marketing, documentation, SEO
- `dashboard` → Authenticated customer experience
- `api` → Auth, users, projects, domains, platform business rules
- `search-api` → Search endpoints and widget support
- `search-worker` → Asynchronous crawling, extraction and indexing

## 8. Technology Stack

**Frontend**

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

**Backend**

- NestJS + Fastify

**Data & Search**

- PostgreSQL
- Prisma
- Redis
- BullMQ
- Typesense

**Infrastructure**

- Docker
- Docker Compose (local infrastructure)
- GitHub Actions
- Cloudflare
- S3-compatible storage when required

Exact stable versions are recorded in `STACK_VERSIONS.md`.

## 9. Local Development Contract

A fresh clone must be reproducible without manually installing PostgreSQL, Redis or Typesense.

Canonical baseline:

```bash
git clone <repository-url>
cd saas-core-platform
cp .env.example .env
docker compose up -d
```

Then follow `DEVELOPMENT.md` for application startup, migrations, tests and validation.

The root `docker-compose.yml` is the source of truth for local infrastructure.

## 10. Environment Configuration Contract

- `.env.example` is the canonical template.
- `.env` is local-only and must never be committed.
- Host-run applications use `127.0.0.1` through mapped ports.
- Container-to-container connections use Compose service names.
- Production credentials must never appear in example or local configuration.

## 11. Data Responsibilities

- **PostgreSQL**: Authoritative source of truth for users, projects, domains and entitlements (owned by SaaS Core). Search Service may own its own crawl/document tables.
- **Typesense**: Derived search index (rebuildable).
- **Redis**: Queues, rate limiting, transient coordination and justified caching.
- **Object Storage**: Durable blobs when required. Metadata stays in PostgreSQL.

## 12. Communication Rules Between Services

- Product services (Search and future products) must **never** access the Core database directly.
- All cross-service communication uses versioned APIs or asynchronous events.
- SaaS Core is the source of truth for identity, projects and permissions.
- Authorization is always enforced server-side.

## 13. Production Principles

- Strict TypeScript
- Validate all external input
- Enforce authorization server-side
- Make tenant isolation explicit and testable
- Treat derived indexes as rebuildable
- Make background jobs retryable and idempotent where practical
- Never commit secrets
- Require migrations for schema changes
- Keep infrastructure simple until real scale demands complexity
- Provide operational visibility before production launch
- Prefer explicit failure and recovery paths over silent degradation
- Pin important infrastructure and runtime versions

## 14. Definition of Success (MVP)

A real customer can:

1. Create an account
2. Create a search project
3. Configure a website / domain
4. Provide or discover a sitemap
5. Crawl and index the content
6. Install the search widget
7. Perform fast, useful search
8. Use typo tolerance, autocomplete and filters

The release must also have reproducible builds, CI checks, migrations, automated tests, secure configuration and documented operation procedures.
