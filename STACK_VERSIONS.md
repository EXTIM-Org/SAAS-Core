# Stack Versions

## Versioning Policy

The project uses the latest **stable, production-appropriate** versions rather than blindly selecting the newest release.

For JavaScript runtimes, prefer LTS when it is compatible with the required ecosystem.

As of the current project baseline, the following versions are selected:

| Component       | Version     | Policy                                      |
|-----------------|------------:|---------------------------------------------|
| Node.js         | 24.18.0 LTS | Use LTS for production stability            |
| Next.js         | 16.2.11     | Active LTS release selected for production  |
| React           | 19.x        | Compatible with Next.js 16                  |
| NestJS          | 11.1.28     | Current stable Nest 11 line                 |
| Prisma          | 7.9.1       | Current stable release                      |
| pnpm            | 11.17.0     | Current stable package manager              |
| PostgreSQL      | 18.4        | Current stable major                        |
| Redis           | 8.8.1       | Current stable major                        |
| Typesense       | 30.2        | Latest stable Typesense release             |
| Docker Compose  | Compose Spec| Current recommended Compose format          |

## Why Node 24 Instead of Node 26

Node.js 26 is currently the Current release line, while Node.js 24 is LTS. For a production-oriented SaaS baseline, the LTS line is preferred until the newer major becomes LTS and the ecosystem compatibility is proven.

## Upgrade Rules

Do not upgrade major versions automatically.

For a major upgrade:

1. Read official release notes
2. Verify framework/runtime compatibility
3. Verify ORM/database compatibility
4. Verify Docker image availability
5. Run lint / typecheck / tests / build
6. Run integration tests against local Compose services
7. Update this document
8. Update relevant ADRs if architecture or behavior changes

Patch and minor security updates may be applied more frequently.

## Infrastructure Images

Important local infrastructure images are pinned rather than using `latest`:

```text
postgres:18.4-alpine
redis:8.8.1-alpine
typesense/typesense:30.2
```

## Sources

These baselines were checked against current vendor and package sources during preparation.

- Node.js: official release / status pages
- Next.js: official release / security announcements
- Prisma: npm package release information
- NestJS: current stable package release information
- pnpm: npm package release information
- PostgreSQL / Redis: official Docker images
- Typesense: official release repository
- Docker Compose: Docker Compose Specification
