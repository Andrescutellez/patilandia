import type { CartLineItem } from "@/types/commerce";

export interface ShippingPreview {
  label: string;
  detail: string;
  status: "quote" | "standard";
}

export function getShippingPreview(items: CartLineItem[]): ShippingPreview {
  if (items.length === 0) {
    return {
      label: "Se calcula en checkout",
      detail: "El valor depende del destino, peso, volumen y transportadora.",
      status: "quote"
    };
  }

  const hasSpecialShipping = items.some((item) =>
    item.product.shippingClass === "bulky" ||
    item.product.shippingClass === "heavy" ||
    item.product.shippingClass === "custom"
  );

  const totalWeight = items.reduce(
    (sum, item) => sum + item.product.weightKg * item.quantity,
    0
  );

  if (hasSpecialShipping || totalWeight >= 8) {
    return {
      label: "Cotización inteligente pendiente",
      detail:
        "Preparado para calcular envíos por peso, volumen, destino y tipo de producto al conectar Medusa.",
      status: "quote"
    };
  }

  return {
    label: "Envío estimado en checkout",
    detail:
      "Mostraremos opciones disponibles según ciudad, dirección y disponibilidad de entrega local.",
    status: "standard"
  };
}
