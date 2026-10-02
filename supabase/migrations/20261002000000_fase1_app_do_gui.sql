-- Fase 1 — App do Gui
-- Um único motorista (o Gui), reservas solicitadas pelo cliente e confirmadas pelo Gui.
-- Preparado para crescer (vários motoristas, gateway, mapas) sem construir isso agora.
--
-- Segurança: RLS ligado em todas as tabelas. O visitante anônimo só lê serviços e
-- locais ativos. Clientes e reservas são criados/lidos pelo servidor do app (chave
-- secreta, nunca no navegador). Admins autenticados têm acesso total.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Utilitário: updated_at automático
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administradores (o Gui; outros podem ser adicionados depois)
-- ---------------------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Configurações gerais (linha única)
-- ---------------------------------------------------------------------------
create table public.settings (
  id boolean primary key default true check (id),
  business_name text not null default 'Motorista Gui',
  tagline text not null default 'Seu motorista particular, com hora marcada.',
  min_advance_hours integer not null default 2 check (min_advance_hours between 0 and 168),
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

insert into public.settings (id) values (true);

-- ---------------------------------------------------------------------------
-- Motorista. Na fase 1 existe só o Gui (is_default = true).
-- ---------------------------------------------------------------------------
create type public.pix_key_type as enum ('cpf', 'cnpj', 'phone', 'email', 'random');

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text,                -- só dígitos, com DDI (ex.: 5547999999999)
  vehicle text,                 -- ex.: "Toyota Corolla prata"
  plate text,
  pix_key_type public.pix_key_type,
  pix_key text,
  pix_receiver_name text,       -- nome que aparece no Pix (até 25 caracteres)
  pix_city text,                -- cidade do recebedor (até 15 caracteres)
  is_default boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index drivers_one_default on public.drivers (is_default) where is_default;

create trigger drivers_updated_at before update on public.drivers
  for each row execute function public.set_updated_at();

insert into public.drivers (name, is_default) values ('Gui', true);

-- ---------------------------------------------------------------------------
-- Serviços e regras de preço (valores ficam vazios até o Gui definir)
-- ---------------------------------------------------------------------------
create type public.service_billing as enum ('trip', 'hourly');

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  billing public.service_billing not null default 'trip',
  base_fee numeric(10, 2) check (base_fee >= 0),
  price_per_km numeric(10, 2) check (price_per_km >= 0),
  price_per_minute numeric(10, 2) check (price_per_minute >= 0),
  price_per_hour numeric(10, 2) check (price_per_hour >= 0),
  min_hours numeric(4, 1) check (min_hours >= 0),
  minimum_price numeric(10, 2) check (minimum_price >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

insert into public.services (slug, name, description, billing, sort_order) values
  ('transfer', 'Transfer', 'Aeroporto, hotel, pousada e outros destinos.', 'trip', 1),
  ('viagem', 'Viagem particular', 'Deslocamentos agendados, inclusive para outras cidades.', 'trip', 2),
  ('por-periodo', 'Motorista por período', 'O motorista fica à sua disposição pelas horas reservadas.', 'hourly', 3);

-- Locais frequentes (aeroporto, rodoviária, hotéis, pousadas...)
create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger places_updated_at before update on public.places
  for each row execute function public.set_updated_at();

-- Preço fixo entre dois locais frequentes (ex.: Aeroporto -> Pousada X)
create table public.route_prices (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services (id) on delete cascade, -- null = vale para qualquer serviço de trajeto
  origin_place_id uuid not null references public.places (id) on delete cascade,
  destination_place_id uuid not null references public.places (id) on delete cascade,
  price numeric(10, 2) not null check (price >= 0),
  both_directions boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (origin_place_id <> destination_place_id)
);

create trigger route_prices_updated_at before update on public.route_prices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Clientes (reconhecidos pelo telefone)
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,   -- só dígitos, com DDI
  email text,
  notes text,                   -- anotações internas do Gui
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reservas
-- ---------------------------------------------------------------------------
create type public.booking_status as enum ('requested', 'confirmed', 'completed', 'cancelled');
create type public.payment_status as enum ('pending', 'paid');
create type public.price_source as enum ('route', 'distance', 'hourly', 'none');

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                 -- código curto mostrado ao cliente
  access_token text not null unique,         -- segredo do link público da reserva
  customer_id uuid not null references public.customers (id) on delete restrict,
  driver_id uuid references public.drivers (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  service_name text not null,                -- cópia do nome no momento da reserva
  service_billing public.service_billing not null,
  origin text not null,
  origin_place_id uuid references public.places (id) on delete set null,
  destination text,
  destination_place_id uuid references public.places (id) on delete set null,
  pickup_at timestamptz not null,
  hours numeric(4, 1) check (hours > 0),
  passengers integer not null check (passengers between 1 and 50),
  notes text,
  distance_km numeric(8, 2),
  duration_min integer,
  estimated_price numeric(10, 2),
  price_source public.price_source not null default 'none',
  final_price numeric(10, 2) check (final_price >= 0),
  driver_message text,                       -- recado do Gui ao confirmar
  status public.booking_status not null default 'requested',
  payment_method text not null default 'pix',
  payment_status public.payment_status not null default 'pending',
  paid_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_pickup_at_idx on public.bookings (pickup_at);
create index bookings_status_idx on public.bookings (status);
create index bookings_customer_idx on public.bookings (customer_id);

create trigger bookings_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.settings enable row level security;
alter table public.drivers enable row level security;
alter table public.services enable row level security;
alter table public.places enable row level security;
alter table public.route_prices enable row level security;
alter table public.customers enable row level security;
alter table public.bookings enable row level security;

-- Admins: cada admin vê a própria linha; gestão de admins é feita pelo painel do Supabase.
create policy "admins_read_self" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Acesso total para admins
create policy "admin_all_settings" on public.settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_drivers" on public.drivers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_services" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_places" on public.places
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_route_prices" on public.route_prices
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_customers" on public.customers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin_all_bookings" on public.bookings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Leitura pública mínima para montar o formulário de reserva
create policy "public_read_settings" on public.settings
  for select to anon, authenticated using (true);
create policy "public_read_active_services" on public.services
  for select to anon, authenticated using (active);
create policy "public_read_active_places" on public.places
  for select to anon, authenticated using (active);

-- Sem políticas para anon em customers, bookings, drivers e route_prices:
-- o visitante não lê nem grava nada disso diretamente.

-- Permissões explícitas (o RLS acima continua decidindo quais linhas cada um vê)
grant usage on schema public to anon, authenticated, service_role;
grant select on public.settings, public.services, public.places to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant all on all tables in schema public to service_role;
