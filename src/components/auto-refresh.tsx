"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Atualiza a página periodicamente (ex.: enquanto a reserva aguarda confirmação).
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => window.clearInterval(id);
  }, [router, seconds]);
  return null;
}
