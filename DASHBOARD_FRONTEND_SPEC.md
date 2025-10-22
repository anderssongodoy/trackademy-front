# Especificación Frontend: Onboarding → Dashboard (paso a paso)

Este documento centraliza el flujo completo que el frontend debe implementar para el onboarding y para poblar el Dashboard. Incluye: orden de llamadas, qué endpoints "entregan datos" vs cuáles requieren que el frontend coloque datos, ejemplos de payloads, cabeceras y notas UX.

Resumen rápido (quick start)
- Después del login con NextAuth: POST `/api/auth/entra/callback` con `idToken` para que el backend upserte el user.
- Llamar GET `/api/onboarding/status`. Si `false`, ejecutar flujo de onboarding (form + POST `/api/onboarding/courses` y PATCH `/api/onboarding/me`).
- Tras completar onboarding, recargar GET `/api/student/me` y GET `/api/enrollments/me` y mostrar `/api/student/dashboard` (endpoint agregado) para obtener todo en una sola llamada.

Requisitos de cabecera para todas las llamadas protegidas
- Authorization: Bearer <id_token> (id_token que entrega NextAuth / Microsoft Entra)

---

1) Flujo y quién provee qué (orden recomendado y dependencia de datos)

- 1. Login (NextAuth) → Front recibe `id_token`.
  - Acción necesaria del front: POST `/api/auth/entra/callback` con body `{ "idToken": "..." }` (esto upserta el usuario en la base de datos). Este endpoint requiere el `id_token` y devuelve el `userId`/email.

- 2. Comprobar onboarding: GET `/api/onboarding/status`
  - Si respuesta `{"onboarded": false}` → mostrar formulario de onboarding.

- 3. Onboarding form (datos mínimos que el front debe pedir y dónde se guardan):
  - Campos que el front debe pedir y POST/PATCH:
    - Campus: seleccionar y enviar `preferredCampus` en `PATCH /api/onboarding/me` (se guarda en `User.preferredCampus`).
    - Programa: enviar `preferredProgram` (id o slug) en `PATCH /api/onboarding/me`.
    - Ciclo actual: enviar `preferredCycle` en `PATCH /api/onboarding/me`.
    - Cursos actuales: enviar list a `POST /api/onboarding/courses` (crea `Enrollment` + `EnrolledCourse`).
    - Horas de estudio, preferencias (studyHoursPerDay, preferredStudyTimes, wantsAlerts) → `PATCH /api/onboarding/me`.

  - Notas: `POST /api/onboarding/courses` crea las estructuras académicas necesarias para que el dashboard muestre enrollments y materias (por eso es crítico llamarlo durante onboarding si el usuario ya está cursando materias).

- 4. Tras enviar onboarding:
  - Llamar `GET /api/student/me` → devuelve `StudentMeDTO` con campusName, programName, termLabel y resumen de créditos.
  - Llamar `GET /api/enrollments/me` → lista de enrollments legibles (termCode, campusName, programName)
  - Opcional: usar `GET /api/student/dashboard` para obtener todo en un solo payload (recomendado).

---

2) Matriz de APIs: qué entregan datos (READ) y qué necesitan que el front ponga datos (WRITE)

- POST `/api/auth/entra/callback` — WRITE (front debe enviar id_token inmediatamente tras login). Guarda/actualiza User.
## Especificación Frontend (completa)

Este documento es la guía definitiva para el equipo frontend que implementará el Onboarding y el Dashboard del proyecto Trackademy. Está escrito en español y contiene todo lo requerido para montar la integración: flujo de autenticación, todos los endpoints relevantes, ejemplos de payloads y respuestas, validaciones, UX recomendada, manejo de errores, checklist de pruebas manuales y sugerencias para generar clientes TypeScript/mock servers.

Tabla de contenido
- Resumen ejecutivo
- Requisitos previos (tokens y cabeceras)
- Flujo de autenticación (NextAuth + Microsoft Entra)
- Flujos de Onboarding (paso a paso)
- Endpoints (documentación por endpoint) — request/response/ejemplos
- Contratos de datos (DTOs) con JSON de ejemplo
- Dashboard consolidado: payload completo de ejemplo
- Estrategia UI / patrones de interacción
- Validaciones y reglas de negocio para el frontend
- Manejo de errores y códigos HTTP (qué hacer en cada caso)
- Checklist de QA y pruebas manuales (paso a paso)
- Recomendaciones para integración (typescript client, mock server, tests)
- Seguridad, CORS y buenas prácticas
- Notas finales y próximos pasos


## Resumen ejecutivo

Objetivo: permitir al usuario iniciar sesión con Microsoft Entra, completar un onboarding que capture campus/programa/ciclo y opcionalmente los cursos actuales, y consumir un Dashboard único que muestre perfil, enrollments, alerts, calendar events, motivations/ranking y recomendaciones.

