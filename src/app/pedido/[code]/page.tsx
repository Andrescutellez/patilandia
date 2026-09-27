import { OrderTrackingPage } from "@/components/order/order-tracking-page";

interface OrderPageProps {
  params: Promise<{ code: string }>;
}

export const metadata = {
  title: "Tu pedido"
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { code } = await params;
  return <OrderTrackingPage code={code} />;
}
