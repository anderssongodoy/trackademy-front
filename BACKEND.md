# Trackademy Backend (Spring Boot)

Este documento guía la implementación del backend en Spring Boot sobre Postgres, usando el esquema de tablas definido en `sql/schema.sql`. Cubre entidades, endpoints, lógica de negocio, ingestión de JSON, y consideraciones de calidad.

## Stack recomendado

- Spring Boot 3.x
- Spring Data JPA (Hibernate) + Postgres
- Flyway (o Liquibase) para migraciones
- Spring Validation (Hibernate Validator)
- MapStruct (mapeo DTO ↔ Entidad)
- Spring Security (JWT) — opcional
- Scheduler (@Scheduled) para recordatorios — opcional

## Configuración (application.properties)

```properties
# DataSource (valores locales por defecto)
spring.datasource.url=jdbc:postgresql://localhost:5432/trackademy
spring.datasource.username=postgres
spring.datasource.password=postgres

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.open-in-view=false
spring.jpa.properties.hibernate.jdbc.lob.non_contextual_creation=true
spring.jpa.properties.hibernate.format_sql=true

# Server
server.port=8080

# App
app.universidad=Universidad Tecnológica del Perú
app.timezone=America/Lima
app.recordatorios.anticipacionDiasDefault=3
```

Notas:

- Usar `ddl-auto=update` permite crear campos/tablas que falten durante el desarrollo. En producción es recomendable migraciones controladas, pero no es requisito para este proyecto.

## Modelo de datos (resumen)

Las tablas en `sql/schema.sql` cubren:

- Catálogo/base: `universidad`, `campus`, `periodo`, `carrera`, `curso`, `curso_carrera`
- Sílabos: `silabo`, `unidad`, `tema`, `resultado_aprendizaje`, `evaluacion`, `bibliografia`, `competencia`, `curso_competencia`, `nota_politica`
- Usuario/onboarding: `usuario`, `usuario_perfil`, `usuario_curso`, `usuario_evaluacion`
- Post‑onboarding/valor agregado: `regla_recordatorio`, `recordatorio_evento`, `agenda_evento`, `usuario_habito`, `usuario_habito_log`, `usuario_meta`, `usuario_curso_horario`, `usuario_curso_resumen`, `usuario_resumen`, `recomendacion`, `study_task`, `risk_event`

Claves e índices relevantes

- Únicos: `curso(universidad_id,codigo)`, `carrera(universidad_id,nombre)`, `evaluacion(curso_id,codigo)`
- Índices recomendados por FK y filtros (`curso_carrera.carrera_id`, `evaluacion.curso_id`)

## Entidades JPA (sugerencia de particionado)

- Paquetes: `domain.entity`, `domain.repo`, `service`, `web` (controllers), `dto`, `mapper`
- Entidades principales: `Universidad`, `Campus`, `Periodo`, `Carrera`, `Curso`, `CursoCarrera`, `Silabo`, `Unidad`, `Tema`, `ResultadoAprendizaje`, `Evaluacion`, `Bibliografia`, `Competencia`, `CursoCompetencia`, `NotaPolitica`, `Usuario`, `UsuarioPerfil`, `UsuarioCurso`, `UsuarioEvaluacion`, y las de valor agregado.
- Relaciones:
  - `Curso` n..m `Carrera` vía `CursoCarrera`
  - `Curso` 1..n `Unidad` y `Evaluacion`
  - `Unidad` 1..n `Tema`
  - `Curso` n..m `Competencia` vía `CursoCompetencia`
  - `Usuario` 1..n `UsuarioCurso`; `UsuarioCurso` 1..n `UsuarioEvaluacion`

## DTOs/Mappers

- DTOs para lectura ligera (catálogos, curso) y detalle (curso con silabo/unidades/evaluaciones/bibliografía/competencias/políticas).
- DTOs de onboarding: `OnboardingRequest { campusId, periodoId, carreraId, cursoIds[] }`.
- Usar MapStruct para evitar boilerplate.

## Endpoints (sugeridos)

Catálogos

- `GET /api/catalog/carreras` → lista de carreras
- `GET /api/catalog/cursos?carreraId=...` → cursos por carrera
- `GET /api/catalog/curso/{id}` → detalle del curso con silabo, unidades, evaluaciones, bibliografía, competencias, políticas

Onboarding

- `POST /api/onboarding` → crea/actualiza `usuario_perfil`, `usuario_curso` y clona `usuario_evaluacion`
  - Body: `OnboardingRequest`
  - Respuesta: resumen de cursos con evaluaciones (porcentaje y semana)

