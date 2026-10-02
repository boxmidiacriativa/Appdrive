"use client";

import { useState } from "react";
import { IconCheck, IconCopy } from "./icons";
import { Button } from "./ui";

export function CopyButton({ text, label = "Copiar código Pix" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      full
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2500);
        } catch {
          // navegador sem permissão: o código continua visível para copiar manualmente
        }
      }}
    >
      {copied ? <IconCheck className="h-5 w-5 text-ok" /> : <IconCopy className="h-5 w-5" />}
      {copied ? "Copiado!" : label}
    </Button>
  );
}
