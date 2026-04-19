# 2026-04-19 - Milestone 07 - Mobile Auth Validation Debug

## Problem Reported
While testing the mobile app through Expo Go on a real phone, the app successfully reached the backend after the API URL was corrected, but registration still failed with the generic error message:

- `Validation failed`

This made the issue look like a backend or networking bug even though the request was already reaching the server.

## Root Cause
There were two separate issues contributing to the confusion:

1. The backend validation rules were stricter than the mobile UI hinted at.
- `username` must be 3-32 characters and only contain letters, numbers, or underscore.
- `password` must be 8-128 characters.
- Example failing input from device testing used a password shorter than 8 characters, which the backend correctly rejected.

2. The mobile client discarded backend validation details.
- Backend responses already included `details`, for example:
  - `password must be at least 8 characters`
- The mobile API client only surfaced `payload.error`, so the user only saw `Validation failed`.

## Why It Happened
- The backend used Zod validation correctly.
- The mobile UI did not perform matching local validation before sending auth requests.
- The mobile API error parser only displayed the top-level error string instead of the detailed validation messages returned by the backend.
- The web client had the same generic error parsing problem, so the bug was not mobile-only.

## Fixes Applied

### Mobile
- Updated `mobile/src/api/client.ts` to surface backend `details` when present.
- Added `mobile/src/utils/authValidation.ts` to mirror backend auth constraints in the UI.
- Updated `mobile/src/screens/AuthScreen.tsx` to:
  - validate before sending requests,
  - trim usernames before submission,
  - disable username autocorrect.

### Web
- Updated `frontend/src/api/client.ts` to surface backend `details`.
- Added `frontend/src/utils/authValidation.ts`.
- Updated `frontend/src/components/AuthPanel.tsx` to validate before making auth requests and trim usernames before submission.

### Test Coverage
- Added validation utility tests for both mobile and web.
- Expanded auth screen/panel tests to verify that weak passwords are blocked locally and do not trigger auth requests.

## Outcome
- Invalid auth input now shows the real reason instead of the generic `Validation failed`.
- Users get fast local feedback before a network request is even sent.
- Backend behavior remains correct and unchanged; the bug was primarily missing client-side validation and poor error presentation.

## Validation
- Backend health check remained healthy.
- Valid registration via API still succeeded.
- Mobile Jest tests passed after the fix.
- Frontend Vitest tests passed after the fix.