Usuario (post‑onboarding)

- `GET /api/me/cursos` → cursos activos del usuario con `usuario_curso_resumen`
- `GET /api/me/evaluaciones` → próximas evaluaciones (por semana o `fecha_estimada` si existe)
- `POST /api/me/evaluaciones/{id}/nota` → registrar nota
- `POST /api/me/preferencias/recordatorios` → crear/actualizar `regla_recordatorio`
- `POST /api/me/horario` → definir/actualizar `usuario_curso_horario`
- `POST /api/me/habitos` → crear hábito; `POST /api/me/habitos/{id}/log` → marcar cumplimiento
- `GET /api/me/recomendaciones` → lista de recomendaciones activas

Admin (ingesta)

- `POST /api/admin/ingesta/json` → subir JSON de sílabo (opcional si no usas el script Python);
  - Idempotente: ON CONFLICT por claves únicas.

## Lógica de negocio

1) Clonado de evaluaciones en onboarding

- Por cada `cursoId`, insertar `UsuarioCurso` si no existe
- Clonar `Evaluacion` → `UsuarioEvaluacion (semana, porcentaje)` con `nota=null`
- Si `periodo.fecha_inicio` existe, calcular `fecha_estimada = lunes_de_semana(N)` (usar zona `America/Lima`)

2) Proyección de nota

- `promedio_parcial = Σ(nota_i * %)/100` considerando solo evaluaciones con nota
- `nota_necesaria` en pendientes para llegar a 12: resolver linealmente con los pesos pendientes
- Guardar en `usuario_curso_resumen`

3) Recordatorios

- Usar `regla_recordatorio.anticipacion_dias` (default configurable) para programar `recordatorio_evento`
- Scheduler diario: generar recordatorios para evaluaciones con `fecha_estimada` dentro del rango

4) Horario por hora académica (45 min)

- `bloques = curso.horas_semanales`
- `usuario_curso_horario`: el usuario define día/hora; agrupar bloques es permitir `duracion_min` = 90/135/180
- Validar solapes por usuario con una consulta simple por intersección de time ranges

5) Detección de riesgo y recomendaciones

- Riesgo si `promedio_parcial < 11` o faltan notas de evaluaciones vencidas; crear `risk_event`
- Generar `recomendacion`/`study_task` (ej.: “construir esquema TA2 antes del viernes”) con `fecha_sugerida`

## Ingesta de JSON (pipeline)

- El servicio puede aceptar JSON con el formato del extractor y persistir con ON CONFLICT
- Normalizar nombre de universidad desde configuración `app.universidad` para evitar duplicados (“UTP” vs nombre completo)
- Validar: suma de porcentajes ≈ 100 (±1), semanas dentro de rango, unicidad de `evaluacion.codigo`

## Calidad y validación

- Bean Validation en DTOs de entrada
- Excepciones controladas: 400 (validación), 404 (no encontrado), 409 (conflicto de claves)
- Paginación en listados (catálogos, cursos)

## Seguridad (opcional)

- Spring Security + JWT si la app requiere sesión/roles; sino, un API key simple para `/api/admin/ingesta`.

## Test/Dev

- Perfiles: `dev` (H2 opcional), `local` (Postgres), `prod`
- Flyway para reproducibilidad
- Tests de servicios para: clonación de evaluaciones, cálculo de proyección, generación de recordatorios

## Ejemplo de flujo Onboarding

1. Frontend llama `GET /api/catalog/carreras` y `GET /api/catalog/cursos?carreraId=...`
2. El usuario elige cursos; `POST /api/onboarding` con `{ campusId, periodoId, carreraId, cursoIds[] }`
3. Backend crea `usuario_perfil`, `usuario_curso`, clona `usuario_evaluacion`, calcula `fecha_estimada` si corresponde, y devuelve el resumen para UI
4. Más tarde el usuario agrega notas; backend recalcula `usuario_curso_resumen` y genera `recomendacion`/`recordatorio_evento`

## Notas de despliegue

- Asegurar `ZoneId.of("America/Lima")` para cálculos de fechas/horas
- Ajustar tamaños de campo si fuera necesario (text vs varchar) según el proveedor

---

Cualquier ajuste de endpoints/entidades puede iterarse en conjunto con la estructura del JSON del extractor y el esquema SQL ya proporcionado.

---

## Esquema completo (tablas, campos y relaciones)

