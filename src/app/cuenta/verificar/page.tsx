import { Suspense } from "react";

import { VerifyAccountEmail } from "@/components/account/verify-account-email";

export const metadata = {
  title: "Verificar cuenta"
};

export default function VerifyAccountPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <VerifyAccountEmail />
      </Suspense>
    </div>
  );
}
