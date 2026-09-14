import { vendureFetch } from "@/lib/vendure/client";
import { formatCurrency } from "@/lib/utils";
import type { CartLineItem } from "@/types/commerce";

export interface WhatsappSettings {
  phoneNumber: string;
  defaultMessage: string;
}

const SETTINGS_QUERY = `
  query WhatsappSettings {
    whatsappSettings {
      phoneNumber
      enabled
      defaultMessage
    }
  }
`;

interface VendureWhatsappSettingsResponse {
  whatsappSettings: {
    phoneNumber: string;
    enabled: boolean;
    defaultMessage: string;
  };
}

/**
 * Server-side, mirrors getPersonalizationConfig()'s "null means show nothing" convention — returns
 * null both when Vendure is unreachable AND when the admin turned the WhatsApp integration off
 * (`enabled: false`) or never set a number, so every caller only has to check "is there a
 * configuration or not" instead of separately handling each reason.
 */
export async function getWhatsappSettings(): Promise<WhatsappSettings | null> {
  const response = await vendureFetch<VendureWhatsappSettingsResponse>(SETTINGS_QUERY, undefined, {
    next: { revalidate: 60 }
  });

  const settings = response?.whatsappSettings;
  if (!settings || !settings.enabled || !settings.phoneNumber.trim()) {
    return null;
  }

  return { phoneNumber: settings.phoneNumber, defaultMessage: settings.defaultMessage };
}

/**
 * Builds a `wa.me` click-to-chat link — this, and never a WhatsApp Business API call, is the whole
 * mechanism today (see Decisiones y Razonamiento for why: no Meta Business verification yet). The
 * phone number is normalized to digits-only here, never in the database, so the admin can type it
 * however's natural ("+57 300 1234567") and it still works.
 */
export function buildWhatsAppLink(phoneNumber: string, message: string): string {
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

/** The floating button's fallback message — whatever the admin configured, or a hardcoded fallback
 *  if it's ever empty (shouldn't happen, since getWhatsappSettings() already filters that out, but
 *  a caller passing a stale/mocked settings object shouldn't end up with an empty message). */
export function buildGenericMessage(defaultMessage: string): string {
  return defaultMessage.trim() || "Hola, quiero más información sobre Patilandia 🐾";
}

/** The floating button's message while browsing a specific product — deliberately shorter than
 *  buildProductHelpMessage below, since this is the ambient/passive context, not something the
 *  shopper explicitly clicked "ayuda" for. */
export function buildProductInterestMessage(productName: string): string {
  return `Hola, estoy interesado en ${productName} y quiero saber más`;
}

/** The explicit "¿Necesitás ayuda?" link on a product page — carries enough detail (variant, URL)
 *  that whoever answers on WhatsApp doesn't have to ask which product/variant the customer means. */
export function buildProductHelpMessage(productName: string, variantLabel: string, url: string): string {
  return `Hola, tengo una pregunta sobre "${productName}" (${variantLabel}).\n${url}`;
}

/** Shared by both the cart page and checkout's order summary — one place owns the "how do we
 *  describe the cart in a WhatsApp message" format, so the two never drift apart. */
export function buildCartSummaryMessage(cart: CartLineItem[], subtotal: number): string {
  const lines = cart
    .map((item) => `- ${item.product.name} (${item.selectedColor.name} / ${item.selectedSize}) x${item.quantity}`)
    .join("\n");
  return `Hola, quiero ayuda con mi carrito:\n${lines}\n\nSubtotal: ${formatCurrency(subtotal)}`;
}

/** The order-confirmation screen's "Consultar mi pedido por WhatsApp" — the only place today a
 *  customer sees their own order code (there's no order-tracking page yet, see the WhatsApp plan's
 *  scope note in Decisiones y Razonamiento). */
export function buildOrderInquiryMessage(orderCode: string): string {
  return `Hola, quiero consultar sobre mi pedido #${orderCode}`;
}