A continuación se listan todas las tablas incluidas en `sql/schema.sql` con sus campos, claves y relaciones para que puedas definir modelos/DTOs con precisión.

- universidad

  - id (PK, serial)
  - nombre (text, unique)
- campus

  - id (PK)
  - universidad_id (FK → universidad.id, on delete cascade)
  - nombre (text)
  - timezone (text, default 'America/Lima')
  - unique(universidad_id, nombre)
- periodo

  - id (PK)
  - universidad_id (FK → universidad.id, on delete cascade)
  - etiqueta (text)
  - fecha_inicio (date, null)
  - fecha_fin (date, null)
  - unique(universidad_id, etiqueta)
- carrera

  - id (PK)
  - universidad_id (FK → universidad.id, on delete cascade)
  - nombre (text)
  - unique(universidad_id, nombre)
- curso

  - id (PK)
  - universidad_id (FK → universidad.id, on delete cascade)
  - codigo (text)
  - nombre (text)
  - anio (int, null)
  - periodo_texto (text, null)
  - modalidad (text, null)
  - creditos (int, null)
  - horas_semanales (int, null)
  - course_key (text, no unique global por si cambia por universidad)
  - unique(universidad_id, codigo)
- curso_carrera

  - curso_id (FK → curso.id, on delete cascade)
  - carrera_id (FK → carrera.id, on delete cascade)
  - PK(curso_id, carrera_id)
- silabo

  - id (PK)
  - curso_id (FK → curso.id, on delete cascade)
  - version (text, null)
  - vigente (boolean, default true)
  - fuente_pdf (text, null)
  - hash_pdf (text, null)
  - sumilla (text, null)
  - fundamentacion (text, null)
  - metodologia (text, null)
  - logro_general (text, null)
- unidad

  - id (PK)
  - curso_id (FK → curso.id, on delete cascade)
  - nro (int)
  - titulo (text, null)
  - semana_inicio (int, null)
  - semana_fin (int, null)
  - logro_especifico (text, null)
  - unique(curso_id, nro)
- tema

  - id (PK)
  - unidad_id (FK → unidad.id, on delete cascade)
  - orden (int)
  - titulo (text)
  - unique(unidad_id, orden)
- resultado_aprendizaje

  - id (PK)
  - curso_id (FK → curso.id, on delete cascade)
  - unidad_id (FK → unidad.id, on delete set null)
  - tipo (text) — valores esperados: 'general' | 'especifico'
  - texto (text)
- evaluacion

  - id (PK)
  - curso_id (FK → curso.id, on delete cascade)
  - codigo (text) — TA1, PC1, EXFN, etc.
  - tipo (text, null) — TA | PC | EXFN | PA | PROY | OTRO
  - descripcion (text, null)
  - porcentaje (numeric(6,2), null)
  - semana (int, null)
  - observacion (text, null)
  - modalidad (text, null)
  - individual_grupal (text, null) — Individual | Grupal | Mixto
  - producto (text, null) — Oral | Escrito | Proyecto | Participación | Otro
  - flexible (boolean, default false)
  - unidad_nro (int, null)
  - atributos_json (jsonb, null)
  - unique(curso_id, codigo)
- bibliografia

  - id (PK)
  - curso_id (FK → curso.id, on delete cascade)
  - tipo (text, null) — base | complementaria
  - autores (text, null)
  - titulo (text, null)
  - editorial (text, null)
  - anio (int, null)
  - url (text, null)
- competencia

  - id (PK)
  - universidad_id (FK → universidad.id, on delete cascade)
  - tipo (text) — general | especifica
  - nombre (text)
  - unique(universidad_id, tipo, nombre)
- curso_competencia

  - curso_id (FK → curso.id, on delete cascade)
  - competencia_id (FK → competencia.id, on delete cascade)
  - PK(curso_id, competencia_id)
- nota_politica

  - id (PK)
  - curso_id (FK → curso.id, on delete cascade)
  - seccion (text) — 'indicaciones_formula' u otros
  - texto (text)
- usuario

  - id (PK)
  - email (text, unique)
  - nombre (text, null)
  - created_at (timestamptz, default now())
- usuario_perfil

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - campus_id (FK → campus.id, on delete restrict)
  - periodo_id (FK → periodo.id, on delete restrict)
  - carrera_id (FK → carrera.id, on delete restrict)
  - ciclo_actual (text, null)
- usuario_curso

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - curso_id (FK → curso.id, on delete cascade)
  - activo (boolean, default true)
  - unique(usuario_id, curso_id)
