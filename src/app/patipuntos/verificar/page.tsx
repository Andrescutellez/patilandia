import { Suspense } from "react";

import { VerifyPatipuntosEmail } from "@/components/account/verify-patipuntos-email";

export const metadata = {
  title: "Verificar correo"
};

export default function VerifyPatipuntosEmailPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <VerifyPatipuntosEmail />
      </Suspense>
    </div>
  );
}
