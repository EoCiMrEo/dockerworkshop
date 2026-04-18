# Docker Workshop Todo Platform

A multi-user Todo platform with three containerized stacks:

- `backend` (Node.js + Express + PostgreSQL + JWT access/refresh auth)
- `frontend` (React + Vite web UI)
- `mobile` (Expo React Native + Android emulator container)

## Core Features

- Multi-user authentication using `username + password`
- JWT `access + refresh` token flow with rotation
- Todo CRUD (`create/read/update/delete`)
- Due date (stored as UTC, displayed in local time)
- Priority (`low | medium | high`)
- Search and filters (`status`, `priority`, text search)
- Active / completed views

## Docker Network Topology

This project uses three external Docker networks:

- `backend_net`: private DB/API traffic
- `frontend_backend_net`: frontend <-> API traffic
- `mobile_backend_net`: mobile/emulator <-> API traffic

The API service bridges all three so frontend and mobile can call it while DB remains isolated on `backend_net`.

## Project Structure

- `backend/` Express API, SQL migrations, unit/integration tests
- `frontend/` React web app and component tests
- `mobile/` Expo app and tests
- `docker-compose.backend.yml`
- `docker-compose.frontend.yml`
- `docker-compose.mobile.yml`
- `scripts/create-docker-networks.ps1`
- `scripts/create-docker-networks.sh`

## Quick Start

1. Create environment file at repo root:

```bash
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Create the three external Docker networks:

```powershell
npm run networks:create:ps
```

3. Start backend stack (API + DB):

```bash
docker compose -f docker-compose.backend.yml up -d
```

4. Start frontend stack:

```bash
docker compose -f docker-compose.frontend.yml up -d
```

5. Start mobile + Android emulator stack:

```bash
docker compose -f docker-compose.mobile.yml up -d
```

## Access Points

- Web app: `http://localhost:5173`
- API health: `http://localhost:4000/api/health`
- Android emulator (noVNC): `http://localhost:6080`
- Expo devtools/Metro: ports `19000`, `19001`, `19002`, `8081`, `19006`

## Android Emulator Notes

The mobile compose stack includes:

- `mobile` container running Expo
- `android_emulator` container (`budtmo/docker-android`)

This is intended for containerized GUI testing. On some Windows hosts, nested virtualization/GPU limits can affect emulator performance. If needed, keep Expo in Docker and run emulator on host as fallback.

## Compose Files

- `docker-compose.backend.yml`: `db` + `api`, DB named volume `db_data`, local bind mount for backend code
- `docker-compose.frontend.yml`: `frontend` with local bind mount
- `docker-compose.mobile.yml`: `mobile` + `android_emulator` with local bind mount

## Backend API Summary

Base URL: `/api`

Auth endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Todo endpoints (Bearer access token required):

- `GET /todos?status=all|active|completed&priority=...&search=...`
- `POST /todos`
- `GET /todos/:id`
- `PUT /todos/:id`
- `DELETE /todos/:id`

## Testing

Run tests per package:

```bash
cd backend && npm test
cd frontend && npm test
cd mobile && npm test
```

Backend includes:

- Unit tests for auth/todo services
- Integration tests for API flows using `pg-mem`

Frontend includes component/UI tests with Vitest.

Mobile includes screen/utils tests with Jest + `jest-expo`.

## Stop Stacks

```bash
docker compose -f docker-compose.mobile.yml down
docker compose -f docker-compose.frontend.yml down
docker compose -f docker-compose.backend.yml down
```

To remove DB persisted data as well:

```bash
docker compose -f docker-compose.backend.yml down -v
```
