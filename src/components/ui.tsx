import type { ComponentProps, ReactNode } from "react";
import type { BookingStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "whatsapp";

const buttonStyles: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink-soft active:bg-ink-soft",
  secondary: "bg-card text-ink border border-line hover:border-ink/30",
  ghost: "text-ink-soft hover:bg-slate-soft",
  danger: "bg-card text-danger border border-danger/30 hover:bg-danger-soft",
  whatsapp: "bg-[#1f8f4e] text-white hover:bg-[#1a7a43]",
};

export function buttonClass(variant: ButtonVariant = "primary", full = false) {
  return cx(
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    buttonStyles[variant],
    full && "w-full",
  );
}

export function Button({
  variant = "primary",
  full,
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; full?: boolean }) {
  return <button className={cx(buttonClass(variant, full), className)} {...props} />;
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-2xl border border-line bg-card", className)} {...props} />;
}

export function Label({ children, htmlFor, hint }: { children: ReactNode; htmlFor?: string; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-sm font-semibold text-ink">
      <span>{children}</span>
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

const fieldClass =
  "w-full min-h-12 rounded-xl border border-line bg-card px-4 text-base text-ink placeholder:text-muted/70 focus:border-ink focus:outline-none";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cx(fieldClass, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cx(fieldClass, "appearance-none bg-card pr-10", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cx(fieldClass, "min-h-24 py-3", className)} {...props} />;
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-danger">{children}</p>;
}

const statusStyles: Record<BookingStatus, string> = {
  requested: "bg-warn-soft text-warn",
  confirmed: "bg-ok-soft text-ok",
  completed: "bg-slate-soft text-ink-soft",
  cancelled: "bg-danger-soft text-danger",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", statusStyles[status])}>
      {STATUS_LABEL[status]}
    </span>
  );
}

export function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <dt className="shrink-0 text-sm text-muted">{label}</dt>
      <dd className="text-right text-[15px] font-medium text-ink">{children}</dd>
    </div>
  );
}

export function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.04 2a9.9 9.9 0 0 0-8.5 15l-1.4 5 5.2-1.4A9.9 9.9 0 1 0 12.04 2Zm0 18.1a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1 1 7 3.9Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.4-.2Z" />
    </svg>
  );
}

export function WhatsAppButton({ href, children, full = true }: { href: string | null; children: ReactNode; full?: boolean }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", full)}>
      <WhatsAppIcon />
      {children}
    </a>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">{children}</p>;
}
