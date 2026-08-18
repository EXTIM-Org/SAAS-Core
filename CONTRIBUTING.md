# Contributing

## Branches

Never work directly on `main`.

Examples of good branch names:

```text
feat/core-auth
feat/search-crawler
fix/search-redirect-limit
refactor/core-project-model
chore/ci-build
```

## Pull Requests

Meaningful changes should produce focused, reviewable PRs.

Include in the PR description:

- Summary
- Motivation
- Implementation notes
- Tests added or changed
- Migration impact (if any)
- Security impact
- Local development impact
- Known limitations

## Required Checks

Before merge:

- lint
- typecheck
- tests
- build
- migration validation when applicable

## Architecture Boundaries

Respect the coarse-grained boundaries defined in `DECISIONS.md` (ADR-013) and `ARCHITECTURE.md`:

- **SaaS Core**: `apps/website`, `apps/dashboard`, `apps/api`
- **Search Service**: `apps/search-api`, `apps/search-worker`

Do not move logic across the Core / Search boundary without explicit approval.
Product services must not access the Core database directly.

## Database Changes

Schema changes require Prisma migrations.

Review carefully for:

- data loss
- locking
- compatibility
- indexes
- deployment ordering

## Dependencies and Versions

New dependencies require justification.

Prefer the versions recorded in `STACK_VERSIONS.md`.

When upgrading a major dependency:

- review release notes
- check compatibility
- run all CI checks
- update `STACK_VERSIONS.md`

## Docker / Local Infrastructure

When changing local infrastructure:

1. Update `docker-compose.yml`
2. Update `.env.example` when variables change
3. Update `DEVELOPMENT.md`
4. Update `STACK_VERSIONS.md` when versions change
5. Update `ARCHITECTURE.md` or `DECISIONS.md` when the contract changes

## Secrets

Never commit secrets.

Use `.env` locally.

Only safe placeholder values belong in `.env.example`.

## Working with AI Agents

- Keep each task strictly scoped to one service or package
- Do not allow the agent to perform unrelated refactors
- Prefer small vertical changes over large rewrites
- Require the agent to stop and ask when a change would cross service boundaries
