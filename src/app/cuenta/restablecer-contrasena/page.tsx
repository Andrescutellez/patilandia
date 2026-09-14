import { Suspense } from "react";

import { ResetPasswordForm } from "@/components/account/reset-password-form";

export const metadata = {
  title: "Restablecer contraseña"
};

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
