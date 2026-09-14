import { Suspense } from "react";

import { LoginForm } from "@/components/account/login-form";

export const metadata = {
  title: "Iniciar sesión"
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
