# Trackademy Frontend (Next.js)

Guía para implementar el frontend en Next.js consumiendo las APIs del backend descritas en `BACKEND.md` y aprovechando los datos extraídos por el pipeline (ver `README.md`). El diseño garantiza coherencia con el modelo de datos, el flujo de onboarding y las funcionalidades de valor agregado para el estudiante.

## Stack recomendado

- Next.js 14 (App Router) + TypeScript
- UI: Tailwind CSS o MUI (a elección)
- Estado de datos: React Query (TanStack) o SWR
- Validación: Zod (DTOs de entrada)
- Fecha/hora: date-fns + tz (America/Lima)
- Charts (opcional): Recharts / Chart.js

## Variables de entorno (.env.local)

- `NEXT_PUBLIC_API_BASE_URL`=http://localhost:8080/api
- `NEXT_PUBLIC_TIMEZONE`=America/Lima
- `NEXT_PUBLIC_UNIVERSIDAD`=Universidad Tecnológica del Perú

## Arquitectura (App Router)

- app/
  - layout.tsx, page.tsx (landing)
  - onboarding/
    - layout.tsx
    - page.tsx (wizard dispatcher)
    - steps/
      - campus.tsx
      - periodo.tsx
      - carrera.tsx
      - cursos.tsx
      - preferencias.tsx (opcional)
      - resumen.tsx
  - dashboard/
    - page.tsx (resumen global)
    - cursos/
      - page.tsx (lista cursos activos)
      - [id]/
        - page.tsx (detalle del curso)
        - evaluaciones.tsx (gestión de notas)
        - horario.tsx (bloques de 45 min)
  - settings/
    - recordatorios.tsx

- lib/
  - api.ts (cliente fetch/axios con baseURL)
  - hooks/ useCarreras, useCursosPorCarrera, useCursoDetalle, useOnboarding, useEvaluaciones, useResumen …
  - types/ (DTOs TypeScript que reflejan respuestas del backend)
  - utils/ fechas (semana -> fecha estimada), número -> porcentaje, etc.

## Flujo de Onboarding (UI)

- Paso 1: Campus (obligatorio)
  - GET /catalog/carreras no es necesario aquí; usar listado de campus del backend (o semilla).
- Paso 2: Periodo (obligatorio)
  - Con `fecha_inicio` visible si existe. Mostrar nota si no existe y que se trabajará por "Semana N".
- Paso 3: Carrera (obligatorio)
  - GET /catalog/carreras
- Paso 4: Cursos (obligatorio)
  - GET /catalog/cursos?carreraId={carreraId}
  - Mostrar tarjeta con `codigo`, `nombre`, `creditos`, `horas_semanales`, `modalidad` y una vista previa: `sumilla` y `evaluaciones` (porcentaje + semana).
- Paso 5: Preferencias (opcional)
  - Anticipación de recordatorios (3, 5, 7 días). Se envía después como POST a /me/preferencias/recordatorios.
- Resumen
  - POST /onboarding con `{ campusId, periodoId, carreraId, cursoIds[] }`.
  - Mostrar confirmación + siguiente acción: "Ir al dashboard".

Estados y validación
- Botón "Omitir preferencia" y "Reportar datos faltantes" por si catálogos vengan incompletos.
- Deshabilitar paso siguiente hasta que se seleccione opción válida.
- Mostrar totales: cantidad de evaluaciones y suma de porcentajes (validación rápida en UI).

## Dashboard y Vistas

- Dashboard global `/dashboard`
  - KPIs: cursos activos, promedio ponderado (si hay notas), próximos hitos (por semana o fecha estimada), hábitos completados 7d.
  - Lista de recomendaciones (si existen).

- Cursos activos `/dashboard/cursos`
  - Tarjetas: `nombre`, `codigo`, `creditos`, `horas_semanales`, `promedio_parcial`, `próxima evaluación` (semana o fecha estimada), riesgo (si aplica).

- Detalle de curso `/dashboard/cursos/[id]`
  - Secciones:
    - Descripción: `sumilla`, `metodologia`, `logro_general`
    - Unidades: acordeones con `titulo`, `semanas`, `logro_especifico`, `temario`
    - Evaluaciones: tabla con `%`, `semana`, `tipo/codigo`, `observación`
    - Bibliografía
    - Políticas (texto completo de "Indicaciones sobre Fórmulas de Evaluación")
  - Acciones:
    - Agregar / Editar notas -> `/dashboard/cursos/[id]/evaluaciones`
    - Editar horario -> `/dashboard/cursos/[id]/horario`

- Gestión de notas `/dashboard/cursos/[id]/evaluaciones`
  - Renderizar evaluaciones y permitir ingresar `nota` (0-20), marcar `exonerado` o `rezagado` si aplica.
  - Calcular y mostrar "promedio parcial" y "nota necesaria para llegar a 12".
  - PATCH /me/evaluaciones/{id}/nota

- Horario de estudio `/dashboard/cursos/[id]/horario`
  - Mostrar `bloques = horas_semanales` (45 min por bloque).
  - Permitir agrupar bloques (90/135/180) y arrastrar a día/hora de la semana.
  - Guardar en `usuario_curso_horario` vía `POST /me/horario`.
  - Validar solapes: mostrar alerta si se pisan con otro curso.

- Preferencias `/settings/recordatorios`
  - Form simple: anticipación (3-7 días), canal (por ahora app).
  - POST /me/preferencias/recordatorios

## DTOs de Frontend (TypeScript — ejemplo)

