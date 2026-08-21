# AGENTS.md

## Mission

You are the primary software engineering agent for this repository.

Implement the product described in `PROJECT.md` while strictly following the architecture in `ARCHITECTURE.md` and the active decisions in `DECISIONS.md`.

Your highest priorities are:

1. Do not break existing working code.
2. Stay inside the requested scope.
3. Prefer small, reviewable changes.
4. Preserve production safety and tenant isolation.

## Required Reading Before Any Significant Work

1. `PROJECT.md`
2. `ARCHITECTURE.md`
3. `DECISIONS.md`
4. `DEVELOPMENT.md`
5. `STACK_VERSIONS.md`
6. The specific files you are asked to change

Never start large implementation work without reading the relevant sections of these documents.

## Architecture Boundaries (Mandatory)

The system has two main parts:

### SaaS Core

- `apps/website`
- `apps/dashboard`
- `apps/api`
- Related packages (`auth`, `database`, `ui`, etc.)

Responsible for: Authentication, users, projects, domains, settings, platform APIs.

### Search Service

- `apps/search-api`
- `apps/search-worker`

Responsible for: Crawling, extraction, indexing, search API, widget.

**Hard rules:**

- Search Service must never access the Core database directly.
- All communication between Core and Search must go through versioned APIs or events.
- Do not move logic across this boundary unless the task explicitly says so.
- Do not create new fine-grained microservices.

## Working Rules (Very Important)

For every task:

1. Understand exactly what is requested.
2. Identify which service/app/package is in scope.
3. Touch only files that are necessary for the task.
4. Prefer the smallest possible change.
5. Do not perform unrelated refactors.
6. Do not “improve” or clean up code outside the requested scope.
7. Do not change architecture, boundaries, or public contracts unless explicitly asked.
8. After changes, run the relevant checks (typecheck, lint, tests) for the affected part only.

### Scope Control

- If a task says “fix X”, only fix X. Do not rewrite surrounding modules.
- If you discover a larger problem, report it instead of fixing it silently.
- If the requested change would require crossing the Core / Search boundary, stop and ask for confirmation.

### Error Handling Behavior

When you encounter an error:

- Fix the specific error you were asked to fix.
- Do not start cascading refactors to resolve secondary issues.
- If fixing the error correctly requires changes outside the current scope, explain the situation and wait for instruction.

## Decision Priority

Use this hierarchy when trade-offs appear:

1. SEO (for Website)
2. Performance
3. Maintainability
4. Security
5. Scalability
6. Developer Experience

Security, data integrity, and tenant isolation are hard constraints.

## Stable Version Policy

Follow the versions recorded in `STACK_VERSIONS.md`.

- Prefer stable/LTS releases.
- Do not introduce pre-release or beta dependencies.
- Do not upgrade major versions unless explicitly requested.
- Pin important runtime and infrastructure versions.

## Approval Required

Stop and ask for human approval before changing:

- System architecture or service boundaries
- Tenant / isolation model
- Authentication or authorization design
- Public API contracts
- Destructive database migrations
- Production infrastructure
- Billing or entitlements
- Major dependencies or technology stack
- Any accepted ADR

## Code Quality Rules

- TypeScript strict mode only.
- Avoid `any` and unsafe casts.
- Keep modules cohesive and business logic testable.
- Do not leave required production behavior as TODO.
- Do not introduce temporary hacks without documenting them.
- Validate all untrusted input.
- Enforce authorization server-side.
- Never trust tenant or project IDs coming from clients.

## Database Rules

- PostgreSQL is the source of truth for Core data.
- Schema changes require Prisma migrations.
- Review migrations for data loss and locking.
- Prefer database constraints for critical invariants.
- Never silently delete customer data.

## Search Service Rules

- Typesense is derived state and must remain rebuildable.
- Crawling and indexing must run in the worker, never in request/response paths.
- Indexing jobs must be retryable and as idempotent as practical.
- Crawler must implement safety controls (scheme validation, SSRF protection, timeouts, size limits, etc.) before production use.

## Testing Expectations

A completed feature requires appropriate tests.

Minimum checks before considering work done:

- Lint
- Typecheck
- Unit tests for the changed part
- Integration tests when the feature touches infrastructure or cross-service behavior
- Production build of the affected apps

Critical paths (auth, authorization, tenant isolation, search) require negative-path tests.

## Git & Change Discipline

- Never work directly on `main`.
- Keep commits focused.
- Do not mix unrelated refactors with feature work.
- Prefer small pull requests.

## Documentation

Update documentation when you change:

- Architecture or service boundaries
- API contracts
- Local development workflow
- Environment variables
- Accepted decisions

## Definition of Done

Work is done only when:

- The requested behavior is implemented
- Scope was respected
- Relevant tests and checks pass
- No accidental secrets were introduced
- No architecture boundaries were violated
- Documentation is updated if needed

## Final Instruction to the Agent

If you are unsure whether a change is inside the allowed scope, **stop and ask**.

It is always better to ask than to silently expand the change and break other parts of the system.
