import { OrdersManager } from "@/components/account/orders-manager";

export const metadata = {
  title: "Tus pedidos"
};

export default function AccountOrdersPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <OrdersManager />
    </div>
  );
}
