const MEDUSA_BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";

const MEDUSA_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

export function isMedusaConfigured() {
  return Boolean(MEDUSA_BACKEND_URL && MEDUSA_PUBLISHABLE_KEY);
}

export async function medusaFetch<T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number; tags?: string[] } }
) {
  if (!MEDUSA_PUBLISHABLE_KEY) {
    return null;
  }

  const headers = new Headers(init?.headers);
  headers.set("x-publishable-api-key", MEDUSA_PUBLISHABLE_KEY);
  headers.set("Content-Type", "application/json");

  const response = await fetch(`${MEDUSA_BACKEND_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    throw new Error(`Medusa request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}
