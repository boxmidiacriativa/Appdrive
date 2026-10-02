"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconHome, IconList, IconSettings, IconTag, IconUsers } from "../icons";
import { cx } from "../ui";

const items = [
  { href: "/admin", label: "Hoje", icon: IconHome },
  { href: "/admin/reservas", label: "Reservas", icon: IconList },
  { href: "/admin/clientes", label: "Clientes", icon: IconUsers },
  { href: "/admin/precos", label: "Preços", icon: IconTag },
  { href: "/admin/ajustes", label: "Ajustes", icon: IconSettings },
];

// Navegação inferior, pensada para o polegar no celular
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="mx-auto grid max-w-2xl grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cx(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                  active ? "text-ink" : "text-muted",
                )}
              >
                <Icon className={cx("h-6 w-6", active && "text-accent")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
