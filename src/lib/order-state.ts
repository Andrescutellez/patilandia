/** Spanish labels for Vendure's OrderState values — shown on the account order list and the
 *  "/pedido/[code]" tracking page. Falls back to the raw state string for anything unmapped, so a
 *  future/uncommon Vendure state (e.g. ArrangingAdditionalPayment) never renders blank. */
const ORDER_STATE_LABEL: Record<string, string> = {
  ArrangingPayment: "Procesando pago",
  PaymentAuthorized: "Pago autorizado",
  PaymentSettled: "Pago confirmado",
  PartiallyShipped: "Parcialmente enviado",
  Shipped: "Enviado",
  PartiallyDelivered: "Parcialmente entregado",
  Delivered: "Entregado",
  Cancelled: "Cancelado"
};

export function orderStateLabel(state: string): string {
  return ORDER_STATE_LABEL[state] ?? state;
}
