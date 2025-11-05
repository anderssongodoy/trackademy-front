import NextAuth, { type NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const BACKEND_URL = process.env.BACKEND_URL;
const TENANT_ID = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;

function decodeJwtExpMs(jwt?: string): number | null {
  try {
    if (!jwt) return null;
    const parts = jwt.split(".");
    if (parts.length < 2) return null;
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
    if (!payload || !payload.exp) return null;
    return Number(payload.exp) * 1000;
  } catch {
    return null;
  }
}

interface MicrosoftTokenResponse {
  token_type: string;
  scope: string;
  expires_in: number;
  ext_expires_in: number;
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
}

interface JwtToken {
  refreshToken?: string;
  idToken?: string;
  idTokenExpires?: number;
  error?: string;
  [key: string]: unknown;
}

async function refreshIdToken(token: JwtToken) {
  try {
    const tenant = TENANT_ID || "common";
    const res = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID || "",
        client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET || "",
        refresh_token: token.refreshToken || "",
        scope: "openid profile email offline_access",
      }),
    });
    const data: MicrosoftTokenResponse = await res.json();
    if (!res.ok) throw new Error(data.error_description || "refresh_failed");
    const newId = data.id_token as string | undefined;
    const newRefresh = data.refresh_token as string | undefined;
    const idExp = decodeJwtExpMs(newId || token.idToken) || (Date.now() + 3600 * 1000);
    return {
      ...token,
      idToken: newId || token.idToken,
      idTokenExpires: idExp,
      refreshToken: newRefresh || token.refreshToken,
    };
  } catch (e) {
    return { ...token, error: "RefreshIdTokenError" };
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: TENANT_ID
        ? `https://login.microsoftonline.com/common/v2.0`
        : undefined,
      authorization: {
        params: {
          scope: "openid profile email offline_access",
          response_type: "code",
        },
      },
    }),
  ],

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60, updateAge: 5 * 60 },

  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        token.idTokenExpires = decodeJwtExpMs(account.id_token) || (Date.now() + 3600 * 1000);
        return token;
      }
      // If id token still valid, keep it
      if (typeof token.idTokenExpires === "number" && Date.now() < (token.idTokenExpires - 60_000)) {
        return token;
      }
      // Refresh id token
      return await refreshIdToken(token);
    },
    async session({ session, token }) {
      // @ts-expect-error attach custom field used by the app
      session.idToken = token.idToken as string | undefined;
      return session;
    },
  },

  events: {
    async signIn({ account }) {
      try {
        const idToken = account?.id_token;
        if (idToken && BACKEND_URL) {
          await fetch(`${BACKEND_URL}/auth/entra/callback`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          }).catch(() => undefined);
        }
      } catch {
      }
    },
  },

  pages: {
    signIn: "/",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

export type ExtendedSession = {
  idToken?: string;
} & Awaited<ReturnType<typeof auth>>;
