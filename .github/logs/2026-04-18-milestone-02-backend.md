# 2026-04-18 - Milestone 02 - Backend Implementation

## Objective
Implement complete backend for multi-user Todo with robust auth and filtering.

## Implemented
- Express API with middleware stack (`helmet`, `cors`, `morgan`, JSON parser)
- PostgreSQL schema migration runner (`src/db/migrations.ts`)
- SQL migration file (`backend/sql/001_init.sql`)
- Auth module:
  - register/login
  - refresh token rotation
  - logout token revocation
  - hashed passwords (`bcryptjs`)
  - hashed refresh token storage (`sha256`)
- Todo module:
  - create/read/update/delete
  - status filtering (`all`, `active`, `completed`)
  - priority filtering (`low`, `medium`, `high`)
  - text search (`title`, `description`)
  - due date range filtering support in API

## Testing
- Unit tests:
  - `tests/unit/auth.service.test.ts`
  - `tests/unit/todo.service.test.ts`
- Integration tests:
  - `tests/integration/app.integration.test.ts`
  - In-memory Postgres-compatible DB via `pg-mem`

## Technical Notes
- UUIDs are generated in app layer to keep runtime and tests portable.
- Refresh tokens are rotated on each refresh call.
- API includes `/api/health` for runtime checks.
