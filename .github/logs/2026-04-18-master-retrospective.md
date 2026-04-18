# 2026-04-18 - Master Retrospective (Full Implementation Journal)

## Scope Requested
Build a simple Todo app with UI using three separate stacks:
- Frontend (React + Vite)
- Backend including DB (Express + PostgreSQL)
- Mobile for Android (React Native via Expo)

Constraints requested:
- Dockerized execution
- Three separate Docker networks
- Multi-user auth with JWT access + refresh
- Feature set: CRUD, due date, priority, search/filter, active/completed views
- Detailed implementation logging under `.github/logs`

---

## Final Architecture Delivered

### Stack and Service Layout
- Backend stack (`docker-compose.backend.yml`):
  - `todo_db` (`postgres:16-alpine`)
  - `todo_api` (Node 20 + Express app)
- Frontend stack (`docker-compose.frontend.yml`):
  - `todo_frontend` (Node 20 + Vite dev server)
- Mobile stack (`docker-compose.mobile.yml`):
  - `todo_mobile` (Expo dev server)
  - `todo_android_emulator` (`budtmo/docker-android`)

### Network Topology
Implemented 3 external networks:
1. `backend_net` (private DB/API)
2. `frontend_backend_net` (frontend <-> API)
3. `mobile_backend_net` (mobile/emulator <-> API)

API is attached to all three to bridge consumers to backend safely.

---

## What Was Implemented

### Backend
- Express REST API with modules:
  - Auth module:
    - `POST /api/auth/register`
    - `POST /api/auth/login`
    - `POST /api/auth/refresh`
    - `POST /api/auth/logout`
  - Todo module:
    - `GET /api/todos`
    - `POST /api/todos`
    - `GET /api/todos/:id`
    - `PUT /api/todos/:id`
    - `DELETE /api/todos/:id`
- JWT auth model:
  - Access token + refresh token
  - Refresh token storage hashed in DB
  - Rotation + revocation
- PostgreSQL migration system:
  - `backend/sql/001_init.sql`
  - Migration tracking table `schema_migrations`
- Todo filters supported:
  - `status=all|active|completed`
  - `priority=low|medium|high`
  - `search=...`
  - optional date-range and pagination parameters

### Frontend
- Auth screen (login/register)
- Dashboard with stats cards
- Todo create/edit/delete/toggle flow
- Search/filter controls
- Due date local handling utilities
- Responsive immersive visual style
- Test suite via Vitest

### Mobile
- Expo React Native app:
  - Auth screen
  - Todo screen
  - CRUD + filter interactions
  - AsyncStorage session persistence
- Test suite via Jest (`jest-expo`)

### DevOps/Repo Setup
- Root workspace package + scripts
- Docker network creation scripts (`.ps1`, `.sh`)
- `.env.example`
- Git repo initialized
- Root `README.md` added

---

## Validation and Reliability Work

### Frontend Validation
- `npm test` (frontend) -> PASS
- `npm run build` (frontend) -> PASS

### Backend Validation
- `npm test` (backend) -> PASS (unit + integration)
- `npm run build` (backend) -> PASS

### Mobile Validation
- `npm test` (mobile) -> PASS

### Runtime Validation in Docker
- Backend + frontend stacks launched via compose
- Health check: `GET http://localhost:4000/api/health` -> `status: ok`
- Frontend check: `GET http://localhost:5173` -> `200`
- Live API smoke test: `POST /api/auth/register` succeeded

---

## Problems Encountered and How They Were Solved

### 1) Hidden BOM in root `package.json` broke tooling
- Symptom:
  - Vitest/Vite parse error like `Unexpected token '?'` in package config.
- Root cause:
  - File encoding included UTF BOM; some parsers rejected it.
- Fix:
  - Rewrote project JSON files to BOM-free encoding.

### 2) Frontend config/type conflicts (`vite` + `vitest`)
- Symptom:
  - Build-time type conflicts between Vite and Vitest config types.
- Root cause:
  - Single config mixed build/test concerns and mismatched type imports.
- Fix:
  - Split into:
    - `frontend/vite.config.ts` for build
    - `frontend/vitest.config.ts` for tests

### 3) Frontend test selector ambiguity
- Symptom:
  - Test failed because two "Login" buttons existed (tab button + submit).
- Root cause:
  - Query targeted global role/name without scope.
- Fix:
  - Scoped selector to auth mode `tablist` using `within(...)`.

### 4) Backend Jest + ESM TypeScript instability
- Symptom:
  - Repeated Jest runtime/config transform errors under ESM TS setup.
- Root cause:
  - Jest + ts-jest + ESM combination created nontrivial config/runtime friction.
- Fix:
  - Migrated backend tests to Vitest for stable ESM TS support.

### 5) Backend auth failures from token collisions
- Symptom:
  - Immediate register/login could trigger refresh-token hash collisions and 500s.
- Root cause:
  - Tokens generated in same second with same payload could match exactly.
- Fix:
  - Added unique `jti` (`randomUUID`) to token claims.

### 6) Mobile Jest mock factory restriction
- Symptom:
  - Jest rejected out-of-scope variable access inside `jest.mock()` factory.
- Root cause:
  - Mock factory referenced non-`mock*` variables.
- Fix:
  - Renamed to `mockLogin` / `mockRegister` and used those in factory.

### 7) Docker backend restart loop due SQL BOM
- Symptom:
  - `todo_api` restarted repeatedly; logs showed Postgres parse error near `?CREATE`.
- Root cause:
  - BOM in `backend/sql/001_init.sql` migration file.
- Fix:
  - Rewrote SQL file as BOM-free ASCII and restarted API.

---

## Current Outcome
All requested stacks are implemented and validated.
- Backend: healthy and tested
- Frontend: healthy and tested
- Mobile: implemented and test-validated
- Docker runtime: backend + frontend confirmed operational

---

## Reference Logs
See milestone logs for step-by-step snapshots:
- `2026-04-18-milestone-01-architecture.md`
- `2026-04-18-milestone-02-backend.md`
- `2026-04-18-milestone-03-frontend-mobile-docs.md`
- `2026-04-18-milestone-04-validation.md`
- `2026-04-18-milestone-05-run-backend-frontend.md`
