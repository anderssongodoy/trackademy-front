# Onboarding Dashboard — Implementación disponible (resumen para front-end)

Este documento explica qué partes del `ONBOARDING_DASHBOARD_PLAN.md` podemos implementar ahora sin cambiar los modelos (solo usando lo que ya hay en la base), qué se descarta por ahora, y los endpoints que ya están disponibles o que he creado para el frontend.

Resumen rápido
- Podemos ofrecer de inmediato:
  - GET /api/student/me — información básica del estudiante (nombre, email, campusId, programId, término preferido)
  - GET /api/student/alerts — devuelve lista (por ahora vacía) de alertas; permite al front mostrar CTA para conectar datos si está vacía
  - GET /api/student/calendar?start=ISO&end=ISO — devuelve lista (por ahora vacía) de eventos; útil para mostrar estado "sin datos" o CTA
  - GET /api/student/recommendations?limit=10 — devuelve recomendaciones (por ahora vacías)

Qué NO implementamos ahora (descartado por el momento)
- Historial académico completo (GET /api/student/progress) — requiere enlazar con sistemas académicos y cambios en modelos o nuevos repositorios.
- Ranking social con datos agregados (GET /api/student/social/ranking) — requiere agregaciones y datasets adicionales.
- Stream en tiempo real (SSE/WS) — puede añadirse más adelante.

Principios y supuestos
- No se cambió ningún modelo de base de datos ni entidades existentes.
- Los endpoints usan la identidad del usuario extraída del `id_token` (claims `email` o `preferred_username`).
- Si no hay datos (por ejemplo alerts o calendar), los endpoints devuelven un array vacío; el frontend debe mostrar CTA apropiado.

API contratadas (para pasar al front)

1) GET /api/student/me
- Headers: Authorization: Bearer <id_token>
- Response 200 example:
```
{
  "id": 123,
  "name": "María Pérez",
  "email": "maria@uni.edu",
  "campusId": 3,
  "programId": 5,
  "currentTerm": { "code": "202501" },
  "creditsRequired": null,
  "creditsApproved": null,
  "gpa": null
}
```

2) GET /api/student/alerts
- Headers: Authorization
- Response 200: array de `AlertItemDTO`. Si no hay alertas devuelve `[]`.

3) GET /api/student/calendar?start=ISO&end=ISO
- Headers: Authorization
- Query params opcionales: start, end (ISO)
- Response 200: array de `CalendarEventDTO`. Si no hay eventos devuelve `[]`.

4) GET /api/student/recommendations?limit=10
- Headers: Authorization
- Response 200: array de `RecommendationDTO`. Si no hay recomendaciones devuelve `[]`.

Guía de comportamiento para el front al recibir arrays vacíos
- Mostrar mensaje amigable y CTA: "No tenemos tu historial académico — conectar ahora" o "No tenemos tu calendario — agregar horario".
- No mostrar errores 500; si el backend devuelve 401, forzar re-login.

Próximos pasos sugeridos (backend)
- Implementar `GET /api/student/progress` y `social/ranking` cuando dispongamos de feeds académicos externos.
- Rellenar recomendaciones básicas a partir del `programId` (p. ej. recomendar cursos base del plan).

Contacto
- Si el equipo front necesita cambios en shapes o campos adicionales, enviad los ejemplos concretos y lo añadimos.

---

Detalles de implementación (qué ficheros / clases se añadieron o modificaron)

Los siguientes controladores/servicios/DTOs ya están en el repositorio y respaldan los endpoints descritos arriba:

- Controladores:
  - `src/main/java/com/trackademy/controller/StudentController.java` — expone:
    - GET `/api/student/me`
    - GET `/api/student/alerts`
    - GET `/api/student/calendar`
    - GET `/api/student/recommendations`

  - `src/main/java/com/trackademy/controller/OnboardingController.java` — expone:
    - POST `/api/onboarding/submit`
    - GET `/api/onboarding/me`
    - PATCH `/api/onboarding/me`
    - GET `/api/onboarding/status`

  - `src/main/java/com/trackademy/controller/OnboardingEnrollmentController.java` — expone:
    - POST `/api/onboarding/courses` (recibe `termId` o `termCode`, `campusId`/program y lista de cursos)

- Servicios y lógica:
  - `src/main/java/com/trackademy/service/StudentService.java` (interfaz)
  - `src/main/java/com/trackademy/service/impl/StudentServiceImpl.java` (implementación básica)
  - `src/main/java/com/trackademy/service/OnboardingService.java` (gestiona guardado/estado de onboarding)

- DTOs (formas JSON usadas por el frontend):
  - `src/main/java/com/trackademy/dto/StudentMeDTO.java`
  - `src/main/java/com/trackademy/dto/AlertItemDTO.java`
  - `src/main/java/com/trackademy/dto/CalendarEventDTO.java`
  - `src/main/java/com/trackademy/dto/RecommendationDTO.java`
  - `src/main/java/com/trackademy/dto/CurrentCoursesRequest.java` (payload para `/api/onboarding/courses`)

Notas de diseño y restricciones
- No se modificaron modelos (`entity`) ni la estructura de la base de datos. Todas las respuestas se construyen a partir de `User`, `Enrollment`, `EnrolledCourse`, `Course`, `Term` y repositorios existentes.
- Implementación mínima: los endpoints devuelven resultados reales cuando hay datos; cuando no hay datos devuelven arrays vacíos o campos `null`. El frontend debe mostrar CTA/estado vacío cuando corresponda.

Instrucciones rápidas para el frontend (lista corta que podéis pegar)

1) Tras el login usar el id_token y llamar:
   - GET `/api/onboarding/status` — si devuelve `{"onboarded": true}` saltarse onboarding.
   - Si no está onboarded: proceder a completar onboarding y luego `PATCH /api/onboarding/me`.
   - Tras completar onboarding: llamar `GET /api/student/me` para poblar el dashboard.

2) Si queréis comprobar un término antes de enviar cursos:
   - Si tenéis `termId` usar GET `/api/terms/{id}`
   - Si tenéis `termCode` usar GET `/api/terms/by-code/{code}`

3) Para marcar una alerta como leída:
   - POST `/api/student/actions` con body `{ "action": "MARK_ALERT_READ", "payload": { "alertId": "onb-1" } }`

Si confirmas, ejecuto ahora el build y te confirmo si compila correctamente.
