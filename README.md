# App do Gui — reserva de motorista particular

**Fase 1:** ferramenta do próprio Gui. O cliente reserva pelo celular em menos de 1 minuto, o Gui confirma no painel e o cliente recebe a confirmação, com o Pix e o WhatsApp do motorista.

Não é marketplace nem app de corrida imediata. A estrutura já está pronta para receber outros motoristas, gateway de pagamento e mapas na fase 2, mas nada disso foi construído agora.

## O que o app faz

**Cliente** (`/`)
1. Escolhe o serviço: Transfer, Viagem particular ou Motorista por período.
2. Informa origem, destino, data, horário e passageiros (e as horas, no serviço por período).
3. Vê o resumo com o **valor estimado**. Se não houver preço configurado para aquele caso, aparece "a confirmar pelo motorista".
4. Informa nome, WhatsApp, e-mail (opcional) e observações, e toca em **Solicitar reserva**.
5. Recebe um link próprio da reserva (`/reserva/<código secreto>`):
   - **Solicitação enviada:** a página se atualiza sozinha e tem o botão "Falar pelo WhatsApp".
   - **Reserva confirmada:** mostra motorista, veículo, placa, data, horário, trajeto, valor, recado do Gui e o **Pix** (QR Code + copia e cola, já com o valor).
   - **Concluída / Cancelada.**

O cliente é reconhecido pelo telefone. O celular dele lembra o nome e as últimas reservas, e ele não precisa de senha.

**Painel do Gui** (`/admin`)
- **Hoje:** solicitações aguardando confirmação, reservas do dia e próximas reservas confirmadas.
- **Reservas:** próximas e anteriores, com filtro por status.
- **Detalhe da reserva:**
  - confirmar e ajustar o valor final;
  - deixar um recado para o cliente;
  - enviar a confirmação pelo WhatsApp com mensagem pronta;
  - marcar como concluída ou cancelada, ou mudar o status manualmente;
  - marcar o Pix como recebido.
- **Clientes:** busca, histórico de reservas, total em viagens e anotações internas.
- **Preços:**
  - valores por serviço: tarifa base, por km, por minuto, por hora, mínimo de horas e valor mínimo;
  - locais frequentes (aeroporto, hotéis, pousadas);
  - preço fixo por rota.
- **Ajustes:** dados do motorista, WhatsApp, veículo, chave Pix, nome exibido e antecedência mínima.

### Como o preço é calculado
Sem tarifa dinâmica. Para o mesmo pedido, o valor é sempre o mesmo (`src/lib/pricing.ts`). A regra usada é a primeira que se aplica:
1. **Rota fixa:** os dois locais estão cadastrados como frequentes e há preço para essa rota.
2. **Por hora:** serviço por período, `tarifa base + horas × valor/hora`, respeitando o mínimo de horas.
3. **Por distância:** `tarifa base + km × valor/km + min × valor/minuto`. **Só passa a valer quando os mapas forem ligados** (`src/lib/maps.ts`).
4. Se nenhuma regra se aplica, aparece **"a confirmar"** e o Gui informa o valor ao confirmar.

Nenhum preço vem preenchido. O Gui define tudo no painel.

## Tecnologia

| Parte | Escolha |
|---|---|
| App (cliente e painel) | Next.js 16 (App Router) + TypeScript + Tailwind, mobile-first |
| Banco e login do painel | Supabase (PostgreSQL + Auth), com RLS em todas as tabelas |
| Pagamento | Pix copia e cola gerado a partir da chave do Gui (padrão BR Code do Banco Central). Sem gateway e sem taxa; a conferência é manual |
| WhatsApp | Links `wa.me` com mensagens prontas. Sem API paga e sem chat interno |
| Aviso de nova reserva | Botão de WhatsApp do cliente para o Gui + e-mail opcional (Resend) |
| Mapas | Preparado em `src/lib/maps.ts`, ainda desligado |

### Segurança
- O visitante anônimo **não lê nem grava** clientes, reservas, motorista ou rotas direto no banco (RLS). Ele só consegue:
  - criar uma reserva por uma ação do servidor, que valida tudo e recalcula o preço;
  - ver **a própria** reserva pelo link secreto (32 caracteres aleatórios, página com `noindex` e sem referrer).
- A chave secreta do Supabase só existe no servidor e não vai para o navegador (conferido no build).
- Toda página e ação do painel chama `requireAdmin()`. Admins ficam na tabela `admins` e o banco confere `is_admin()` em cada operação.
- O cadastro público de usuários fica **desligado**: o login do painel é criado manualmente.

## Colocar no ar (passo a passo)

1. **Supabase:** crie um projeto em supabase.com (região São Paulo).
   - Em *SQL Editor*, rode o arquivo `supabase/migrations/20261002000000_fase1_app_do_gui.sql`. Outra opção é usar `npx supabase link` e depois `npx supabase db push`.
   - Em *Authentication → Sign In / Providers*, **desligue "Allow new users to sign up"**.
   - Em *Authentication → Users*, crie o usuário do Gui (e-mail e senha).
   - Torne esse usuário admin, no SQL Editor:
     ```sql
     insert into public.admins (user_id)
     select id from auth.users where email = 'email-do-gui@exemplo.com';
     ```
2. **Vercel:** importe o repositório e configure as variáveis do arquivo `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY` (**secreta**)
   - `NEXT_PUBLIC_SITE_URL` (o domínio final)
3. Entre em `/admin` e, em **Ajustes**, preencha WhatsApp, veículo e chave Pix. **Teste o Pix pagando R$ 1 a si mesmo.**
4. Em **Preços**, cadastre os locais frequentes, as rotas mais comuns e o valor por hora.
5. Faça uma reserva de teste pelo celular, confirme no painel e confira o que o cliente vê.

## Desenvolvimento local

```bash
npm install
cp .env.example .env.local      # preencha com as chaves do Supabase local ou de teste
npx supabase start              # banco local (Docker); aplica migração e seed
npm run dev                     # http://localhost:3000  — painel em /admin
```
O seed local cria o admin `gui@exemplo.com` / `senha-local-123`. Use **só** localmente.

Verificações: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.

## Fora do escopo da fase 1 (de propósito)
App nativo, corrida imediata, GPS e rastreamento, chat interno, despacho automático, vários motoristas, gateway de pagamento, carteira, cupons, assinatura, indicação, várias cidades, BI e conta corporativa.

## Caminho para a fase 2 (quando a operação estiver validada)
- **Outros motoristas:** a tabela `drivers` e `bookings.driver_id` já existem. Falta a tela de cadastro de motoristas e a atribuição.
- **Gateway:** os campos `payment_method`, `payment_status` e `paid_at` já existem em `bookings`. Com um gateway, um webhook passa a marcar o pagamento sozinho.
- **Mapas:** implementar `estimateRoute()` em `src/lib/maps.ts`. O cálculo por km e minuto passa a valer sem mudar o resto.
- **Mais serviços:** basta inserir linhas na tabela `services`.
