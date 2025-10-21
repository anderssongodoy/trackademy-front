This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Auth with Microsoft Entra ID (Auth.js v5)

This app uses Auth.js v5 with the `microsoft-entra-id` provider. We store the provider `id_token` in the session JWT and expose it to the client as `session.idToken` to call the Spring Boot backend.

1) Copy `.env.example` to `.env.local` and fill:

- `AUTH_SECRET`
- `AUTH_MICROSOFT_ENTRA_ID_ID`
- `AUTH_MICROSOFT_ENTRA_ID_SECRET`
- `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID`
- `BACKEND_URL`
- `NEXT_PUBLIC_API_URL`

2) In your Azure App Registration, add redirect URIs (type Web):

- `http://localhost:3000/api/auth/callback/microsoft-entra-id`
- `https://<your-domain>/api/auth/callback/microsoft-entra-id`

3) Flow summary:

- User signs in with Microsoft.
- Auth.js requests `openid profile email offline_access` and receives an `id_token`.
- We persist the `id_token` in the JWT and expose it on the session as `idToken`.
- On `events.signIn`, we POST `{ idToken }` to `BACKEND_URL/auth/entra/callback` so Spring can validate and create its own session/JWT if needed.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
