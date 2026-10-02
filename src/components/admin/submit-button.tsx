"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "../ui";

// Botão de formulário que mostra "Salvando…" enquanto a ação roda no servidor.
export function SubmitButton({
  children,
  pendingText = "Salvando…",
  confirmText,
  ...props
}: ComponentProps<typeof Button> & { pendingText?: string; confirmText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
      {...props}
    >
      {pending ? pendingText : children}
    </Button>
  );
}
