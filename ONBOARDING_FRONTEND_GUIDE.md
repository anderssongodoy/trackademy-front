Onboarding frontend guide
=========================

What the frontend must do when completing onboarding
-----------------------------------------------------

- Always include Authorization: Bearer <id_token> for authenticated endpoints.
- Use the correct endpoint paths (backend runs with context `/api`):
  - POST /api/onboarding/submit — submit onboarding payload (body: `OnboardingRequestDto`).
  - GET /api/onboarding/me — fetch stored onboarding preferences for the current user.
  - PATCH /api/onboarding/me — update stored onboarding preferences.
  - POST /api/onboarding/courses — register user's current courses (requires termId or termCode).
  - GET /api/onboarding/status — returns JSON { "onboarded": true|false } so the frontend can skip onboarding if true.

Payload examples
----------------

1) Submit onboarding using academic term code or DB values (example):

Using campus/program IDs and academic code:

{
  "campus": 3,
  "cycle": 1,
  "program": 5,
  "wantsAlerts": true,
  "wantsIncentives": false,
  "allowDataSharing": true
}

Using campus name and program slug:

{
  "campus": "Main Campus",
  "cycle": 1,
  "program": "program-slug",
  "wantsAlerts": true
}

2) Register current courses (POST /api/onboarding/courses):

Option A — send termCode (recommended when frontend doesn't have DB ids):

{
  "termCode": "202501",
  "campusId": 3,
  "programId": 5,
  "courses": [
    { "courseCode": "MAT101" },
    { "courseCode": "FIS101" }
  ]
}

Option B — send DB ids:

{
  "termId": 7,
  "campusId": 3,
  "programId": 5,
  "courses": [
    { "courseId": 11 },
    { "courseId": 12 }
  ]
}

Common frontend mistakes we've observed
--------------------------------------

- Calling /api/terms/by-code/3 when 3 is an internal DB id. Use `/api/terms/3` for DB id and `/api/terms/by-code/{code}` for academic codes like `202501`.
- Not sending Authorization header (results in 401). Use Bearer <id_token> from NextAuth.
- Not validating that a given termCode exists before POSTing courses (results in 400 "term required" or 404 by-code).

How to skip onboarding for users who already completed it
---------------------------------------------------------

Frontend flow to avoid re-showing onboarding:

1) After login, call GET /api/onboarding/status with Authorization header.
   - Response: { "onboarded": true } or { "onboarded": false }
2) If onboarded === true: skip the onboarding flow and redirect to the app home.
3) If onboarded === false: show onboarding and call POST /api/onboarding/submit when user completes.

Notes for the backend
---------------------

- The backend persists an `onboarded` boolean in the `users` table when onboarding is saved.
- We added the GET /api/onboarding/status endpoint so the frontend can quickly check completion.

Debug tips for the frontend team
--------------------------------

- Use the browser devtools network tab to inspect the request URL and the Authorization header.
- If you get 404 for `/api/terms/by-code/{code}` check whether `{code}` is actually the DB id; if so switch to `/api/terms/{id}`.
- If POST /api/onboarding/courses returns 400 "term required", first call GET /api/terms/by-code/{code} to confirm the term exists.

If you want, we can also:
- Add GET /api/terms (all) to let the frontend list terms without knowing ids/codes, or
- Make `/api/terms/by-code/{code}` try id fallback when a numeric value is supplied (to tolerate client bugs).

---
Generated: automated guide to help frontend integrate reliably with the backend onboarding endpoints.
