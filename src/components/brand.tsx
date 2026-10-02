import { BRAND } from "@/lib/brand";
import { cx } from "./ui";

// Logotipo: "Gui" em peso forte, com o ponto bronze, e a assinatura "Meu motorista".
export function Logo({
  name = BRAND.name,
  tagline = BRAND.tagline,
  size = "md",
  className,
}: {
  name?: string;
  tagline?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const nameSize = { sm: "text-2xl", md: "text-[34px]", lg: "text-5xl" }[size];
  return (
    <span className={cx("inline-flex flex-col leading-none", className)}>
      <span className={cx("font-extrabold tracking-tight text-ink", nameSize)}>
        {name}
        <span className="text-accent">.</span>
      </span>
      {tagline && (
        <span className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-accent">{tagline}</span>
      )}
    </span>
  );
}
