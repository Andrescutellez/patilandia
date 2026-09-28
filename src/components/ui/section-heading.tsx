import type { ReactNode } from "react";

import Link from "next/link";

import { ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  titleIcon,
  description,
  actionHref,
  actionLabel,
  centered = false,
  titleFont = "display"
}: {
  eyebrow?: string;
  title: string;
  /** Small icon shown right before the title, e.g. a paw before "Destacados". */
  titleIcon?: ReactNode;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  centered?: boolean;
  titleFont?: "display" | "marker";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-end md:justify-between",
        centered && "items-center text-center md:flex-col md:items-center"
      )}
    >
      <div className={cn("max-w-2xl space-y-3", centered && "mx-auto")}>
        {eyebrow ? (
          <p className="text-sm font-black uppercase tracking-[0.35em] text-[var(--brand-violet-deep)]">
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            titleFont === "marker" ? "font-marker" : "font-display",
            "flex items-center gap-2 text-4xl leading-none text-[var(--ink)] sm:text-5xl",
            centered && "justify-center"
          )}
        >
          {titleIcon}
          {title}
        </h2>
        {description ? <p className="max-w-xl text-base text-[var(--muted)]">{description}</p> : null}
      </div>

      {actionHref && actionLabel ? (
        <Link
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[var(--brand-soft)] px-5 py-2.5 text-sm font-bold text-[var(--brand-violet-deep)] transition hover:bg-[var(--brand-violet)] hover:text-white"
          href={actionHref}
        >
          {actionLabel}
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
