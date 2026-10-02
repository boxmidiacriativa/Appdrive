# Marca — Gui · Meu motorista

## Nome e assinatura
- **Marca:** Gui
- **Assinatura:** Meu motorista
- Escrita: sempre **Gui**, com G maiúsculo e o resto minúsculo. No logotipo, o nome leva um ponto bronze: **Gui.**

## Conceito
O nome vira parte do dia a dia: chamar o Gui é como chamar o seu motorista de confiança.
"Meu motorista" reforça a relação pessoal (o mesmo motorista, com hora marcada) e não uma corrida qualquer.

## Jeito de falar
Frases curtas, próximas, no tom de quem indica para um amigo:

- **Vai de Gui.**
- **Usa o Gui.**
- **Já tem o Gui?**
- **Baixa o Gui.**
- **Eu uso o Gui.**

Evitar jargão de aplicativo de corrida ("corrida", "tarifa dinâmica", "parceiro"). Preferir "reserva", "viagem", "transfer", "motorista".

## Cores
| Uso | Cor | Hex |
|---|---|---|
| Principal (textos, botões, fundo do ícone) | Azul-noite | `#12192b` |
| Destaque (ponto do logo, assinatura, ícones) | Bronze | `#a87a35` (claro: `#c99a52`) |
| Fundo | Papel | `#f6f4ef` |

## Tipografia
Manrope: ExtraBold no nome, Bold nos títulos e Regular/Medium nos textos.

## Ícone do app
Quadrado azul-noite com cantos arredondados e "G" branco com ponto bronze (`src/app/icon.svg`). Na tela do iPhone: "Gui." (`src/app/apple-icon.tsx`).

## "Baixa o Gui" sem loja de apps
Na fase 1, o Gui é um app web que pode ser salvo na tela inicial do celular (PWA):
- **Android:** o próprio app mostra o botão "Baixar o Gui".
- **iPhone:** Compartilhar → Adicionar à Tela de Início.

Abre em tela cheia, com ícone e nome "Gui", como um aplicativo.

## Antes de divulgar
- Conferir se o domínio (ex.: `vaidegui.com.br`, `usaogui.com.br`) está livre no registro.br.
- Conferir se o @ está livre nas redes sociais.
- Pesquisar a marca "Gui" na classe de transporte no INPI. Nomes curtos costumam ter conflitos, e o registro protege o investimento na fase 2.

Onde fica no código: `src/lib/brand.ts` (nome, assinatura, frases e cores) e `src/components/brand.tsx` (logotipo).
