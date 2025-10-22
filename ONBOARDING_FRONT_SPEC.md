# Onboarding – Especificación para Front

Objetivo: completar el perfil y cursos actuales en 3–5 minutos para habilitar dashboards, alertas y recompensas. Todas las llamadas deben incluir `Authorization: Bearer <id_token>`.

## Flujo por pasos

1) Cuenta y permisos
- allowDataSharing: boolean
- wantsAlerts: boolean
- wantsIncentives: boolean

2) Campus y programa
- campus: seleccionar desde GET /api/campuses
- program: seleccionar desde GET /api/programs (filtrar por campus si aplica)
- cycle: seleccionar desde GET /api/cycles
- specialization: texto corto (opcional)

3) Intereses y estilo
- careerInterests: lista de strings (ej: "IA", "Web", "Data", "Cloud")
- learningStyle: uno ("reading", "video", "practice", "collaborative", "auditory")
- motivationFactors: lista ("goals", "career", "grades", "deadlines", "rewards")

4) Tiempo y disponibilidad
- studyHoursPerDay: number (0–12)
- preferredStudyTimes: lista ("morning", "afternoon", "evening", "weekend")
- workHoursPerWeek: number (0–80)
- extracurricularHoursPerWeek: number (0–80)
- weeklyAvailabilityJson: JSON por días para el planificador (formato abajo)

5) Cursos actuales
- termId o termCode del ciclo en curso
- courses: lista de objetos { courseId | courseCode }
- campusId y programId opcionales; si no llegan, se usan los preferidos del usuario
- Enviar con POST /api/onboarding/courses

6) Confirmación
- Mostrar resumen y enviar POST /api/onboarding/submit
- Al éxito: redirigir al dashboard inicial

## Endpoints

- GET /api/campuses → CampusDTO[]
- GET /api/programs → ProgramDTO[]
- GET /api/cycles → CycleDto[]
- GET /api/onboarding/me → datos guardados
- PATCH /api/onboarding/me → guardado parcial por paso
- POST /api/onboarding/submit → finaliza onboarding
- POST /api/onboarding/courses → registra cursos actuales para el término activo

## Payload Onboarding (POST /api/onboarding/submit)
```json
{
  "campus": "Lima Centro",
  "cycle": 2,
  "program": "cs",
  "specialization": "IA",
  "careerInterests": ["IA", "Cloud"],
  "studyHoursPerDay": 3,
  "learningStyle": "practice",
  "motivationFactors": ["goals", "rewards"],
  "wantsAlerts": true,
  "wantsIncentives": true,
  "allowDataSharing": true,
  "preferredStudyTimes": ["evening", "weekend"],
  "workHoursPerWeek": 20,
  "extracurricularHoursPerWeek": 5,
  "weeklyAvailabilityJson": "{\"mon\":[\"19:00-21:00\"],\"wed\":[\"19:00-22:00\"],\"sat\":[\"09:00-12:00\"]}"
}
```

Respuesta
```json
{ "success": true, "message": "Onboarding completado exitosamente", "userId": 123, "campus": "Lima Centro", "cycle": 2 }
```

## Payload Cursos actuales (POST /api/onboarding/courses)
```json
{
  "termId": 12,
  "courses": [
    { "courseId": 101 },
    { "courseCode": "INF-101" }
  ]
}
```

## Formato weeklyAvailabilityJson
```json
{
  "mon": ["07:00-08:00", "19:00-21:00"],
  "tue": ["19:00-21:00"],
  "wed": ["19:00-22:00"],
  "thu": [],
  "fri": ["18:00-20:00"],
  "sat": ["09:00-12:00"],
  "sun": []
}
```

## Criterio de finalización
- POST /api/onboarding/submit devuelve success=true y POST /api/onboarding/courses responde 200
- user.onboarded=true en backend y preferencias guardadas
- Redirección al dashboard
