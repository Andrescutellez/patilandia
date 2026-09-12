"use client";

const VENDURE_SHOP_API_URL =
  process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ?? "http://localhost:3000/shop-api";

export const ACCOUNT_EMAIL_STORAGE_KEY = "patilandia-account-email";

export type PetSpecies = "dog" | "cat" | "other";
export type PetSize = "" | "pequeno" | "mediano" | "grande";

export interface PetProfile {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  birthDate: string | null;
  sizeLabel: PetSize;
  notes: string;
}

export interface PetProfileInput {
  name: string;
  species: PetSpecies;
  breed?: string;
  birthDate?: string;
  sizeLabel?: PetSize;
  notes?: string;
}

class PetsApiError extends Error {}

/**
 * No customer login exists on this storefront — pet profiles are identified by email alone, the
 * same trust level already used by the cart (see setCustomerEmail in shop-client.ts). Not real
 * security: anyone who knows an email can read/edit those pets. Documented as a known limitation
 * in Decisiones y Razonamiento — real customer auth would upgrade this transparently.
 */
export function getStoredAccountEmail(): string | null {
  try {
    return window.localStorage.getItem(ACCOUNT_EMAIL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function storeAccountEmail(email: string) {
  try {
    window.localStorage.setItem(ACCOUNT_EMAIL_STORAGE_KEY, email);
  } catch {
    // Worst case the user re-enters their email next visit — not fatal.
  }
}

async function shopFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(VENDURE_SHOP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  });

  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (payload.errors?.length) {
    throw new PetsApiError(payload.errors[0].message);
  }
  if (!payload.data) {
    throw new PetsApiError("Vendure no devolvió datos.");
  }
  return payload.data;
}

const PET_FIELDS = `id name species breed birthDate sizeLabel notes`;

export async function getMyPetProfiles(email: string): Promise<PetProfile[]> {
  const data = await shopFetch<{ myPetProfiles: PetProfile[] }>(
    `query MyPetProfiles($email: String!) { myPetProfiles(customerEmail: $email) { ${PET_FIELDS} } }`,
    { email }
  );
  return data.myPetProfiles;
}

export async function createPetProfile(email: string, input: PetProfileInput): Promise<PetProfile> {
  const data = await shopFetch<{ createPetProfile: PetProfile }>(
    `mutation CreatePetProfile($input: CreatePetProfileInput!) {
      createPetProfile(input: $input) { ${PET_FIELDS} }
    }`,
    { input: { ...input, customerEmail: email } }
  );
  return data.createPetProfile;
}

export async function updatePetProfile(
  email: string,
  id: string,
  input: PetProfileInput
): Promise<PetProfile> {
  const data = await shopFetch<{ updatePetProfile: PetProfile }>(
    `mutation UpdatePetProfile($input: UpdatePetProfileInput!) {
      updatePetProfile(input: $input) { ${PET_FIELDS} }
    }`,
    { input: { ...input, id, customerEmail: email } }
  );
  return data.updatePetProfile;
}

export async function deletePetProfile(email: string, id: string): Promise<void> {
  await shopFetch<{ deletePetProfile: boolean }>(
    `mutation DeletePetProfile($id: ID!, $email: String!) {
      deletePetProfile(id: $id, customerEmail: $email)
    }`,
    { id, email }
  );
}
