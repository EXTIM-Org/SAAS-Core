# Architecture Decision Records

This document records the architectural decisions that are currently in force.
Only active decisions are kept here. Superseded decisions are removed to keep the document focused.

---

## ADR-001 — Monorepo

**Status:** Accepted

**Decision:** Use a monorepo with independently deployable applications and reusable packages.

**Why:** Multiple products must share core platform capabilities. Shared tooling and coordinated changes are valuable at the current scale.

---

## ADR-002 — PostgreSQL as Source of Truth

**Status:** Accepted

**Decision:** PostgreSQL is the authoritative store for all durable SaaS and business data.

**Why:** Strong data integrity, mature tooling, and predictable migrations.

**Consequence:** Any derived system (such as search indexes) must be fully rebuildable from PostgreSQL.

---

## ADR-003 — Typesense as Search Engine

**Status:** Accepted

**Decision:** Typesense is the search and query engine for the Search product.

**Why:** Provides full-text search, typo tolerance, filtering, and autocomplete with low operational overhead.

**Consequence:** Typesense data is derived state and must be rebuildable at any time.

---

## ADR-004 — Redis + BullMQ for Background Jobs

**Status:** Accepted

**Decision:** Redis and BullMQ are used for all asynchronous work (crawling, indexing, scheduled jobs, etc.).

**Why:** These tasks are slow, failure-prone, and must not block API requests.

**Consequence:** Jobs must be retryable and tolerate duplicate execution where practical.

---

## ADR-005 — Separate Website and Dashboard

**Status:** Accepted

**Decision:** The public Website and the authenticated Dashboard are separate frontend applications.

**Why:** The Website has strong SEO and performance requirements that differ from the Dashboard UX.

---

## ADR-007 — Asynchronous Crawling

**Status:** Accepted

**Decision:** Crawling and indexing are performed by background workers, never inside synchronous API requests.

**Why:** Crawl workloads are slow and unreliable. They must be isolated from user-facing request latency.

---

## ADR-008 — Search Index Rebuildability

**Status:** Accepted

**Decision:** Typesense indexes are disposable. The system must be able to rebuild them completely from authoritative data.

**Why:** Makes schema changes, recovery, and data corrections safer.

---

## ADR-009 — Production Safety Over Feature Count

**Status:** Accepted

**Decision:** Prefer a smaller, production-safe system over a larger but fragile feature set.

---

## ADR-010 — Docker Compose as Local Infrastructure Contract

**Status:** Accepted

**Decision:** Local infrastructure (PostgreSQL, Redis, Typesense) is defined exclusively by the root `docker-compose.yml`.

**Why:** A fresh clone must work without manually installing databases or search engines on the host.

**Rules:**
- Named volumes for persistent data
- Healthchecks for all infrastructure services
- Service-to-service communication uses Compose DNS names
- Only safe local credentials are used
- Image versions are pinned (no `latest`)

---

## ADR-011 — Fresh-Clone Reproducibility

**Status:** Accepted

**Decision:** The repository must provide a documented, reproducible workflow for a complete fresh start (infrastructure + applications + migrations + tests).

---

## ADR-012 — Production-Appropriate Stable Versions

**Status:** Accepted

**Decision:** Use the latest stable, production-appropriate versions. Prefer LTS runtimes when available.

**Rules:**
- Do not use pre-release, alpha, or beta versions for production dependencies
- Do not blindly upgrade major versions
- Record important versions in `STACK_VERSIONS.md`
- Security patches may be applied without a major version change

---

## ADR-013 — Coarse-Grained Product Services with Unified SaaS Core

**Status:** Accepted

**Context:**  
Working primarily with AI coding agents showed that a large shared codebase often leads to cascading regressions. At the same time, the product roadmap includes multiple independent products that should not all live inside one monolith.

**Decision:**  
The system is split into coarse-grained services:

### 1. SaaS Core (unified platform)
Contains:
- Authentication and user management
- Tenant / project model
- Domain and project configuration
- Settings and entitlements foundation
- Website (marketing + documentation)
- Dashboard (authenticated customer UI)
- Core platform APIs

Runtime applications:
- `apps/website` (Next.js)
- `apps/dashboard` (Next.js)
- `apps/api` (NestJS)

### 2. Search Service (first product)
Contains:
- Sitemap ingestion
- Crawling and content extraction
- Normalization
- Typesense indexing
- Search API
- Embeddable widget
- Background workers

Runtime applications:
- `apps/search-api`
- `apps/search-worker`

### 3. Future products
Each new product (Form Backend, AI Chat, SEO Platform, etc.) will be added as its own coarse-grained service that integrates with the SaaS Core.

**Communication rules:**
- Product services must never access the Core database directly.
- All communication happens through versioned APIs or asynchronous events.
- The SaaS Core remains the single source of truth for users, projects, domains, and entitlements.
- Authorization and tenant isolation are enforced by the Core.

**Why this shape:**
- Keeps authentication and tenancy simple and consistent
- Isolates the heaviest workload (crawling & indexing)
- Gives AI agents a much smaller and clearer context when working on Search
- Makes it easy to add future products without growing a single monolith
- Avoids the high operational cost of fine-grained microservices

**Consequences:**
- Search and future products are independently deployable and testable
- Local development and CI must support starting Core and product services separately
- Explicit API contracts between Core and product services are required
