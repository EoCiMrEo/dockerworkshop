# 2026-04-18 - Milestone 04 - Validation & Fix Iterations

## Validation Commands Run

### Frontend
- `npm install` (workspace: `frontend`)
- `npm test` (workspace: `frontend`)
- `npm run build` (workspace: `frontend`)

### Backend
- `npm install` (workspace: `backend`)
- `npm test` (workspace: `backend`)
- `npm run build` (workspace: `backend`)

### Mobile
- `npm install` (workspace: `mobile`)
- `npm test` (workspace: `mobile`)

## Issues Found During Validation

1. JSON BOM issue in root/package JSON parsing
- Symptom: tooling reported `Unexpected token` on root `package.json`
- Fix: rewrote project JSON files to BOM-free encoding.

2. Frontend type/config issues
- Symptom: Vite/Vitest config typing conflict and one failing test selector.
- Fix:
  - Separated `vite.config.ts` and `vitest.config.ts`
  - Updated AuthPanel test to query login/register buttons inside the `tablist`
  - Fixed auth context refresh return typing.

3. Backend test runner issues with Jest + ESM TS
- Symptom: Jest config/runtime mismatch under ESM TypeScript.
- Fix: switched backend tests to `Vitest` for stable ESM TypeScript execution.

4. Backend auth token collision under rapid issuance
- Symptom: immediate register/login generated same token, causing refresh-token hash collision and test/API failure.
- Fix: added unique `jti` claim via `randomUUID()` in access/refresh token creation.

5. Mobile Jest mock factory restriction
- Symptom: `jest.mock()` disallowed out-of-scope variable names.
- Fix: renamed mock references to `mockLogin` / `mockRegister` inside factory.

## Final Validation Status

- Frontend tests: PASS
- Frontend build: PASS
- Backend tests (unit + integration): PASS
- Backend build: PASS
- Mobile tests: PASS

All major stacks are now implemented and validated.
