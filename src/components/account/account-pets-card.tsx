"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { getMyPetProfiles, getStoredAccountEmail } from "@/lib/vendure/pets-client";

/** The one "próximamente" card in /cuenta that got upgraded to real data — see the Reseñas-style
 *  plugin at patilandia-vendure/src/plugins/patilandia-pets. No customer login exists, so "sesión"
 *  here just means "we remember your email in this browser", same trust level as the cart. */
export function AccountPetsCard() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const email = getStoredAccountEmail();
    if (!email) {
      setCount(0);
      return;
    }
    getMyPetProfiles(email)
      .then((pets) => setCount(pets.length))
      .catch(() => setCount(0));
  }, []);

  return (
    <div className="rounded-[2rem] border border-white/60 bg-white/82 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
      <h2 className="font-display text-3xl leading-none text-[var(--ink)]">Tus mascotas</h2>
      <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
        {count === null
          ? "Cargando…"
          : count === 0
            ? "Contanos de tus mascotas para recomendarte productos a su medida."
            : `${count} ${count === 1 ? "mascota cargada" : "mascotas cargadas"}.`}
      </p>
      <Link className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-5 w-full" })} href="/cuenta/mascotas">
        {count ? "Ver y editar" : "Cargar una mascota"}
      </Link>
    </div>
  );
}