- usuario_evaluacion

  - id (PK)
  - usuario_curso_id (FK → usuario_curso.id, on delete cascade)
  - evaluacion_id (FK → evaluacion.id, on delete cascade)
  - semana (int, null)
  - fecha_estimada (date, null)
  - fecha_real (date, null)
  - nota (numeric(5,2), null)
  - exonerado (boolean, default false)
  - es_rezagado (boolean, default false)
  - reemplaza_a_id (FK → usuario_evaluacion.id, on delete set null)
  - comentarios (text, null)
  - unique(usuario_curso_id, evaluacion_id)
- regla_recordatorio

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - tipo (text) — evaluacion | habito | agenda
  - anticipacion_dias (int, default 3)
  - canal (text, default 'app') — app | email | sms
  - unique(usuario_id, tipo)
- recordatorio_evento

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - usuario_evaluacion_id (FK → usuario_evaluacion.id, on delete cascade, null)
  - agenda_evento_id (int, null)
  - fecha_envio (timestamptz)
  - canal (text, default 'app')
  - estado (text, default 'pendiente') — pendiente | enviado | cancelado
  - payload_json (jsonb, null)
- usuario_habito

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - titulo (text)
  - descripcion (text, null)
  - frecuencia (text) — diaria | semanal | personalizada
  - recordatorio_hora (time, null)
  - activo (boolean, default true)
- usuario_habito_log

  - id (PK)
  - habito_id (FK → usuario_habito.id, on delete cascade)
  - fecha (date)
  - cumplido (boolean)
  - nota (text, null)
  - unique(habito_id, fecha)
- agenda_evento

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - titulo (text)
  - descripcion (text, null)
  - inicio (timestamptz)
  - fin (timestamptz)
  - fuente (text) — evaluacion | manual | habito | sistema
  - ref_id (int, null)
  - estado (text, default 'activo')
- usuario_meta

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - titulo (text)
  - descripcion (text, null)
  - tipo (text) — rendimiento | habitos | asistencia | proyecto
  - curso_id (FK → curso.id, on delete set null)
  - fecha_objetivo (date, null)
  - estado (text, default 'activa')
- usuario_curso_horario

  - id (PK)
  - usuario_curso_id (FK → usuario_curso.id, on delete cascade)
  - bloque_nro (int)
  - dia_semana (smallint, null) — 1=Lunes..7=Domingo
  - hora_inicio (time, null)
  - duracion_min (smallint, default 45)
  - tipo_sesion (text, null) — Clase | Estudio | Laboratorio | Virtual_en_vivo | Virtual_24_7
  - ubicacion (text, null)
  - url_virtual (text, null)
  - unique(usuario_curso_id, bloque_nro)
- usuario_curso_resumen

  - id (PK)
  - usuario_curso_id (FK → usuario_curso.id, on delete cascade)
  - progreso_porcentaje (numeric(6,2), null)
  - promedio_parcial (numeric(6,2), null)
  - nota_final (numeric(6,2), null)
  - creditos (int, null)
  - riesgo_aplazo_score (numeric(6,2), null)
  - siguiente_hito_semana (int, null)
  - siguiente_hito_fecha (date, null)
  - unique(usuario_curso_id)
- usuario_resumen

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - cursos_activos (int, null)
  - creditos_totales (int, null)
  - promedio_ponderado (numeric(6,2), null)
  - habitos_cumplidos_7d (int, null)
  - riesgo_global_score (numeric(6,2), null)
  - proximo_recordatorio_fecha (timestamptz, null)
  - unique(usuario_id)
- recomendacion

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - tipo (text) — estudio | organizacion | riesgo | bienestar
  - prioridad (smallint, default 2) — 1 alta, 2 media, 3 baja
  - mensaje (text)
  - data_json (jsonb, null)
  - creada_en (timestamptz, default now())
  - leida_en (timestamptz, null)
- study_task

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - curso_id (FK → curso.id, on delete set null)
  - titulo (text)
  - descripcion (text, null)
  - semana (int, null)
  - fecha_sugerida (date, null)
  - estado (text, default 'pendiente')
- risk_event

  - id (PK)
  - usuario_id (FK → usuario.id, on delete cascade)
  - curso_id (FK → curso.id, on delete set null)
  - tipo (text) — bajo_promedio | falta_nota | proximidad_evaluacion | inactividad
  - severidad (smallint, default 1)
  - semana (int, null)
  - generado_en (timestamptz, default now())
  - data_json (jsonb, null)
