import { signOut, updateDriver, updateSettings } from "@/app/admin/actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { Card, Input, Label, Select } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { formatPhone } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AjustesPage(props: PageProps<"/admin/ajustes">) {
  const sp = await props.searchParams;
  const { supabase, user } = await requireAdmin();
  const [{ data: settings }, { data: driver }] = await Promise.all([
    supabase.from("settings").select("*").maybeSingle(),
    supabase.from("drivers").select("*").eq("is_default", true).maybeSingle(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      {sp.ok && <p className="rounded-xl bg-ok-soft px-4 py-3 text-sm text-ok">Salvo.</p>}

      {driver && (
        <Card className="p-5">
          <h2 className="text-lg font-bold">Motorista e Pix</h2>
          <p className="mt-1 text-sm text-muted">Aparece para o cliente na reserva confirmada.</p>
          <form action={updateDriver.bind(null, driver.id)} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" defaultValue={driver.name} required />
            </div>
            <div>
              <Label htmlFor="whatsapp" hint="os clientes falam com você por aqui">
                WhatsApp
              </Label>
              <Input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" placeholder="(47) 99999-9999" defaultValue={formatPhone(driver.whatsapp)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="vehicle">Veículo</Label>
                <Input id="vehicle" name="vehicle" placeholder="Corolla prata" defaultValue={driver.vehicle ?? ""} />
              </div>
              <div>
                <Label htmlFor="plate">Placa</Label>
                <Input id="plate" name="plate" placeholder="ABC1D23" defaultValue={driver.plate ?? ""} />
              </div>
            </div>
            <div className="border-t border-line pt-4">
              <p className="mb-3 text-sm font-semibold">Chave Pix para receber</p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pix_key_type">Tipo de chave</Label>
                  <Select id="pix_key_type" name="pix_key_type" defaultValue={driver.pix_key_type ?? ""}>
                    <option value="">Selecione</option>
                    <option value="phone">Celular</option>
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                    <option value="email">E-mail</option>
                    <option value="random">Chave aleatória</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="pix_key">Chave</Label>
                  <Input id="pix_key" name="pix_key" defaultValue={driver.pix_key ?? ""} autoComplete="off" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="pix_receiver_name">Nome no Pix</Label>
                    <Input id="pix_receiver_name" name="pix_receiver_name" maxLength={25} defaultValue={driver.pix_receiver_name ?? ""} />
                  </div>
                  <div>
                    <Label htmlFor="pix_city">Cidade</Label>
                    <Input id="pix_city" name="pix_city" maxLength={15} defaultValue={driver.pix_city ?? ""} />
                  </div>
                </div>
                <p className="text-xs text-muted">
                  Com a chave preenchida, a reserva confirmada mostra ao cliente o QR Code e o Pix copia e cola com o valor. Faça um
                  teste pagando R$ 1 para você mesmo antes de divulgar.
                </p>
              </div>
            </div>
            <SubmitButton full>Salvar motorista</SubmitButton>
          </form>
        </Card>
      )}

      {settings && (
        <Card className="p-5">
          <h2 className="text-lg font-bold">Página de reservas</h2>
          <form action={updateSettings} className="mt-4 space-y-4">
            <div>
              <Label htmlFor="business_name">Nome exibido</Label>
              <Input id="business_name" name="business_name" defaultValue={settings.business_name} required />
            </div>
            <div>
              <Label htmlFor="tagline">Frase de apresentação</Label>
              <Input id="tagline" name="tagline" defaultValue={settings.tagline} />
            </div>
            <div>
              <Label htmlFor="min_advance_hours">Antecedência mínima (horas)</Label>
              <Input id="min_advance_hours" name="min_advance_hours" type="number" min={0} max={168} defaultValue={settings.min_advance_hours} />
            </div>
            <SubmitButton variant="secondary" full>
              Salvar
            </SubmitButton>
          </form>
        </Card>
      )}

      <form action={signOut} className="pt-2">
        <p className="mb-2 text-center text-xs text-muted">Conectado como {user.email}</p>
        <SubmitButton variant="ghost" full pendingText="Saindo…">
          Sair do painel
        </SubmitButton>
      </form>
    </div>
  );
}