Puntos clave para el frontend:
- Autenticación: usar NextAuth (u otra librería) y pasar el id_token en header `Authorization: Bearer <id_token>`.
- Onboarding crítico: llamar `POST /api/onboarding/courses` si el usuario tiene cursos activos para que aparezcan en `enrollments` y en recomendaciones.
- Usar `GET /api/student/dashboard` como primera carga para reducir round-trips.


## Requisitos previos (tokens y cabeceras)

- Todas las llamadas a endpoints protegidos requieren:
  - Header: `Authorization: Bearer <id_token>` (id_token emitido por NextAuth/Entra).
- El backend usa el token para identificar al usuario; nunca confíes en `userId` enviado por el cliente.


## Flujo de autenticación (NextAuth + Microsoft Entra)

1. El frontend inicia el login con NextAuth/Microsoft Entra.
2. Al recibir el id_token, el frontend debe:
   - Almacenar el token en la sesión gestionada por NextAuth (no en localStorage si es posible).
   - Llamar opcionalmente `POST /api/auth/entra/callback` con el header Authorization para que el backend procese/upserte al usuario (no obligatorio si no se necesita un callback explícito, ya que el backend también valida el token en cada request).

Headers ejemplo para llamadas protegidas:

Authorization: Bearer eyJhbGciOiJ... (JWT)


## Flujos de Onboarding (paso a paso)

Objetivo: recopilar preferencias del usuario y, si corresponde, crear enrollments con sus cursos actuales.

Pantallas del wizard (sugeridas):
- Bienvenida / Confirmación de cuenta
- Selección de Campus
- Selección de Programa
- Selección de Ciclo (Term)
- Mis cursos actuales (autocompletar por código) — CRÍTICO si el estudiante ya cursa materias
- Preferencias (horas de estudio, notificaciones)
- Resumen y finalizar

Orden de llamadas recomendado (por pantalla):
1. Después del login, llamar `GET /api/onboarding/status`.
2. Si `onboarded == false`, abrir wizard del Onboarding.
3. En el paso "Mis cursos actuales" hacer `POST /api/onboarding/courses` con `termId/termCode`, `campusId`, `programId` y `courses`.
4. En paralelo o después, `PATCH /api/onboarding/me` para guardar preferencias (campus/program/cycle/wantsAlerts/etc.).
5. Al completar, redirigir al Dashboard y cargar `GET /api/student/dashboard`.


## Endpoints (documentación por endpoint)

Nota: incluiré request/response, errores y ejemplos concretos.

### Autenticación / callback

POST /api/auth/entra/callback
- Descripción: opcional; permite que el backend procese el id_token inmediatamente tras el login (upsert de User).
- Headers: Authorization: Bearer <id_token>
- Body: vacío o {}.
- 200 OK: {"status":"ok"} o 201 con User DTO.
- 401 Unauthorized: token inválido/expirado.


### Onboarding status

GET /api/onboarding/status
- Descripción: devuelve si el usuario ya completó onboarding y preferencias parciales.
- Headers: Authorization
- Response 200:
```json
{ "onboarded": false, "preferredCampusId": null, "preferredProgramId": null }
```


### Onboarding: guardar preferencias

PATCH /api/onboarding/me
- Descripción: guarda preferencias del usuario (campus, program, preferredCycle, wantsAlerts, weeklyAvailability, preferredStudyTimes, studyHoursPerDay).
- Headers: Authorization
- Body ejemplo:
```json
{
  "preferredCampusId": 3,
  "preferredProgramId": 14,
  "preferredCycle": "2025-2",
  "wantsAlerts": true,
  "weeklyAvailability": 15,
  "studyHoursPerDay": 2
}
```
- Response 200: User/Onboarding DTO actualizado.


### Onboarding: subir cursos actuales (CRÍTICO)

POST /api/onboarding/courses
- Descripción: el frontend envía la lista de cursos que el estudiante está cursando/teniendo en cuenta — el backend crea Enrollment(s) y EnrolledCourse(s) para ese usuario.
- Headers: Authorization
- Body (ejemplo):
```json
{
  "termId": 12,
  "termCode": "2025-2",
  "campusId": 3,
  "programId": 14,
  "courses": [
    {"courseId": 101, "courseCode": "MAT101"},
    {"courseId": 102, "courseCode": "PROG101"}
  ]
}
```
- Notas:
  - El backend ignora `userId` en la petición y usa el email del token. No enviar userId.
  - Si `termId` no existe, devolverá 404 — el frontend debe pedir confirmación del usuario.
  - Response 200: lista de enrollments/enrolledCourses creados o 201.


### Student — perfil

GET /api/student/me
- Descripción: devuelve el perfil del estudiante con campos legibles (campusName, programName, termLabel, créditos, gpa).
- Headers: Authorization
- Response 200: StudentMeDTO (ver sección DTOs).


