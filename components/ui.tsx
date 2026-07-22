import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ─────────────────────────────────────────────────────────────
   Design-system primitives. Every surface composes from these so
   the whole product shares one visual language.
   ───────────────────────────────────────────────────────────── */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ── Brand mark ─────────────────────────────────────────────── */

export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-ink shadow-sm">
        {/* A simple bell — the front-desk motif. */}
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
          <path
            d="M12 3a5 5 0 0 0-5 5c0 3-1 5-2 6h14c-1-1-2-3-2-6a5 5 0 0 0-5-5Z"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M10 19a2 2 0 0 0 4 0" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </span>
      {withWordmark && (
        <span className="text-[15px] font-bold tracking-tight text-ink">Front&nbsp;Desk</span>
      )}
    </span>
  );
}

/* ── Buttons ────────────────────────────────────────────────── */

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-strong shadow-sm",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-paper",
  ghost: "text-muted hover:bg-paper hover:text-ink",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cx(buttonBase, buttonVariants[variant], buttonSizes[size]);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={cx(buttonClass(variant, size), className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <Link className={cx(buttonClass(variant, size), className)} {...props} />;
}

/* ── Card ───────────────────────────────────────────────────── */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx("rounded-2xl border border-line bg-surface shadow-card", className)}
      {...props}
    />
  );
}

/* ── Status badge ───────────────────────────────────────────── */

type BadgeTone = "neutral" | "accent" | "good" | "warn";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-paper text-muted ring-line-strong",
  accent: "bg-accent-tint text-accent-ink ring-accent/20",
  good: "bg-good-tint text-good ring-good/20",
  warn: "bg-warn-tint text-warn ring-warn/20",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset",
        badgeTones[tone],
      )}
    >
      {children}
    </span>
  );
}

/* ── Page header ────────────────────────────────────────────── */

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-ink text-balance">{title}</h1>
        {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ── Section label ──────────────────────────────────────────── */

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">{children}</h2>
  );
}

/* ── Stat card ──────────────────────────────────────────────── */

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold tabular-nums leading-none text-ink">
        {value}
      </div>
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
    </Card>
  );
}

/* ── Empty state ────────────────────────────────────────────── */

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}

/* ── Form field ─────────────────────────────────────────────── */

export const inputClass =
  "w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-accent";

export function Field({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink">{label}</span>
      {hint && <span className="mb-1.5 block text-xs text-muted">{hint}</span>}
      {children}
    </label>
  );
}

/* ── Avatar (initials) ──────────────────────────────────────── */

export function Avatar({ name, tone = "accent" }: { name: string; tone?: "accent" | "neutral" }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";
  return (
    <span
      className={cx(
        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold",
        tone === "accent" ? "bg-accent-tint text-accent-ink" : "bg-paper text-muted",
      )}
    >
      {initials}
    </span>
  );
}
