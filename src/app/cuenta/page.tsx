import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";

export const metadata = {
  title: "Cuenta"
};

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">Cuenta</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-[var(--ink)]">Tu universo personal</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          "Órdenes y seguimiento",
          "Direcciones guardadas",
          "Favoritos y compras recurrentes",
          "Perfil de tus mascotas"
        ].map((title) => (
          <div
            key={title}
            className="rounded-[2rem] border border-white/60 bg-white/82 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]"
          >
            <h2 className="font-display text-3xl leading-none text-[var(--ink)]">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              Vista preparada para evolucionar hacia autenticación, clientes y órdenes reales desde Medusa.
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,#23318a,#7f72ff)] p-8 text-white shadow-[0_24px_60px_rgba(31,36,84,0.12)]">
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
