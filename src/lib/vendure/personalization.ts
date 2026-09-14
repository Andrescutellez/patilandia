import { VENDURE_MONEY_FACTOR, vendureFetch } from "@/lib/vendure/client";

export interface PersonalizationFieldOption {
  id: string;
  label: string;
  value: string;
  colorHex: string | null;
}

export interface PersonalizationField {
  id: string;
  label: string;
  fieldType: string;
  placeholder: string;
  required: boolean;
  maxLength: number | null;
  options: PersonalizationFieldOption[];
}

export interface PersonalizationConfig {
  method: string;
  /** Decimal currency (COP), already converted from Vendure's minor-unit integer. */
  priceSurcharge: number;
  fields: PersonalizationField[];
}

const CONFIG_QUERY = `
  query PersonalizationConfigForProduct($productId: ID!) {
    personalizationConfigForProduct(productId: $productId) {
      method
      priceSurchargeMinorUnits
      fields {
        id
        label
        fieldType
        placeholder
        required
        maxLength
        options {
          id
          label
          value
          colorHex
        }
      }
    }
  }
`;

interface VendurePersonalizationResponse {
  personalizationConfigForProduct: {
    method: string;
    priceSurchargeMinorUnits: number;
    fields: PersonalizationField[];
  } | null;
}

/** Shop API only ever returns something when the product is currently enabled for
 *  personalization — null means "show nothing", not "not loaded yet". */
export async function getPersonalizationConfig(productId: string): Promise<PersonalizationConfig | null> {
  if (!productId) {
    return null;
  }

  const response = await vendureFetch<VendurePersonalizationResponse>(
    CONFIG_QUERY,
    { productId },
    { next: { revalidate: 60 } }
  );

  const config = response?.personalizationConfigForProduct;
  if (!config) return null;

  return {
    method: config.method,
    priceSurcharge: config.priceSurchargeMinorUnits / VENDURE_MONEY_FACTOR,
    fields: config.fields
  };
}
