"use client";

import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { useStore } from "@/store/store-provider";

/** Sits above the /cuenta card grid — the only place in the storefront that shows whether the
 *  visitor is a guest or a logged-in customer. Doesn't gate anything below it: Mascotas, Wishlist
 *  and Patipuntos all keep working the same for a guest as before this existed. */
export function AccountHeader() {
  const { activeCustomer, isAuthReady, isLoggedIn, logout } = useStore();

  if (!isAuthReady) {
    return null;
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-white/60 bg-white/70 p-5">
        <p className="text-sm leading-6 text-[var(--muted)]">
          Podés seguir comprando como invitado — crear una cuenta es opcional, pero guarda tus
          mascotas, tus Patipuntos y tu historial en un solo lugar.
        </p>
        <div className="flex shrink-0 gap-3">
          <Link className={buttonStyles({ variant: "secondary", size: "sm" })} href="/cuenta/iniciar-sesion">
            Iniciar sesión
          </Link>
          <Link className={buttonStyles({ size: "sm" })} href="/cuenta/registrarse">
            Crear cuenta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-white/60 bg-white/70 p-5">
      <p className="text-sm font-semibold text-[var(--ink)]">
        Hola, {activeCustomer?.firstName || activeCustomer?.emailAddress}
      </p>
      <button className={buttonStyles({ variant: "ghost", size: "sm" })} onClick={() => logout()} type="button">
        Cerrar sesión
      </button>
    </div>
  );
}
