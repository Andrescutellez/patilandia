"use client";

import { shopFetch } from "./shop-fetch";

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

/**
 * Fallback identity for guests who never log in — a real Vendure session (see store-provider.tsx's
 * activeCustomer) always takes priority server-side once shopFetch sends it, but this key still
 * drives which UI path (EmailGate vs. real data) a guest sees before that check happens.
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