```ts
// Catálogos
export type Carrera = { id: number; nombre: string };
export type CursoCatalogo = {
  id: number; codigo: string; nombre: string; creditos: number | null;
  horas_semanales: number | null; modalidad?: string | null;
};

// Detalle de curso
export type CursoDetalle = {
  id: number; codigo: string; nombre: string; anio?: number | null; periodo_texto?: string | null;
  modalidad?: string | null; creditos?: number | null; horas_semanales?: number | null;
  silabo: { sumilla?: string; fundamentacion?: string; metodologia?: string; logro_general?: string };
  unidades: { nro: number; titulo?: string | null; semana_inicio?: number | null; semana_fin?: number | null; logro_especifico?: string | null; temario: string[] }[];
  evaluaciones: { id: number; codigo: string; tipo?: string | null; porcentaje?: number | null; semana?: number | null; observacion?: string | null }[];
  bibliografia: { tipo?: string | null; autores?: string | null; titulo?: string | null; editorial?: string | null; anio?: number | null; url?: string | null }[];
  competencias: { generales: string[]; especificas: string[] };
  politicas: { seccion: string; texto: string }[];
};

// Onboarding
export type OnboardingRequest = {
  campusId: number; periodoId: number; carreraId: number; cursoIds: number[];
};

// Evaluaciones del alumno
export type UsuarioEvaluacion = {
  id: number; cursoId: number; evaluacionId: number;
  semana?: number | null; fecha_estimada?: string | null; nota?: number | null;
};
```

## Hooks/API client (sugerido)

- `useCarreras` -> GET /catalog/carreras
- `useCursosPorCarrera(carreraId)` -> GET /catalog/cursos?carreraId={carreraId}
- `useCursoDetalle(id)` -> GET /catalog/curso/{id}
- `useOnboarding()` -> POST /onboarding
- `useMeCursos()` -> GET /me/cursos
- `useMeEvaluaciones()` -> GET /me/evaluaciones
- `useEditarNota()` -> PATCH /me/evaluaciones/{id}/nota
- `usePreferencias()` -> GET/POST /me/preferencias/recordatorios

Cliente API (axios)
- Base URL desde `NEXT_PUBLIC_API_BASE_URL`
- Interceptores: manejo de errores y (opcional) auth token

## Lógica de UI y Cálculos

- Proyección de nota: calcular en UI (para feedback instantáneo) y confiar en backend para persistir resumen.
- Suma de porcentajes: validar que ~= 100 (+/-1) y mostrar aviso si difiere.
- Fechas estimadas: si backend expone `fecha_estimada`, formatear con timezone America/Lima; si no, mostrar "Semana N".
- Horario: dibujar grilla semanal (L-D) en intervalos de 45 min; permitir resize para agrupar bloques.

## Accesibilidad y UX

- Formularios con validación optimista y mensajes claros.
- "Omitir" en pasos opcionales para no bloquear el flujo.
- Estado de carga y vacíos con guías ("Aún no has agregado notas").

## Errores y estados especiales

- Backend sin `fecha_inicio`: no hay fechas exactas; mostrar "Semana N".
- Carreras o cursos no disponibles: CTA "Reportar y continuar".
- Duplicados en evaluaciones/porcentajes: resaltar y permitir continuar (los datos vienen de PDF; se corrigen luego).

## Roadmap UI (no bloqueante)

- Calendario consolidado de cursos/estudio.
- Notificaciones in-app y push (si se habilita backend/canal).
- Visualizaciones de tendencia (promedios por semana, completitud de hábitos).

---

Con esta guía, el frontend queda alineado con el backend y el modelo de datos extraído: onboarding simple, vistas de curso completas, gestión de notas y herramientas de organización (horario/recordatorios) basadas en la información disponible hoy.

## Proceso Esperado (End-to-End)

- Landing
  - CTA "Comenzar" lleva a `/onboarding`.

- Onboarding
  - Paso Campus: lista de campus desde backend (semilla cargada por db_setup/load_json_to_db). Selección obligatoria.
  - Paso Periodo: lista de periodos activos; mostrar `fecha_inicio` si existe. Si no hay fecha, UI trabaja por "Semana N".
  - Paso Carrera: GET de carreras; selección obligatoria.
  - Paso Cursos: GET de cursos por carrera; selección múltiple de cursos que está cursando. Mostrar info clave (código, horas_semanales, créditos, modalidad) y vista previa de evaluaciones.
  - Paso Preferencias (opcional): anticipación de recordatorios; permite omitir.
  - Paso Resumen: POST `/onboarding` con la selección. Redirigir a `/dashboard`.

- Post-onboarding inmediato
  - `/dashboard`: mostrar KPIs básicos, próximos hitos por semana o fecha estimada (si `fecha_inicio` de periodo está definida).
  - Lista de cursos activos con acceso rápido a: notas y horario.

- Gestión continua
  - Notas: en cada curso, ingresar/calcular promedio parcial y "nota necesaria". Persistir en `/me/evaluaciones`.
  - Horario: asignar bloques de 45 min según `horas_semanales`; evitar solapes; guardar en `/me/horario`.
  - Preferencias/recordatorios: ajustar en `/settings/recordatorios`.

- Estados de error/ausencia de datos
  - Si faltan evaluaciones o suman != 100: UI lo muestra y permite continuar (dato proviene del PDF; se corrige luego).
  - Si falta `fecha_inicio` de periodo: no se calculan fechas, solo "Semana N"; cuando se agregue la fecha en backend, UI mostrará fechas estimadas.

- Datos usados por UI
  - Catálogos: campus, periodos, carreras, cursos (catálogo)
  - Detalle de curso: silabo, unidades, evaluaciones, bibliografía, políticas
  - Usuario: selección de cursos, notas por evaluación, horario por curso, preferencias de recordatorios

