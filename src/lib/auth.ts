import NextAuth, { type NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const BACKEND_URL = process.env.BACKEND_URL;
const TENANT_ID = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;

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

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, account }) {
      if (account?.id_token) {
        token.idToken = account.id_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.idToken) {
        // @ts-expect-error - add custom field
        session.idToken = token.idToken as string;
      }
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
