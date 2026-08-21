# Development Guide

## Goal

A fresh clone must reproduce local infrastructure and allow development of both the SaaS Core and the Search Service with minimal host configuration.

Docker Desktop or Docker Engine with Docker Compose is the only required infrastructure prerequisite.

Do not install PostgreSQL, Redis or Typesense directly on the host unless you intentionally choose a separately documented workflow.

## 1. Fresh Clone

```bash
git clone <repository-url>
cd saas-core-platform
```

## 2. Copy Environment File

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Never commit `.env`.

## 3. Verify Tooling Versions

Supported versions are documented in `STACK_VERSIONS.md`.

Recommended runtime management file: `.nvmrc`.

If using Corepack:

```bash
corepack enable
```

Then use the package manager version pinned by the repository.

## 4. Start Infrastructure

```bash
docker compose up -d
```

Check status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs -f
```

Canonical local infrastructure:

- PostgreSQL
- Redis
- Typesense

## 5. Local Endpoints

**Host access:**

```text
PostgreSQL:  127.0.0.1:5432
Redis:       127.0.0.1:6379
Typesense:   http://127.0.0.1:8108
```

**Container-to-container access:**

```text
postgres:5432
redis:6379
typesense:8108
```

Never use `localhost` for container-to-container communication.

## 6. Environment & Connection Strings

Values in `.env.example` are aligned with the Compose configuration.

Local database credentials:

```text
user:     saas
database: saas
password: saas-local-password
```

Host-run connection string:

```text
postgresql://saas:saas-local-password@127.0.0.1:5432/saas?schema=public
```

Container-internal connection string:

```text
postgresql://saas:saas-local-password@postgres:5432/saas?schema=public
```

Redis (host):

```text
redis://127.0.0.1:6379
```

Redis (container):

```text
redis://redis:6379
```

Typesense (host):

```text
http://127.0.0.1:8108
```

Typesense (container):

```text
http://typesense:8108
```

## 7. Install Dependencies

The project uses pnpm.

```bash
pnpm install
```

## 8. Database

After Prisma is set up:

```bash
<<<<<<< HEAD
pnpm prisma migrate dev
=======
pnpm db:migrate:dev
>>>>>>> 162f8c2 (Phase 0)
```

Prefer repository scripts defined in `package.json` when they exist.

Seed data (if provided):

```bash
pnpm db:seed
```

Seeds must be safe for local development only and must never target production.

## 9. Starting Applications

### Recommended way (all apps)

```bash
pnpm dev
```

### Individual apps

```bash
# SaaS Core
pnpm --filter website dev
pnpm --filter dashboard dev
pnpm --filter api dev

# Search Service
pnpm --filter search-api dev
pnpm --filter search-worker dev
```

Final supported commands must match the actual `package.json` scripts.

## 10. Which App Belongs Where

| App             | Service   | Purpose                               |
| --------------- | --------- | ------------------------------------- |
| `website`       | SaaS Core | Public marketing + documentation      |
| `dashboard`     | SaaS Core | Authenticated customer UI             |
| `api`           | SaaS Core | Auth, projects, domains, platform API |
| `search-api`    | Search    | Search endpoints + widget support     |
| `search-worker` | Search    | Crawling, extraction, indexing        |

## 11. Validation Before PR

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run integration tests when the changed feature uses infrastructure or crosses the Core / Search boundary.

## 12. Shutdown

Stop containers while keeping data:

```bash
docker compose down
```

Reset everything (delete volumes):

```bash
docker compose down -v
```

Warning: `-v` deletes local PostgreSQL, Redis and Typesense data.

## 13. Troubleshooting

### Port already in use

Default ports: `5432`, `6379`, `8108`.
Stop the conflicting process or change the host mapping and update documentation.

### Service not healthy

```bash
docker compose ps
docker compose logs postgres
docker compose logs redis
docker compose logs typesense
```

Applications should wait for readiness, not only rely on startup order.

### Search index problems

Typesense is derived state. Once implemented, the Search Service must provide a rebuild/reconciliation path.

## 14. Development Rules

- `.env` stays local and uncommitted
- Production credentials never enter local config
- Infrastructure is started only through Docker Compose
- Local state lives in named volumes
- Core and Search must be startable independently
- Any change to setup must update this document
- The fresh-clone workflow is a hard requirement

```

```
