"use client";

import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-line bg-surface", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

type BadgeTone = "neutral" | "brand" | "warn" | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-muted",
  brand: "bg-brand-soft text-brand",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const FIELD =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-fg transition-colors placeholder:text-muted/70 hover:border-line-strong focus:border-brand focus:outline-none disabled:bg-surface-2 disabled:text-muted";

export function Input({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(FIELD, "h-11", className)} {...rest} />;
}

export function Select({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(FIELD, "h-11 cursor-pointer pr-9 appearance-none", className)} {...rest}>
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-fg">{label}</span>
      <div className="relative">{children}</div>
      {error ? (
        <span className="text-[12px] text-danger">{error}</span>
      ) : hint ? (
        <span className="text-[12px] text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-surface-2", className)} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      {icon && <div className="text-muted">{icon}</div>}
      <div className="space-y-1">
        <p className="text-sm font-medium text-fg">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function SectionTitle({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-fg sm:text-2xl">
          {title}
        </h1>
        {description && <p className="text-[13.5px] text-muted">{description}</p>}
      </div>
      {right}
    </div>
  );
}
