import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold";
type ButtonSize = "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,var(--brand-violet),var(--brand-violet-deep))] text-white shadow-[0_18px_30px_rgba(94,76,214,0.28)] hover:-translate-y-0.5",
  secondary:
    "bg-white/88 text-[var(--ink)] ring-1 ring-[var(--line)] hover:bg-white",
  ghost: "bg-transparent text-[var(--brand-violet-deep)] hover:bg-[var(--brand-soft)]",
  gold:
    "bg-[linear-gradient(135deg,var(--brand-gold),#ffcb84)] text-[var(--ink)] shadow-[0_18px_30px_rgba(242,199,111,0.22)] hover:-translate-y-0.5"
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-6 text-base"
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition duration-300",
    variantStyles[variant],
    sizeStyles[size],
    className
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonStyles({ variant, size, className })} {...props} />;
}
