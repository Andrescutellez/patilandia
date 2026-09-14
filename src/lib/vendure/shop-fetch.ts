"use client";

const VENDURE_SHOP_API_URL =
  process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ?? "http://localhost:3000/shop-api";
const TOKEN_STORAGE_KEY = "patilandia-vendure-token";
const AUTH_TOKEN_HEADER = "vendure-auth-token";

export class ShopOperationError extends Error {
  errorCode?: string;

  constructor(message: string, errorCode?: string) {
    super(message);
    this.name = "ShopOperationError";
    this.errorCode = errorCode;
  }
}

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore — worst case the session doesn't persist across reloads.
  }
}

export function clearStoredToken() {
  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignore.
  }
}

/**
 * The one session-aware GraphQL client for the Shop API — every module that needs to act as
 * "whoever is currently using this browser" (cart/checkout, Mascotas, Wishlist, Patipuntos, and
 * now login/register) must go through this, not a bare `fetch`, or the Authorization header never
 * reaches the server and no session-based identity (ctx.activeUserId) is ever possible.
 */
export async function shopFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(VENDURE_SHOP_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables })
  });

  const newToken = response.headers.get(AUTH_TOKEN_HEADER);
  if (newToken) {
    storeToken(newToken);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new ShopOperationError(payload.errors[0].message);
  }

  if (!payload.data) {
    throw new ShopOperationError("Vendure no devolvió datos.");
  }

  return payload.data;
}
