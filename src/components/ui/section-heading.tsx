import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { ChevronRightIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  centered = false,
  titleFont = "display"
}: {
  eyebrow: string;
  title: string;
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
        <p className="text-sm font-black uppercase tracking-[0.35em] text-[var(--brand-violet-deep)]">
          {eyebrow}
        </p>
        <h2
          className={cn(
            titleFont === "marker" ? "font-marker" : "font-display",
            "text-4xl leading-none text-[var(--ink)] sm:text-5xl"
          )}
        >
          {title}
        </h2>
        {description ? <p className="max-w-xl text-base text-[var(--muted)]">{description}</p> : null}
      </div>

      {actionHref && actionLabel ? (
        <Link className={buttonStyles({ variant: "ghost", className: "self-start px-0" })} href={actionHref}>
          {actionLabel}
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
