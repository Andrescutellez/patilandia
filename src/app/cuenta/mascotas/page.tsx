import { PetsManager } from "@/components/account/pets-manager";

export const metadata = {
  title: "Tus mascotas"
};

export default function AccountPetsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <PetsManager />
    </div>
  );
}
