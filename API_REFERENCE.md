# Trackademy API Reference

Base: `${BACKEND_URL}/api`
Auth: `Authorization: Bearer <access_token Microsoft Entra ID>`
Zona horaria: America/Lima

Ejemplo curl: `curl -H "Authorization: Bearer $TOKEN" $BACKEND_URL/api/me`

## Tipos comunes (resúmenes)

- CarreraDto: `{ id: number, nombre: string }`
- CursoDto: `{ id: number, codigo: string, nombre: string }`
- TemaDto: `{ id: number, titulo: string }`
- UnidadDto: `{ id: number, numero: number, titulo: string, temas: TemaDto[] }`
- EvaluacionDto: `{ id: number, codigo: string|null, descripcion: string|null, semana: number|null, porcentaje: number }`
- ResultadoAprendizajeDto: `{ id: number, texto: string, tipo?: string|null, unidadId?: number|null }`
- NotaPoliticaDto: `{ seccion?: string|null, texto?: string|null }`
- CursoDetailDto: `{ id, codigo, nombre, horasSemanales?, silaboDescripcion?, resultadosAprendizaje[], unidades[], evaluaciones[], bibliografia[], competencias[], politicas[] }`
- UsuarioEvaluacionDto: `{ id, codigo, descripcion, semana, porcentaje, fechaEstimada?, nota? }` (nota es string o null)
- UsuarioCursoResumenDto: `{ cursoId, cursoNombre, evaluaciones: UsuarioEvaluacionDto[] }`
- OnboardingRequest: `{ campusId: number, periodoId: number, carreraId: number, cursoIds: number[] }`

---

## Salud

GET `/health`
- Auth: no
- 200 Response: `{ "status": "ok" }`

---

## Usuario

GET `/me`
- Auth: sí
- 200 Ejemplo:
```
{
  "sub": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "issuer": "https://login.microsoftonline.com/<tenant>/v2.0",
  "aud": ["<clientId>"],
  "claims": { "name": "John Doe", "preferred_username": "john@org.com" }
}
```

GET `/me/cursos`
- Auth: sí
- 200 Ejemplo:
```
[
  {
    "cursoId": 123,
    "cursoNombre": "Cálculo I",
    "evaluaciones": [
      {"id": 1, "codigo": "PC1", "descripcion": null, "semana": 4, "porcentaje": 15.0, "fechaEstimada": "2025-04-01", "nota": null}
    ]
  }
]
```

GET `/me/evaluaciones`
- Auth: sí
- Devuelve próximas 3 semanas
- 200 Ejemplo:
```
[
  {"id": 10, "codigo": "EP", "descripcion": "Examen Parcial", "semana": 8, "porcentaje": 30.0, "fechaEstimada": "2025-05-06", "nota": null}
]
```

POST `/me/evaluaciones/{id}/nota`
- Auth: sí
- Body: `{ "nota": "15" }`
- 204 sin contenido

POST `/me/preferencias/recordatorios`
- Auth: sí
- Body: `{ "anticipacionDias": 3 }`
- 204

POST `/me/horario`
- Auth: sí
- Body:
```
[
  {"usuarioCursoId": 55, "diaSemana": 2, "horaInicio": "08:00", "duracionMin": 90},
  {"usuarioCursoId": 55, "diaSemana": 4, "horaInicio": "10:30", "duracionMin": 45}
]
```
- 204

POST `/me/habitos`
- Auth: sí
- Body: `{ "titulo": "Leer 30min", "frecuencia": "diaria" }`
- 200 Response: `123` (id)

POST `/me/habitos/{id}/log`
- Auth: sí
- Body: `{ "fecha": "2025-04-10" }` (opcional)
- 204

GET `/me/recomendaciones`
- Auth: sí
- 200 Response: `[ "Repasar álgebra antes del viernes" ]`

---

## Catálogo

GET `/catalog/carreras?universidadId={id}`
- Auth: sí
- 200 Ejemplo: `[ {"id": 1, "nombre": "Ingeniería de Sistemas"} ]`

GET `/catalog/cursos?carreraId={id}`
- Auth: sí
- 200 Ejemplo: `[ {"id": 100, "codigo": "MAT101", "nombre": "Matemática I"} ]`

GET `/catalog/curso/{id}`
- Auth: sí
- 200 Ejemplo (parcial):
```
{
  "id": 100,
  "codigo": "MAT101",
  "nombre": "Matemática I",
  "horasSemanales": 4,
  "silaboDescripcion": "Introducción al cálculo...",
  "resultadosAprendizaje": [ {"id":1, "texto": "Desarrolla...", "tipo": "general", "unidadId": null} ],
  "unidades": [
    {"id": 1, "numero": 1, "titulo": "Límites", "temas": [ {"id": 11, "titulo": "Definición de límite"} ]}
  ],
  "evaluaciones": [ {"id": 9, "codigo": "PC1", "descripcion": null, "semana": 4, "porcentaje": 15.0} ],
  "bibliografia": ["Stewart, Cálculo"],
  "competencias": ["Pensamiento crítico"],
  "politicas": [ {"seccion": "Cálculo de nota", "texto": "Se promedian..."} ]
}
```

---

## Onboarding

POST `/onboarding`
- Auth: sí
- Body: `{ "campusId": 1, "periodoId": 2, "carreraId": 3, "cursoIds": [100,101] }`
- 200 Response: `UsuarioCursoResumenDto[]` (igual estructura que `/me/cursos`)

---

## Admin (opcional)

POST `/admin/ingesta/json`
- Auth: sí (restringir en despliegue)
- Body: JSON del extractor (sílabo/cursos)
- 202 Response: `{ "status": "accepted" }`

---

## Errores estándar

- 401 Unauthorized: token ausente/ inválido (issuer/audience)
- 403 Forbidden: intento de acceder a recursos de otro usuario
- 404 Not Found: id inexistente
- 409 Conflict: violación de clave única (ingesta/admin)
- 400 Bad Request: validación de body/params

Notas:
- CORS: backend permite orígenes configurados en `trackademy.cors.allowed-origins`.
- OPTIONS preflight es manejado automáticamente por el backend.
