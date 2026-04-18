# 2026-04-18 - Milestone 05 - Run Backend + Frontend in Docker

## Goal
Start backend + frontend stacks in Docker and verify both run correctly.

## Actions Executed
1. Created `.env` from `.env.example`.
2. Created Docker external networks:
   - `backend_net`
   - `frontend_backend_net`
   - `mobile_backend_net`
3. Started backend stack:
   - `docker compose -f docker-compose.backend.yml up -d --build`
4. Started frontend stack:
   - `docker compose -f docker-compose.frontend.yml up -d --build`

## Issue Encountered
- API container (`todo_api`) entered restart loop.
- Root cause from logs: SQL migration parse error at `"?CREATE"` due UTF BOM in `backend/sql/001_init.sql`.

## Fix Applied
- Rewrote `backend/sql/001_init.sql` in BOM-free ASCII encoding.
- Restarted API service via compose.

## Verification
- `docker compose -f docker-compose.backend.yml ps`:
  - `todo_db` healthy
  - `todo_api` up with port `4000`
- Backend health endpoint:
  - `GET http://localhost:4000/api/health` returned `status: ok`
- Frontend availability:
  - `GET http://localhost:5173` returned HTTP `200`
- Live API smoke test:
  - `POST /api/auth/register` returned user object + access/refresh tokens.

## Result
Backend and frontend Docker stacks are running and working.
