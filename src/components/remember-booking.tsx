"use client";

import { useEffect } from "react";
import { rememberBooking, type SavedBooking } from "@/lib/local";

// Guarda o link desta reserva no aparelho, para o cliente encontrar depois.
export function RememberBooking(props: SavedBooking) {
  const { token, code, pickupAt, service } = props;
  useEffect(() => {
    rememberBooking({ token, code, pickupAt, service });
  }, [token, code, pickupAt, service]);
  return null;
}
