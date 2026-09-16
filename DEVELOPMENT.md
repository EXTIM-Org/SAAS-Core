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

You can start the infrastructure (PostgreSQL, Redis, Typesense) via the built-in package script:

```bash
pnpm services:up
```

(This is equivalent to `docker compose up -d`).

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

After Prisma is set up, run the database migrations:

```bash
pnpm db:migrate:dev
```

Prefer repository scripts defined in `package.json` when they exist.

Seed data (if provided):

```bash
pnpm db:seed
```

Seeds must be safe for local development only and must never target production.

## 9. Starting Applications

### Recommended way (Everything at once)

To start the Docker infrastructure AND all the frontend/backend apps concurrently, use:

```bash
pnpm dev:all
```

### Start only the applications

If your Docker containers are already running, you can just start all apps:

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
pnpm services:down
```

(This is equivalent to `docker compose down`).

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

## 15. Remote Docker Services (SSH Tunnel)

If you are running the Docker infrastructure (PostgreSQL, Redis, Typesense) on a remote server (e.g. `192.168.137.113`) and want to develop locally, **do not open the database ports to the internet or public network**. Instead, use an SSH tunnel to forward the remote ports to your local machine securely.

### Establishing the SSH Tunnel

Run the following command in your local terminal (keep it running while developing):

```bash
ssh -N -L 5432:127.0.0.1:5432 -L 6379:127.0.0.1:6379 -L 8108:127.0.0.1:8108 -o ServerAliveInterval=60 -o ServerAliveCountMax=3 username@server_ip
```

- `-N`: Do not execute a remote command (just forwards ports).
- `-o ServerAliveInterval=60`: Sends a keep-alive signal every 60 seconds to prevent the connection from dropping due to inactivity.
- `-o ServerAliveCountMax=3`: Drops the connection only if 3 consecutive keep-alive signals fail.
- `-L`: Forwards your local port to the remote server's port.

### Environment Configuration

When the SSH tunnel is active, your local machine connects to the remote services as if they were running locally. Therefore, your local `.env` file **must** point to `127.0.0.1` (do NOT use the remote server's IP in `.env`):

```env
DATABASE_URL=postgresql://saas:saas-local-password@127.0.0.1:5432/saas?schema=public
REDIS_URL=redis://127.0.0.1:6379
TYPESENSE_URL=http://127.0.0.1:8108
NEXT_PUBLIC_TYPESENSE_HOST=127.0.0.1
```
