# 2026-04-18 - Milestone 01 - Architecture & Container Topology

## Objective
Build a simple but production-structured Todo platform using three stacks (backend, frontend, mobile), all containerized and connected through explicit Docker networks.

## Decisions
- Chosen backend framework: Express (Node.js)
- Chosen API style: REST
- Chosen database: PostgreSQL
- Chosen web frontend: React + Vite
- Chosen mobile stack: Expo React Native
- Auth strategy: username/password + JWT access/refresh

## Docker Network Design
Implemented three external Docker networks:
- `backend_net`: DB/API internal traffic
- `frontend_backend_net`: frontend and API shared traffic
- `mobile_backend_net`: mobile/emulator and API shared traffic

API container is attached to all three networks so it can bridge frontend/mobile to backend safely.

## Compose Strategy
Used multiple compose files (as requested):
- `docker-compose.backend.yml`
- `docker-compose.frontend.yml`
- `docker-compose.mobile.yml`

## Persistence / Dev Ergonomics
- PostgreSQL uses named volume `db_data` for persistent data.
- App code for backend/frontend/mobile is bind-mounted for local development.
- Separate `node_modules` volumes per stack for container-side dependency caching.

## Notes
Added network creation scripts:
- `scripts/create-docker-networks.ps1`
- `scripts/create-docker-networks.sh`
