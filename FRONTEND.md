# Trackademy Frontend Guide (Next.js + NextAuth + API)

Guía consolidada para el equipo de frontend con autenticación Microsoft Entra ID, variables de entorno, cliente HTTP y especificación de endpoints con bodies y respuestas.

## Entorno

- NEXTAUTH_URL=http://localhost:3000
- NEXTAUTH_SECRET=<string aleatoria>
- AUTH_MICROSOFT_ENTRA_ID_ID=<Client ID>
- AUTH_MICROSOFT_ENTRA_ID_SECRET=<Client Secret>
- AUTH_MICROSOFT_ENTRA_ID_TENANT_ID=<Tenant ID> (opcional; usa common si falta)
- BACKEND_URL=http://localhost:8080
- NEXT_PUBLIC_TIMEZONE=America/Lima

Producción (CORS): agregar https://trackademy.trinitylabs.app en el backend (propiedad trackademy.cors.allowed-origins o env CORS_ALLOWED_ORIGINS).

## NextAuth (Microsoft Entra ID)

src/auth.config.ts

```ts
import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const tenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;

export const authConfig: NextAuthConfig = {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: tenantId ? `https://login.microsoftonline.com/${tenantId}/v2.0` : "https://login.microsoftonline.com/common/v2.0",
      authorization: { params: { scope: `openid profile email offline_access api://${process.env.AUTH_MICROSOFT_ENTRA_ID_ID}/.default` } },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token;
        token.expires_at = account.expires_at;
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).access_token = token.access_token;
      (session as any).expires_at = token.expires_at;
      return session;
    },
  },
};
```

src/app/api/auth/[...nextauth]/route.ts

```ts
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
const handler = NextAuth(authConfig);
export { handler as GET, handler as POST };
```

## Cliente HTTP

src/lib/api.ts

```ts
import { getServerSession } from "next-auth";
import { authConfig } from "@/auth.config";

const BASE_URL = process.env.BACKEND_URL!;

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = await getServerSession(authConfig);
  const headers: HeadersInit = {
    ...(init.headers || {}),
    Authorization: session && (session as any).access_token ? `Bearer ${(session as any).access_token}` : "",
    "Content-Type": "application/json",
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? (undefined as any) : res.json();
}
```

## DTOs (TypeScript sugeridos)

```ts
export type CarreraDto = { id: number; nombre: string };
export type CursoDto = { id: number; codigo: string; nombre: string };

export type TemaDto = { id: number; titulo: string };
export type UnidadDto = { id: number; numero: number; titulo: string; temas: TemaDto[] };
export type EvaluacionDto = { id: number; codigo: string; descripcion: string | null; semana: number | null; porcentaje: string };
export type ResultadoAprendizajeDto = { id: number; texto: string; tipo?: string | null; unidadId?: number | null };
export type NotaPoliticaDto = { seccion?: string | null; texto?: string | null };

export type CursoDetailDto = {
  id: number; codigo: string; nombre: string; horasSemanales?: number | null;
  silaboDescripcion?: string | null; // sumilla vigente
  resultadosAprendizaje: ResultadoAprendizajeDto[];
  unidades: UnidadDto[];
  evaluaciones: EvaluacionDto[];
  bibliografia: string[];
  competencias: string[];
  politicas: NotaPoliticaDto[];
};

export type UsuarioEvaluacionDto = {
  id: number; codigo: string; descripcion: string | null; semana: number | null; porcentaje: string; fechaEstimada?: string | null; nota?: string | null;
};

export type UsuarioCursoResumenDto = {
  cursoId: number; cursoNombre: string; evaluaciones: UsuarioEvaluacionDto[];
};

export type OnboardingRequest = { campusId: number; periodoId: number; carreraId: number; cursoIds: number[] };
```

## Endpoints (Base: ${BACKEND_URL}/api)

- Salud
  - GET `/health` -> 200 `{ status: "ok" }`

- Usuario (auth)
  - GET `/me` -> `{ sub, issuer, aud, claims }`
  - GET `/me/cursos` -> `UsuarioCursoResumenDto[]`
  - GET `/me/evaluaciones` -> `UsuarioEvaluacionDto[]` (próximas 3 semanas)
  - POST `/me/evaluaciones/{id}/nota` body `{ nota: string }` -> 204
  - POST `/me/preferencias/recordatorios` body `{ anticipacionDias: number }` -> 204
  - POST `/me/horario` body `[{ usuarioCursoId: number, diaSemana: 1|..|7, horaInicio: "HH:mm", duracionMin: number }]` -> 204
  - POST `/me/habitos` body `{ titulo: string, frecuencia?: string }` -> 200 `number` (id)
  - POST `/me/habitos/{id}/log` body `{ fecha?: "YYYY-MM-DD" }` -> 204
  - GET `/me/recomendaciones` -> `string[]`

- Catálogo (auth)
  - GET `/catalog/carreras?universidadId={id}` -> `CarreraDto[]`
  - GET `/catalog/cursos?carreraId={id}` -> `CursoDto[]`
  - GET `/catalog/curso/{id}` -> `CursoDetailDto`

- Onboarding (auth)
  - POST `/onboarding` body `{ campusId, periodoId, carreraId, cursoIds }` -> `UsuarioCursoResumenDto[]`

## Ejemplos

```ts
// Carreras
const carreras = await apiFetch<CarreraDto[]>(`/api/catalog/carreras?universidadId=1`);

// Cursos por carrera
const cursos = await apiFetch<CursoDto[]>(`/api/catalog/cursos?carreraId=${carreraId}`);

// Detalle de curso
const detalle = await apiFetch<CursoDetailDto>(`/api/catalog/curso/${cursoId}`);

// Onboarding
await apiFetch<UsuarioCursoResumenDto[]>(`/api/onboarding`, {
  method: "POST",
  body: JSON.stringify({ campusId, periodoId, carreraId, cursoIds }),
});

// Registrar nota
await apiFetch<void>(`/api/me/evaluaciones/${usuarioEvaluacionId}/nota`, {
  method: "POST",
  body: JSON.stringify({ nota: "15" }),
});
```

## Protección de rutas

- Server Components: `const session = await getServerSession(authConfig);` si no hay sesión, redirigir a `/login`.
- Middleware opcional: withAuth para `/dashboard` y `/me`.

## CORS y dominios

- Backend: `trackademy.cors.allowed-origins` incluye `http://localhost:3000` y `https://trackademy.trinitylabs.app`.
- En producción, configurar env `CORS_ALLOWED_ORIGINS` con ambos dominios.

## Notas de UX/validaciones

- Mostrar “Semana N” cuando no haya `fecha_estimada`.
- Validar suma de porcentajes ~ 100 para feedback.
- Horario: bloques de 45 min, agrupar 90/135/180 y evitar solapes.
- Errores: 401 (sin token/expirado), 403/404 (recurso ajeno/no existe), CORS si falta dominio en backend.
