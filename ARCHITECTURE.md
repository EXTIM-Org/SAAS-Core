# Architecture

## 1. Goal

Build a production-ready, reusable SaaS platform that can host multiple products.

The architecture uses **coarse-grained services**:
- A unified **SaaS Core** for shared platform capabilities
- Independent **Product Services** for each product (starting with Search)

This gives clear isolation for AI-assisted development and future products while keeping operational complexity manageable.

## 2. High-Level Shape

```text
┌─────────────────────────────────────────────────────┐
│                   SaaS Core                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Website    │  │  Dashboard  │  │  Core API   │  │
│  │  (Next.js)  │  │  (Next.js)  │  │  (NestJS)   │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                     │
│  Auth • Users • Projects • Domains • Settings       │
└──────────────────────────┬──────────────────────────┘
                           │ versioned APIs / events
                           ▼
┌─────────────────────────────────────────────────────┐
│                 Search Service                      │
│  ┌─────────────┐  ┌─────────────────────────────┐   │
│  │ Search API  │  │ Search Worker               │   │
│  │ (NestJS)    │  │ (crawl, extract, index)     │   │
│  └─────────────┘  └─────────────────────────────┘   │
└─────────────────────────────────────────────────────┘

Future products follow the same pattern and connect to the SaaS Core.
```

## 3. Repository Layout

```text
apps/
  website/          # Public marketing + docs (SEO-focused)
  dashboard/        # Authenticated customer UI
  api/              # SaaS Core API (auth, projects, domains, ...)
  search-api/       # Search product API
  search-worker/    # Crawl, extract, index jobs

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

## 4. Runtime Responsibilities

### SaaS Core

**Website**
- Marketing pages
- Documentation
- SEO

**Dashboard**
- Authenticated customer experience
- Project and domain management
- Usage and configuration views

**Core API**
- Authentication and session handling
- User management
- Tenant / project model
- Domain configuration
- Authorization
- Shared platform business rules
- Job orchestration triggers (when needed)

### Search Service

**Search API**
- Search endpoints
- Autocomplete
- Public/project-scoped search access
- Widget configuration endpoints

**Search Worker**
- Sitemap fetching
- Controlled crawling
- Content extraction and normalization
- Typesense indexing
- Retry and failure handling
- Index reconciliation / rebuild

## 5. Data Architecture

### PostgreSQL
Authoritative source of truth for:
- Users
- Projects / tenants
- Domains
- Configuration and entitlements
- Document metadata (ownership stays related to Core projects)

Search Service may own its own tables for crawl state and document content, but project/domain ownership always lives in the Core.

### Typesense
Derived search index. Must be fully rebuildable.

### Redis
- BullMQ queues
- Rate limiting
- Transient coordination
- Justified caching

### Object Storage
S3-compatible storage for durable blobs when required. Metadata remains in PostgreSQL.

## 6. Multi-Tenancy & Authorization

- Every customer-owned resource has explicit project/tenant ownership.
- Authorization is enforced server-side in the SaaS Core.
- Product services (Search, future products) must never trust client-supplied tenant/project IDs.
- Product services call Core APIs (or receive signed events) to verify ownership and permissions.
- Cross-tenant isolation must be covered by tests.

## 7. Communication Rules

- Product services **must not** access the Core database directly.
- All interaction happens through versioned HTTP APIs or asynchronous events.
- The SaaS Core is the source of truth for users, projects, domains and entitlements.
- Search Service is the source of truth for crawl state and indexed document content (within the scope of a project).

## 8. Search Flow

```text
Customer Website
      │
      ▼
 Sitemap / URL
      │
      ▼
 Search API  ──────►  Core API (validate project/domain)
      │
      ▼
 Redis / BullMQ
      │
      ▼
 Search Worker
      │
      ├──► Fetch / Extract / Normalize
      ├──► Store metadata (Search DB)
      └──► Typesense (derived index)
                │
                ▼
         Search API / Widget
```

## 9. Crawler Safety

Before production use, the crawler must implement:
- URL scheme validation
- Crawl-scope enforcement
- SSRF protection
- Timeouts
- Response-size limits
- Redirect limits
- Content-type restrictions
- Bounded concurrency
- Retry / backoff
- Failure isolation

## 10. Local Infrastructure

The root `docker-compose.yml` remains the single source of truth for local infrastructure:

- PostgreSQL
- Redis
- Typesense

Applications (Core and Search) run on the host or in optional containers and connect to these services.

## 11. Reliability Principles

- Tolerate duplicate jobs and worker restarts
- Treat Typesense as rebuildable
- Keep background work out of request/response paths
- Prefer explicit failure over silent degradation
- Design for tenant isolation from day one

## 12. Observability (before production)

- Structured logs
- Correlation / request IDs
- Job failure visibility
- Health and readiness endpoints
- Basic metrics
- Error reporting (Sentry or equivalent)

## 13. Version Governance

Important runtime and infrastructure versions are recorded in `STACK_VERSIONS.md`.
Do not use floating `latest` tags for critical components.

## 14. Architecture Evolution

Significant structural changes require:
1. Documenting the problem
2. Comparing realistic options
3. Recording the decision in `DECISIONS.md`
4. Updating this document
