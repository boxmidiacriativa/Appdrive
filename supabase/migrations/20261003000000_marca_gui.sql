-- Marca do app: "Gui — Meu motorista".
-- Atualiza os padrões e a linha de configurações só se ainda estiver com os textos provisórios
-- (não sobrescreve nada que o Gui já tenha personalizado no painel).

alter table public.settings alter column business_name set default 'Gui';
alter table public.settings alter column tagline set default 'Meu motorista';

update public.settings
set business_name = 'Gui'
where business_name = 'Motorista Gui';

update public.settings
set tagline = 'Meu motorista'
where tagline = 'Seu motorista particular, com hora marcada.';
