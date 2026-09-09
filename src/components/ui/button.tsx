import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "xs" | "sm" | "md" | "lg";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-violet)] text-white shadow-[0_18px_30px_rgba(94,76,214,0.28)] hover:-translate-y-0.5",
  secondary:
    "bg-white/88 text-[var(--ink)] ring-1 ring-[var(--line)] hover:bg-white",
  ghost: "bg-transparent text-[var(--brand-violet-deep)] hover:bg-[var(--brand-soft)]"
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-[26px] px-[10px] text-[10px]",
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
