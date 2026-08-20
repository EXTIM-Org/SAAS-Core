# API Contracts & Documentation

## Overview
To prevent future API contract mismatches and frontend/backend integration bugs, this project relies on a centralized repository of automated API documentation and shared TypeScript types.

## Swagger / OpenAPI
The API is built using NestJS and `@nestjs/swagger`.
Swagger UI is automatically generated based on the decorators defined in the API controllers (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, etc.).

### Local Access
When running the `apps/api` server locally, you can view and test the API documentation at:
**[http://localhost:4000/api/docs](http://localhost:4000/api/docs)** (assuming the default local port `4000` is used as configured in `.env`).

*Note: Ensure you include the necessary Bearer tokens in Swagger UI when testing authenticated endpoints.*

## Shared Types (`@saas/shared`)
To enforce strict alignment between the API and client applications (like `apps/dashboard`), cross-service TypeScript interfaces are stored in `packages/shared`.

This workspace package serves as the single source of truth for:
- API payload shapes (e.g., standard login response types like `LoginResponse`).
- User profile models (e.g., JWT `UserPayload`).
- Common DTO definitions used on both frontend and backend.

### Using Shared Types
Both frontend and backend packages must add `@saas/shared` to their `package.json`:
```json
"dependencies": {
  "@saas/shared": "workspace:*"
}
```
And import the necessary types/interfaces directly:
```typescript
import { LoginResponse } from '@saas/shared';
```

## Developer Guidelines
- **Always update documentation:** If you modify an API response or request shape, update the corresponding Swagger decorator in the controller immediately.
- **Extract to shared:** When introducing new API responses, declare their interfaces in `packages/shared/src/index.ts` first, then use them in both the API layer and the frontend.
