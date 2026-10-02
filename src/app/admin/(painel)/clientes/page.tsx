import Link from "next/link";
import { IconChevronRight } from "@/components/icons";
import { buttonClass, EmptyState, Input } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatPhone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientesPage(props: PageProps<"/admin/clientes">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 60) : "";
  const { supabase } = await requireAdmin();

  let query = supabase
    .from("customers")
    .select("id, name, phone, email, bookings(count)")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (q) {
    const safe = q.replace(/[,()%*\\]/g, " ");
    const digits = q.replace(/\D/g, "");
    query = digits.length >= 3 ? query.or(`name.ilike.%${safe}%,phone.ilike.%${digits}%`) : query.ilike("name", `%${safe}%`);
  }
  const { data: customers } = await query;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Clientes</h1>

      <form className="flex gap-2">
        <Input name="q" defaultValue={q} placeholder="Buscar por nome ou telefone" type="search" />
        <button className={buttonClass("secondary")}>Buscar</button>
      </form>

      {customers?.length ? (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
          {customers.map((c) => {
            const count = (c.bookings as unknown as { count: number }[])?.[0]?.count ?? 0;
            return (
              <li key={c.id}>
                <Link href={`/admin/clientes/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5">
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-semibold">{c.name}</span>
                    <span className="text-sm text-muted">{formatPhone(c.phone)}</span>
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted">
                    {count} {count === 1 ? "reserva" : "reservas"}
                    <IconChevronRight className="h-5 w-5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState>{q ? "Nenhum cliente encontrado." : "Os clientes aparecem aqui quando fazem a primeira reserva."}</EmptyState>
      )}
    </div>
  );
}
