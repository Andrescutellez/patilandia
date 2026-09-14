import { RegisterForm } from "@/components/account/register-form";

export const metadata = {
  title: "Crear cuenta"
};

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
}
