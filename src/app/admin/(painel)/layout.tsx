import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false },
};

export default async function PainelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="flex-1 pb-24">
      <div className="mx-auto w-full max-w-2xl px-4 pt-6">{children}</div>
      <AdminNav />
    </div>
  );
}
