import { Suspense } from "react";

import { BoldConfirmationPage } from "@/components/checkout/bold-confirmation-page";

export const metadata = {
  title: "Confirmando tu pago"
};

export default function BoldConfirmationRoute() {
  return (
    <Suspense>
      <BoldConfirmationPage />
    </Suspense>
  );
}
