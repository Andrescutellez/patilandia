import { Suspense } from "react";

import { SubscriptionsManager } from "@/components/account/subscriptions-manager";

export const metadata = {
  title: "Tus suscripciones"
};

export default function AccountSubscriptionsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <Suspense fallback={null}>
        <SubscriptionsManager />
      </Suspense>
    </div>
  );
}