### Enrollments

GET /api/enrollments/me
- Descripción: devuelve enrollments del usuario (si no se llamo `POST /api/onboarding/courses` pueden estar vacíos).
- Headers: Authorization
- Response 200: [EnrollmentDTO]

POST /api/enrollments (si está expuesto)
- Notas: el backend forzará userId desde token; no confiar en userId del frontend.


### Alerts (notificaciones)

GET /api/student/alerts
- Response 200: [AlertItemDTO]

POST /api/student/alerts
- Body ejemplo:
```json
{
  "title": "Recordatorio: Entrega",
  "message": "Entregar actividad de MAT101",
  "when": "2025-10-30T09:00:00",
  "type": "REMINDER"
}
```
- Response 200/201: AlertItemDTO creado (backend pone userId desde token).

POST /api/student/alerts/{id}/read
- Marca como leída, devuelve 204.


### Calendar (eventos)

GET /api/student/calendar?from=<ISO>&to=<ISO>
- Devuelve eventos entre fechas.

POST /api/student/calendar
- Body ejemplo:
```json
{
  "title":"Examen MAT101",
  "start":"2025-11-10T10:00:00",
  "end":"2025-11-10T12:00:00",
  "location":"Aula 5",
  "notes":"Traer calculadora"
}
```


### Motivations

GET /api/student/motivations
- Lista motivaciones del usuario.

POST /api/student/motivations
- Body ejemplo:
```json
{
  "description":"Estudiar 10 horas esta semana",
  "hoursPlanned": 10
}
```

GET /api/student/motivations/ranking
- Response ejemplo: `{ "score": 12, "count": 3 }`.


### Recomendaciones

GET /api/student/recommendations?limit=5
- Endpoint canónico para recomendaciones. Devuelve `CourseDTO[]` con campos y `reason`.


### Dashboard (consolidado)

GET /api/student/dashboard?recLimit=10
- Propósito: obtener en una sola llamada todo lo necesario para renderizar la pantalla principal.
- Response (estructura):
```json
{
  "me": { /* StudentMeDTO */ },
  "enrollments": [ /* EnrollmentDTO[] */ ],
  "alerts": [ /* AlertItemDTO[] */ ],
  "calendar": [ /* CalendarEventDTO[] */ ],
  "recommendations": [ /* CourseDTO[] (limit recLimit) */ ],
  "ranking": { "score": 12, "count": 3 }
}
```


## Contratos de datos (DTOs) — ejemplos JSON

StudentMeDTO

```json
{
  "id": 123,
  "name": "Juan Pérez",
  "email": "juan.perez@uni.edu",
  "campusId": 3,
  "campusName": "Campus Central",
  "programId": 7,
  "programName": "Ingeniería",
  "termLabel": "2025-2",
  "creditsApproved": 90,
  "creditsRequired": 180,
  "gpa": 3.6
}
```

EnrollmentDTO

```json
{
  "id": 321,
  "termCode":"2025-2",
  "campusName":"Campus Central",
  "programName":"Ingeniería",
  "totalCreditsCompleted": 90,
  "totalCreditsInProgress": 6,
  "gpa": 3.6,
  "courses": [
    {"id":101, "code":"MAT101", "name":"Matemáticas I", "status":"IN_PROGRESS"}
  ]
}
```

AlertItemDTO

```json
{
  "id": 11,
  "title": "Recordatorio",
  "message": "Entrega MAT101",
  "when": "2025-10-30T09:00:00",
  "type": "REMINDER",
  "read": false
}
```

CalendarEventDTO

```json
{
  "id": 21,
  "title":"Examen MAT101",
  "start":"2025-11-10T10:00:00",
  "end":"2025-11-10T12:00:00",
  "location":"Aula 5",
  "notes":"Traer calculadora"
}
```

MotivationDTO

```json
{
  "id": 41,
  "description":"Estudiar 10 horas esta semana",
  "hoursPlanned": 10,
  "createdAt":"2025-10-18T12:00:00"
}
```

CourseDTO (recomendaciones)

```json
{
  "id": 501,
  "code": "ALG201",
  "name": "Algoritmos II",
  "credits": 6,
  "reason": "Siguiente ciclo en tu currícula"
}
```


## Dashboard consolidado — ejemplo completo (mock)

Ejemplo de payload completo que el frontend puede usar para prototipado:

