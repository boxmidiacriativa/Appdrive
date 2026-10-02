import { formatHours, formatLongDate, formatMoney, formatTime } from "./format";
import { priceOf, type Booking } from "./types";

// Textos prontos para os botões de WhatsApp.

type BookingLike = Pick<
  Booking,
  "code" | "service_name" | "service_billing" | "origin" | "destination" | "pickup_at" | "hours" | "passengers" | "final_price" | "estimated_price"
>;

function tripLines(b: BookingLike) {
  const lines = [
    `*${b.service_name}* — reserva ${b.code}`,
    `${formatLongDate(b.pickup_at)}, às ${formatTime(b.pickup_at)}`,
    `Saída: ${b.origin}`,
  ];
  if (b.destination) lines.push(`Destino: ${b.destination}`);
  if (b.service_billing === "hourly" && b.hours) lines.push(`Duração: ${formatHours(b.hours)}`);
  lines.push(`Passageiros: ${b.passengers}`);
  return lines;
}

// Cliente -> Gui, logo após solicitar
export function customerToDriverMessage(b: BookingLike, customerName: string, link: string) {
  return [`Olá! Sou ${customerName} e acabei de solicitar uma reserva:`, "", ...tripLines(b), "", `Detalhes: ${link}`].join("\n");
}

// Gui -> cliente, ao confirmar
export function confirmationMessage(b: BookingLike, customerName: string, driverName: string, link: string) {
  const price = priceOf(b);
  return [
    `Olá, ${customerName.split(" ")[0]}! Aqui é o ${driverName}. Sua reserva está *confirmada* ✅`,
    "",
    ...tripLines(b),
    price !== null ? `Valor: ${formatMoney(price)}` : null,
    "",
    `Todos os detalhes e o Pix para pagamento: ${link}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

// Cliente -> Gui, a partir da página da reserva
export function customerQuestionMessage(b: Pick<Booking, "code">) {
  return `Olá! Tenho uma dúvida sobre a minha reserva ${b.code}.`;
}
