"use client";

import { PublicClientApplication, type AccountInfo, type AuthenticationResult } from "@azure/msal-browser";

let msalApp: PublicClientApplication | null = null;
let msalAuthorityUsed: string | null = null;

const ALLOWED_AUTHORITIES = [
  "https://login.microsoftonline.com/common",
  "https://login.microsoftonline.com/consumers",
  "https://login.microsoftonline.com/organizations",
];

function resolveAuthority(): string {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("track_msal_authority");
      if (stored && ALLOWED_AUTHORITIES.includes(stored)) return stored;
    }
  } catch {}
  const envAuth = process.env.NEXT_PUBLIC_MSAL_AUTHORITY || "https://login.microsoftonline.com/common";
  return ALLOWED_AUTHORITIES.includes(envAuth) ? envAuth : "https://login.microsoftonline.com/common";
}

export function setMsalAuthority(authority: "common" | "consumers" | "organizations") {
  const map: Record<string, string> = {
    common: "https://login.microsoftonline.com/common",
    consumers: "https://login.microsoftonline.com/consumers",
    organizations: "https://login.microsoftonline.com/organizations",
  };
  const value = map[authority] || map.common;
  try { if (typeof window !== "undefined") localStorage.setItem("track_msal_authority", value); } catch {}
  if (msalAuthorityUsed !== value) { msalApp = null; msalAuthorityUsed = null; }
}

function getConfig() {
  const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || process.env.NEXT_PUBLIC_MS_CLIENT_ID || "";
  const authority = resolveAuthority();
  return { clientId, authority };
}

export function getMsalApp() {
  if (!msalApp) {
    const { clientId, authority } = getConfig();
    if (!clientId) {
      console.warn("MSAL clientId no configurado: NEXT_PUBLIC_AZURE_CLIENT_ID");
      return null;
    }
    msalApp = new PublicClientApplication({
      auth: { clientId, authority, redirectUri: (typeof window !== "undefined" ? window.location.origin : undefined) },
      cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false },
    });
    msalAuthorityUsed = authority;
  }
  return msalApp;
}

export async function promptGraphConsent(scopes: string[], loginHint?: string): Promise<boolean> {
  const app = getMsalApp();
  if (!app) return false;
  try {
    await app.initialize();
    await app.loginPopup({
      loginHint,
      scopes: Array.from(new Set(["openid", "profile", "email", "User.Read", ...scopes])),
      prompt: "select_account",
      authority: getConfig().authority,
    });
    return true;
  } catch {
    return false;
  }
}

async function ensureAccountWithScopes(scopes: string[], loginHint?: string): Promise<AccountInfo | null> {
  const app = getMsalApp();
  if (!app) return null;
  await app.initialize();
  let account: AccountInfo | null = null;
  const accounts = app.getAllAccounts();
  if (accounts && accounts.length) account = accounts[0];
  try {
    if (!account) {
      // Login interactivo incluyendo los scopes de Graph para garantizar consentimiento en el primer paso
      const res = await app.loginPopup({ loginHint, scopes: Array.from(new Set(["openid", "profile", "email", "User.Read", ...scopes])), prompt: "select_account", authority: getConfig().authority });
      account = res.account ?? null;
    }
  } catch {
    // fallback explícito
    const res = await app.loginPopup({ loginHint, scopes: Array.from(new Set(["openid", "profile", "email", "User.Read", ...scopes])), prompt: "select_account", authority: getConfig().authority });
    account = res.account ?? null;
  }
  return account;
}

export async function getGraphAccessToken(scopes: string[], loginHint?: string): Promise<string | null> {
  const app = getMsalApp();
  if (!app) return null;
  try {
    const account = await ensureAccountWithScopes(scopes, loginHint);
    if (!account) return null;
    try {
      const at: AuthenticationResult = await app.acquireTokenSilent({ account, scopes, authority: getConfig().authority });
      return at.accessToken || null;
    } catch {
      const at = await app.acquireTokenPopup({ account, scopes, prompt: "consent", authority: getConfig().authority });
      return at.accessToken || null;
    }
  } catch {
    return null;
  }
}