```json
{
  "me": {
    "id": 123,
    "name": "Juan Pérez",
    "email": "juan.perez@uni.edu",
    "campusName": "Campus Central",
    "programName": "Ingeniería",
    "termLabel": "2025-2",
    "creditsApproved": 90,
    "creditsRequired": 180,
    "gpa": 3.6
  },
  "enrollments": [
    {
      "id": 321,
      "termCode":"2025-2",
      "campusName":"Campus Central",
      "programName":"Ingeniería",
      "totalCreditsCompleted": 90,
      "totalCreditsInProgress": 6,
      "gpa": 3.6,
      "courses": [ {"id":101, "code":"MAT101", "name":"Matemáticas I", "status":"IN_PROGRESS"} ]
    }
  ],
  "alerts": [
    {"id":11,"title":"Entrega MAT101","message":"Entregar actividad","when":"2025-10-30T09:00:00","read":false}
  ],
  "calendar": [
    {"id":21,"title":"Examen MAT101","start":"2025-11-10T10:00:00","end":"2025-11-10T12:00:00","location":"Aula 5"}
  ],
  "recommendations": [
    {"id":501,"code":"ALG201","name":"Algoritmos II","credits":6,"reason":"Siguiente ciclo"}
  ],
  "ranking": {"score":12,"count":3}
}
```


## Estrategia UI / patrones de interacción

- Cargar `GET /api/student/dashboard` en la entrada del Dashboard y usar skeletons para cada seccion.
- Si una subsección falla, mostrar fallback (mensaje de error local) y permitir que el resto cargue.
- Acciones CRUD (alerts/calendar/motivations) deben usar optimistic updates con rollback en error.
- Usar paginación o límites en listas largas (alerts, calendar) y lazy-loading para detalles.


## Validaciones y reglas de negocio (frontend)

- Onboarding:
  - Requerir Campus, Program y Cycle.
  - `courses` mínimo 1 si el usuario indica que ya cursa materias.
- Calendar events:
  - `start` y `end` en ISO 8601; `start < end`.
- Alerts:
  - `title` y `message` obligatorios; `when` en futuro para recordatorios.
- Motivations:
  - `hoursPlanned` entero > 0.


## Manejo de errores (mapa de acciones front)

- 200/201: actualizar UI y mostrar toast de éxito opcional.
- 204: actualizar estado local (p. ej. marcar read) y no renderizar cuerpo.
- 400: mostrar mensaje de validación con campos afectados.
- 401: redirigir a login / iniciar refresh token flow (NextAuth). Mostrar modal si la acción de usuario falló por token expirado.
- 403: mostrar mensaje de permisos.
- 404: mostrar mensaje contextual (recurso no encontrado). En onboarding, pedir al usuario que confirme los datos.
- 5xx: mostrar fallback global y reintentar según política (backoff exponencial si es necesario).


## Checklist de QA (paso a paso)

1. Login con MS Entra y enviar `POST /api/auth/entra/callback` (si se implementa).
2. GET `/api/onboarding/status` → si `false`, ejecutar wizard completo.
3. En el wizard: seleccionar Campus/Program/Cycle y enviar `PATCH /api/onboarding/me`.
4. Subir cursos actuales con `POST /api/onboarding/courses` y verificar `GET /api/enrollments/me` incluye esos cursos.
5. GET `/api/student/dashboard` → verificar que las secciones contienen datos coherentes.
6. Crear una alerta (`POST /api/student/alerts`) y marcarla leída (`POST /api/student/alerts/{id}/read`).
7. Crear evento de calendario y comprobar rango en `GET /api/student/calendar`.
8. Crear motivación y verificar `GET /api/student/motivations` y `/ranking`.
9. Probar `/api/student/recommendations?limit=5` y validar `reason` y campos.


## Recomendaciones para integraciones (cliente TypeScript, mocks y tests)

- Generar tipos TS a partir de los DTOs (ej. con `quicktype` o definiciones manuales). Ejemplo de interfaz:

```ts
interface StudentMeDTO {
  id: number;
  name: string;
  email: string;
  campusId?: number;
  campusName?: string;
  programId?: number;
  programName?: string;
  termLabel?: string;
  creditsApproved?: number;
  creditsRequired?: number;
  gpa?: number;
}
```

- Mock server: usar `msw` para interceptar requests y devolver el payload mock de `GET /api/student/dashboard`.
- Tests de integración: cubrir onboarding happy path y fallo de token (401).


## Seguridad, CORS y buenas prácticas

- No almacenar id_token en localStorage sin protección: preferir NextAuth session/cookie.
- Todas las requests sensibles deben usar HTTPS.
- En caso de 401 repetidos, invalidar sesión local y forzar re-login.
- Evitar exponer userId en el frontend; siempre permitir que el backend obtenga el usuario desde el token.


## Notas finales y próximos pasos

- Si necesitás, puedo:
  - Generar las interfaces TypeScript completas para todos los DTOs del spec.
  - Crear un conjunto de mocks `msw` listo para usar con los ejemplos.
  - Añadir esquemas JSON (JSON Schema) para validación en frontend.

Indica cuál de las tareas extras querés que haga y la implemento (por ejemplo: generar `types.ts` y mocks `msw`).
