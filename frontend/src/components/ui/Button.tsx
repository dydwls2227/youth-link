"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-brand-fg hover:bg-brand-hover shadow-sm shadow-brand/20 disabled:bg-line-strong disabled:text-muted disabled:shadow-none",
  secondary:
    "bg-surface text-fg border border-line hover:bg-surface-2 hover:border-line-strong disabled:text-muted",
  ghost: "text-muted hover:text-fg hover:bg-surface-2 disabled:text-line-strong",
  danger: "bg-danger-soft text-danger hover:brightness-95 border border-transparent",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-6 text-[15px] rounded-xl gap-2",
};

const BASE =
  "inline-flex select-none items-center justify-center font-medium transition-all duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:active:scale-100";

type CommonProps = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...rest
}: CommonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: CommonProps & { href: string } & React.ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...rest}>
      {children}
    </Link>
  );
}
