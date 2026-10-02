import "server-only";

// Aviso opcional por e-mail ao Gui quando chega uma solicitação nova.
// Só funciona se RESEND_API_KEY, NOTIFY_EMAIL_FROM e NOTIFY_EMAIL_TO estiverem configurados.
// Uma falha aqui nunca impede a reserva de ser criada.
export async function notifyNewBooking(subject: string, text: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_EMAIL_FROM;
  const to = process.env.NOTIFY_EMAIL_TO;
  if (!apiKey || !from || !to) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: to.split(",").map((s) => s.trim()), subject, text }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.error("Falha ao enviar aviso por e-mail", error);
  }
}
