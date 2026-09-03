"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { CartIcon, GridIcon, HeartIcon, HomeIcon, UserIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store-provider";

const mobileItems = [
  { href: "/", label: "Inicio", icon: HomeIcon },
  { href: "/categorias", label: "Categorías", icon: GridIcon },
  { href: "/wishlist", label: "Wishlist", icon: HeartIcon },
  { href: "/cuenta", label: "Cuenta", icon: UserIcon },
  { href: "/carrito", label: "Carrito", icon: CartIcon }
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, wishlistCount } = useStore();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-[rgba(255,251,246,0.92)] px-3 py-2 shadow-[0_-14px_40px_rgba(30,36,84,0.12)] backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
        {mobileItems.map((item) => {
          const isActive = item.href === "/" ? pathname === item.href : pathname.startsWith(item.href);
          const count = item.href === "/carrito" ? cartCount : item.href === "/wishlist" ? wishlistCount : 0;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              className={cn(
                "relative flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold text-[var(--muted)] transition",
                isActive && "bg-[var(--brand-soft)] text-[var(--brand-violet-deep)]"
              )}
              href={item.href}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
              {count > 0 ? (
                <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-violet)] px-1 text-[9px] text-white">
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
