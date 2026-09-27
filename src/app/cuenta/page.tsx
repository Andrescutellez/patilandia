import Link from "next/link";

import { AccountHeader } from "@/components/account/account-header";
import { AccountOrdersCard } from "@/components/account/account-orders-card";
import { AccountPatipuntosCard } from "@/components/account/account-patipuntos-card";
import { AccountPetsCard } from "@/components/account/account-pets-card";
import { AccountSubscriptionsCard } from "@/components/account/account-subscriptions-card";
import { AccountWishlistCard } from "@/components/account/account-wishlist-card";
import { buttonStyles } from "@/components/ui/button";
import { getStorefrontProducts } from "@/lib/storefront";

export const metadata = {
  title: "Cuenta"
};

export default async function AccountPage() {
  const products = await getStorefrontProducts();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">Cuenta</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-[var(--ink)]">Tu universo personal</h1>
      </div>

      <AccountHeader />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <AccountWishlistCard products={products} />
        <AccountPetsCard />
        <AccountPatipuntosCard />
        <AccountSubscriptionsCard />
        <AccountOrdersCard />
      </div>

      <div className="rounded-[2rem] border border-white/60 bg-[var(--brand-violet)] p-8 text-white shadow-[0_24px_60px_rgba(31,36,84,0.12)]">
        <h2 className="font-display text-5xl leading-none">Una base lista para crecer</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/78">
          Cuando conectemos clientes y órdenes reales, esta sección podrá mostrar historial, recompensas,
          preferencias y productos recurrentes sin reconstruir la experiencia.
        </p>
        <Link className={buttonStyles({ className: "mt-6" })} href="/wishlist">
          Ver wishlist
        </Link>
      </div>
    </div>
  );
}
