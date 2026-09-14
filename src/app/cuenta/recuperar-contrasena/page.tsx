import { RequestPasswordResetForm } from "@/components/account/request-password-reset-form";

export const metadata = {
  title: "Recuperar contraseña"
};

export default function RequestPasswordResetPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <RequestPasswordResetForm />
    </div>
  );
}
