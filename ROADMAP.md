# Roadmap

## Guiding Principle

Build and stabilize the **SaaS Core** first.  
Only after the Core is solid and usable, add product services on top of it.

The first product service is **Search**.

---

## Phase 0 — Foundation

**Goal:** Create a clean, reproducible engineering foundation.

**Tasks:**
- Monorepo workspace
- Package manager (pnpm)
- TypeScript strict mode
- Lint & format
- Basic app skeletons (`website`, `dashboard`, `api`)
- PostgreSQL + Prisma
- Redis
- Root Docker Compose
- `.env.example` and environment validation
- Healthchecks
- Development guide
- GitHub Actions CI
- Build / typecheck / test pipeline
- Structured logging baseline
- Health & readiness endpoints

**Exit criteria:**
- Fresh clone works with `docker compose up -d`
- Infrastructure becomes healthy
- Basic apps can start
- CI passes
- No secrets committed

---

## Phase 1 — SaaS Core (Complete First)

**Goal:** Deliver a complete and stable shared platform that future products will connect to.

**Tasks:**
- Authentication (sign up, login, logout, session/JWT)
- User management
- Tenant / project model
- Project CRUD
- Domain management
- Server-side authorization & tenant isolation
- Dashboard shell and basic navigation
- Core API conventions and error handling
- Basic usage / entitlement foundation
- API access foundation
- Website (marketing pages + documentation structure)
- End-to-end tests for auth and tenant isolation

**Exit criteria:**
- A user can register and log in
- A user can create and manage projects and domains
- Tenant isolation is enforced and tested
- Dashboard is usable for core operations
- Core API is stable and documented
- Local development workflow is fully reproducible

> Only after this phase is done do we start building product services.

---

## Phase 2 — Search Service (First Product)

**Goal:** Add the first independent product service on top of the stable SaaS Core.

**Tasks:**
- `search-api` and `search-worker` applications
- Integration with Core (project/domain validation via API)
- Sitemap ingestion
- Crawl scheduling
- Safe crawler (with SSRF protection, timeouts, limits, etc.)
- Content extraction & normalization
- Document metadata storage
- Typesense collections and indexing
- Retry & failure handling
- Search endpoint
- Typo tolerance
- Autocomplete
- Filters
- Persian language support
- Embeddable widget
- Crawl / index status visible in Dashboard
- Index rebuild capability

**Exit criteria:**
- A real website can be crawled and indexed
- Search works with typo tolerance, autocomplete and filters
- Widget is easy to install
- Search Service communicates with Core only through defined APIs
- Worker failures are visible
- Tenant isolation still holds across Core and Search
- Index can be fully rebuilt

---

## Phase 3 — Monetization & Platform Hardening

**Tasks:**
- Billing integration
- Plans and entitlements
- Usage limits and enforcement
- API keys
- Notifications
- Stronger observability
- Organizations (if needed)

---

## Phase 4 — Production Operations

**Tasks:**
- Error tracking (Sentry or equivalent)
- Metrics and dashboards
- Product analytics
- Audit logs
- Feature flags
- Backup & restore procedures
- Operational runbooks
- Deployment hardening

---

## Future Product Services

Only start new product services after:
1. SaaS Core is stable
2. Search Service is in real use

Each new product becomes its own coarse-grained service that integrates with the Core.

Planned products:
- Form Backend
- AI Chat
- SEO Platform
- Monitoring
- Analytics
- Email Platform

---

## Rules for All Phases

- Complete the SaaS Core before starting any product service
- Respect the Core / Search boundary (ADR-013)
- Prefer small vertical slices
- Keep AI agent work scoped to one service or package at a time
- Production safety and tenant isolation are never optional
