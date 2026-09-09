"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

import { mainNavigation } from "@/data/mock-store";
import { Logo } from "@/components/patilandia/logo";
import {
  CartIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/store-provider";

function HeaderLink({
  href,
  label,
  pathname,
  onClick
}: {
  href: string;
  label: string;
  pathname: string;
  onClick?: () => void;
}) {
  const isActive = href === "/" ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      className={cn(
        "relative text-base font-bold transition hover:text-[var(--brand-violet-deep)]",
        isActive ? "text-[var(--brand-violet-deep)]" : "text-[var(--ink)]"
      )}
      href={href}
      onClick={onClick}
    >
      {label}
      <span
        className={cn(
          "absolute -bottom-3 left-0 h-0.5 rounded-full bg-[var(--brand-violet)] transition-all",
          isActive ? "w-full" : "w-0"
        )}
      />
    </Link>
  );
}

function IconLink({
  href,
  label,
  count,
  children
}: {
  href: string;
  label: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      aria-label={label}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/80 text-[var(--brand-violet-deep)] transition hover:-translate-y-0.5 hover:border-[var(--brand-violet)]"
      href={href}
    >
      {children}
      {count && count > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-violet)] px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { cartCount } = useStore();

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    router.push(query ? `/tienda?buscar=${encodeURIComponent(query)}` : "/tienda");
    setIsSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-[rgba(255,251,246,0.82)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-0 sm:px-6 lg:flex lg:grid-cols-none lg:px-8">
        <button
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/70 text-[var(--brand-violet-deep)] lg:hidden"
          onClick={() => {
            setIsMenuOpen((current) => !current);
            setIsSearchOpen(false);
          }}
          type="button"
        >
          {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>

        <Logo className="shrink-0 justify-self-center" />

        <nav className="ml-8 hidden items-center gap-8 lg:flex">
          {mainNavigation.map((link) => (
            <HeaderLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <form
            className="flex h-12 min-w-[250px] items-center gap-3 rounded-full border border-[var(--line)] bg-white/90 px-4"
            onSubmit={handleSearchSubmit}
          >
            <SearchIcon className="h-4 w-4 text-[var(--muted)]" />
            <input
              className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar productos mágicos..."
              type="search"
              value={searchQuery}
            />
          </form>
        </div>

        <div className="flex items-center justify-self-end gap-2">
          <button
            aria-label={isSearchOpen ? "Cerrar búsqueda" : "Buscar"}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line)] bg-white/80 text-[var(--brand-violet-deep)] transition hover:-translate-y-0.5 hover:border-[var(--brand-violet)] md:hidden"
            onClick={() => {
              setIsSearchOpen((current) => !current);
              setIsMenuOpen(false);
            }}
            type="button"
          >
            {isSearchOpen ? <CloseIcon className="h-5 w-5" /> : <SearchIcon className="h-5 w-5" />}
          </button>

          <div className="hidden items-center gap-2 md:flex">
            <IconLink href="/cuenta" label="Cuenta">
              <UserIcon className="h-5 w-5" />
            </IconLink>
            <IconLink href="/carrito" label="Carrito" count={cartCount}>
              <CartIcon className="h-5 w-5" />
            </IconLink>
          </div>
        </div>
      </div>

      {isSearchOpen ? (
        <div className="border-t border-white/70 bg-[var(--surface)] px-4 py-4 md:hidden">
          <form
            className="mx-auto flex h-12 max-w-7xl items-center gap-3 rounded-full border border-[var(--line)] bg-white px-4"
            onSubmit={handleSearchSubmit}
          >
            <SearchIcon className="h-4 w-4 text-[var(--muted)]" />
            <input
              autoFocus
              className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar productos mágicos..."
              type="search"
              value={searchQuery}
            />
          </form>
        </div>
      ) : null}

      {isMenuOpen ? (
        <div className="border-t border-white/70 bg-[var(--surface)] px-4 py-5 lg:hidden">
          <div className="mx-auto max-w-7xl">
            <nav className="grid gap-3">
              {mainNavigation.map((link) => (
                <HeaderLink
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  onClick={() => setIsMenuOpen(false)}
                  pathname={pathname}
                />
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
