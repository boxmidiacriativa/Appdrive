"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDate, formatTime } from "@/lib/format";
import { loadBookings, type SavedBooking } from "@/lib/local";
import { IconChevronRight } from "./icons";

// Atalho para as reservas feitas neste aparelho (sem login).
export function MyBookings() {
  const [items, setItems] = useState<SavedBooking[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(loadBookings().slice(0, 3));
  }, []);

  if (!items.length) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-semibold text-muted">Suas reservas neste celular</h2>
      <ul className="space-y-2">
        {items.map((b) => (
          <li key={b.token}>
            <Link
              href={`/reserva/${b.token}`}
              className="flex items-center justify-between rounded-2xl border border-line bg-card px-4 py-3"
            >
              <span>
                <span className="block text-[15px] font-semibold">{b.service}</span>
                <span className="text-sm text-muted">
                  {formatDate(b.pickupAt)} · {formatTime(b.pickupAt)} · {b.code}
                </span>
              </span>
              <IconChevronRight className="h-5 w-5 text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
