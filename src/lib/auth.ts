import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "./supabase/server";

// Garante que quem chama é um administrador. Usar em TODA página e ação do painel.
export async function requireAdmin() {
  const supabase = await createSessionClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/login?erro=sem-permissao");

  return { supabase, user: userData.user };
}
