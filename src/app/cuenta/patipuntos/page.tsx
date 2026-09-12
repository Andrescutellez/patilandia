import { PatipuntosManager } from "@/components/account/patipuntos-manager";

export const metadata = {
  title: "Tus Patipuntos"
};

export default function AccountPatipuntosPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PatipuntosManager />
    </div>
  );
}
