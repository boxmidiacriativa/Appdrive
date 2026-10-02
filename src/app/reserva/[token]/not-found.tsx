import Link from "next/link";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-16 text-center">
      <h1 className="text-2xl font-bold">Reserva não encontrada</h1>
      <p className="mt-2 text-muted">Confira se o link está completo ou fale com o motorista pelo WhatsApp.</p>
      <Link href="/" className={`${buttonClass("primary")} mt-8`}>
        Fazer uma reserva
      </Link>
    </main>
  );
}
