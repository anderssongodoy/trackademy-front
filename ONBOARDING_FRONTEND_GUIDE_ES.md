Guía de integración del Onboarding (Frontend)
=============================================

Resumen rápido
--------------
- Todas las peticiones autenticadas deben incluir el header: Authorization: Bearer <id_token> (id_token provisto por NextAuth).
- El backend expone rutas bajo el prefijo `/api` (ej. `http://localhost:8080/api`).

Endpoints relevantes
--------------------
- POST /api/onboarding/submit — Guardar preferencias del onboarding (body: `OnboardingRequestDto`).
- GET /api/onboarding/me — Obtener preferencias guardadas del usuario.
- PATCH /api/onboarding/me — Actualizar preferencias guardadas.
- POST /api/onboarding/courses — Registrar los cursos que el alumno actualmente cursa (requiere `termCode` o `termId`).
- GET /api/onboarding/status — Devuelve `{ "onboarded": true|false }` para saber si se debe saltar el onboarding.
- GET /api/terms/{id} — Obtener término por ID interno (DB id).
- GET /api/terms/by-code/{code} — Obtener término por código académico (ej. `202501`).
- GET /api/courses — Devuelve todo el catálogo de cursos (el backend no filtra por campus/program por ahora).
- GET /api/campuses, GET /api/programs, GET /api/cycles — catálogos.

Flujo recomendado al completar onboarding
----------------------------------------
1) Confirmar que `session.idToken` está presente en la sesión.
2) (Una vez por sesión) POST /api/auth/entra/callback con `{ idToken }` para asegurar que el usuario exista en el backend.
3) POST /api/onboarding/submit con el payload de preferencias.
4) Registrar cursos actuales: POST /api/onboarding/courses con `termCode` (recomendado) o `termId`.
   - Ejemplo usando `termCode`:
     {
       "termCode": "202501",
       "campusId": 3,
       "programId": 5,
       "courses": [ { "courseCode": "MAT101" } ]
     }
   - Ejemplo usando `termId`:
     {
       "termId": 3,
       "campusId": 3,
       "programId": 5,
       "courses": [ { "courseId": 11 } ]
     }
5) Si ambas llamadas devuelven 200 OK, redirigir al dashboard.

Problemas comunes y cómo detectarlos
-----------------------------------
- 401 Unauthorized: faltó el header Authorization con `id_token`. Revisa la pestaña Network y confirma el header.
- 404 Not Found en `/api/terms/by-code/{x}`: posiblemente `{x}` es un ID numérico; usa `/api/terms/{id}` para IDs y `/api/terms/by-code/{code}` para códigos académicos (ej. `202501`).
- 400 "term required" en POST /api/onboarding/courses: envía `termCode` (string) o `termId` válido.

Recomendaciones
---------------
- Usar `GET /api/onboarding/status` tras login para saltar el onboarding cuando `onboarded: true`.
- Guardar en `formData` tanto `termId` (si viene del catálogo) como `termCode` (cadena) para enviar la que corresponda.
- Si el backend no soporta filtros en `GET /api/courses`, filtrar en cliente (cliente puede usar `q` para buscar texto).

Depuración rápida (pasos)
------------------------
1) Abrir DevTools → Network.
2) Reproducir el flujo de completar onboarding y observar:
   - POST /api/onboarding/submit (status 200)
   - GET /api/terms/by-code/{code} o GET /api/terms/{id} (status 200)
   - POST /api/onboarding/courses (status 200)
3) Si algo devuelve 401 o 404, revisar URL y headers enviados.

Notas para backend
------------------
- El frontend prefiere `termCode` cuando no tiene el `termId` interno. Si pueden aceptar ambos, mejor.
- Sería útil devolver `GET /api/terms` (lista) para poblar selects sin que el cliente tenga que adivinar ids/codes.

---
Creado automáticamente a partir de la guía proporcionada y adaptado al equipo en español.
