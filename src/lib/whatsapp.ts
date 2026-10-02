// Comunicação pelo WhatsApp que o Gui já usa: só links wa.me com mensagem pronta.
// Sem API paga, sem chat interno.

export function whatsappLink(phoneDigits: string | null | undefined, text: string): string | null {
  if (!phoneDigits) return null;
  const digits = phoneDigits.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
