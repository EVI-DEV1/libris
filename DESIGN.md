---
name: Libris
description: Sistema visual do balcão de biblioteca — campo colorido, cartas brancas flutuando, uma cor que manda.
colors:
  tinta: "#0d1526"
  tinta-2: "#4a5568"
  tinta-3: "#616c84"
  tinta-campo: "#2f394c"
  papel: "#ffffff"
  campo: "#f4f7fb"
  campo-2: "#e6ebf4"
  linha: "#dbe2ee"
  campo-a: "#8fe0fe"
  campo-b: "#e69cb6"
  g-a: "#16bffd"
  g-b: "#cb3066"
  g-a-forte: "#0f7ea7"
  g-b-forte: "#cb3066"
  acao: "#0e769d"
  acao-escura: "#0b607f"
  acao-fraca: "#e8f9ff"
  acao-tinta: "#0e769d"
  vinho-fraca: "#faeaf0"
  vinho-tinta: "#7e1e3f"
  ok: "#0f7b52"
  ok-fraca: "#e7f6ef"
  alerta: "#b45309"
  alerta-fraca: "#fef3e2"
  trava: "#c02638"
  trava-fraca: "#fdeef0"
typography:
  display:
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "clamp(24px, 3vw, 32px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.021em"
  headline:
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "19px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.021em"
  title:
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 800
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  body-sub:
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Manrope, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.04em"
  codigo:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Code, monospace"
    fontSize: "13px"
    fontWeight: 500
    letterSpacing: "-0.02em"
    fontFeature: "tabular-nums"
  comando:
    fontFamily: "JetBrains Mono, ui-monospace, Cascadia Code, monospace"
    fontSize: "20px"
    fontWeight: 500
    letterSpacing: "0.02em"
rounded:
  foco: "4px"
  interno: "9px"
  md: "10px"
  lg: "16px"
  caixa: "20px"
  pilula: "999px"
spacing:
  u: "4px"
  u2: "8px"
  u3: "12px"
  u4: "16px"
  u5: "20px"
  u6: "24px"
  u8: "32px"
  u12: "48px"
components:
  btn-acao:
    backgroundColor: "linear-gradient(115deg, {colors.g-a-forte}, {colors.g-b-forte})"
    textColor: "{colors.papel}"
    rounded: "{rounded.md}"
    padding: "11px 18px"
    typography: "{typography.title}"
  btn-suave:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "11px 18px"
  btn-fantasma:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.md}"
    padding: "11px 18px"
  btn-trava:
    backgroundColor: "{colors.trava-fraca}"
    textColor: "{colors.trava}"
    rounded: "{rounded.md}"
    padding: "11px 18px"
  carta:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.lg}"
    padding: "20px"
  campo:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "11px 14px"
    typography: "{typography.body}"
  campo-grande:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "14px 14px 14px 44px"
    typography: "{typography.comando}"
  selo-ok:
    backgroundColor: "{colors.ok-fraca}"
    textColor: "{colors.ok}"
    rounded: "{rounded.pilula}"
    padding: "5px 10px"
  selo-neutro:
    backgroundColor: "{colors.campo-2}"
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.pilula}"
    padding: "5px 10px"
  selo-espera:
    backgroundColor: "{colors.acao-fraca}"
    textColor: "{colors.acao-tinta}"
    rounded: "{rounded.pilula}"
    padding: "5px 10px"
  selo-alerta:
    backgroundColor: "{colors.alerta-fraca}"
    textColor: "{colors.alerta}"
    rounded: "{rounded.pilula}"
    padding: "5px 10px"
  selo-trava:
    backgroundColor: "{colors.trava-fraca}"
    textColor: "{colors.trava}"
    rounded: "{rounded.pilula}"
    padding: "5px 10px"
  item-trilho:
    backgroundColor: "transparent"
    textColor: "{colors.tinta-2}"
    rounded: "{rounded.md}"
    padding: "11px 12px"
  item-trilho-ativo:
    backgroundColor: "{colors.acao-fraca}"
    textColor: "{colors.acao-tinta}"
    rounded: "{rounded.md}"
    padding: "11px 12px"
  recado-ok:
    backgroundColor: "{colors.ok-fraca}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  recado-trava:
    backgroundColor: "{colors.trava-fraca}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
  recado-aviso:
    backgroundColor: "{colors.alerta-fraca}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.md}"
    padding: "14px 16px"
---

# Design System: Libris

## Overview

**Creative North Star: "O balcão iluminado"**

A tela é um balcão de atendimento, não um painel de métricas. O funcionário tem o livro na mão, lê o código de tombo, e a tela responde com a única ação que aquele exemplar aceita agora — e, quando recusa, diz o motivo em português, na mesma caixa em que diria "feito". Tudo o que o sistema mostra existe para sustentar esse gesto: o campo de tombo é a peça mais alta e mais larga da tela, a ficha do exemplar nasce dele, e a lista do que está fora da estante fica abaixo, linha a linha.

O mundo é feito de duas camadas. Embaixo, o campo da página inteiro: o gradiente Transfile do uiGradients diluído em 52% de branco, fixo, colorido de canto a canto. Em cima, cartas brancas de canto arredondado que flutuam sobre ele com sombra de deslocamento **e** desfoque. A cor forte não é polvilhada em detalhezinho — ela ocupa região: o selo da marca, o botão da ação primária, a barra do item ativo no trilho, o fundo da entrada. Legibilidade não é gosto aqui: é tela de turno de oito horas, e todo par texto/fundo do sistema foi medido em contraste antes de entrar.

Esta identidade substituiu, por decisão explícita do usuário, um mundo anterior de quatro verdes chapados com tipo bitmap e ícones de 8×8 px. Ele o rejeitou nas palavras dele: velho e sem vida. Esse mundo é a anti-referência confirmada — não existe mais no código e não volta.

**Key Characteristics:**
- Campo colorido de página inteira, cartas brancas em camadas por cima.
- Uma cor que manda, sempre em região cheia, nunca em detalhe decorativo.
- Três sinais de significado único: ok, alerta, trava. Nenhum quarto.
- Manrope no texto; JetBrains Mono só onde há código que se casa com uma etiqueta física.
- Contraste medido, não estimado; nenhum par abaixo de 4.5:1.
- Movimento de saída exponencial, curto, a partir de um estado já visível.

## Colors

Uma paleta de duas pontas — ciano e vinho — sobre neutros levemente frios, com três sinais de trabalho que não disputam matiz com ela.

### Primary
- **Ciano Transfile** (`g-a`): a ponta crua do gradiente escolhido pelo usuário. Só entra onde não há texto por cima: o halo do pulso, o anel de foco do campo, superfície decorativa.
- **Ciano Forte** (`g-a-forte`): o ciano escurecido até o ponto exato em que branco sobre ele passa (4.60:1), nem um grau além. É a ponta que aparece em toda peça de marca com texto ou ícone branco: selo do trilho, selo da entrada, botão de ação, barra do item ativo.
- **Vinho Transfile** (`g-b`, idêntico a `g-b-forte`): a outra ponta. Fica **crua** também na versão forte, porque branco sobre ela já dá 5.06:1 — escurecê-la só mataria o brilho que fez a paleta ser escolhida.
- **Ação Sólida** (`acao`): o sólido derivado da ponta ciano, para o que gradiente não resolve — texto de link, borda de campo focado, contorno de foco, dígito que acabou de mudar no contador.

### Secondary
- **Ciano Diluído** (`acao-fraca`) com **Tinta de Ação** (`acao-tinta`): o par de repouso da cor primária. Fundo do item ativo do trilho, hover de linha clicável, topo da ficha do exemplar, selo de "separado".
- **Vinho Diluído** (`vinho-fraca`) com **Tinta Vinho** (`vinho-tinta`): reservado à porta da direção. É a única região do sistema em que a ponta vinho aparece chapada, e é assim que as duas portas não se confundem.

### Tertiary
- **Campo Claro** (`campo-a`) e **Campo Rosa** (`campo-b`): as duas pontas já diluídas em 52% de branco que compõem o fundo da página (`linear-gradient(145deg, campo-a 0%, #bbbeda 48%, campo-b 100%)`, fixo). Não use estes valores em nada além do campo.

### Neutral
- **Tinta** (`tinta`): texto principal sobre papel — 16.1:1.
- **Tinta Secundária** (`tinta-2`): dado de apoio sobre papel — 7.4:1.
- **Tinta Terciária** (`tinta-3`): rótulos, placeholders, ícones de moldura — 5.27:1 no branco.
- **Tinta de Campo** (`tinta-campo`): existe por medição. Texto apoiado **direto** no campo colorido usa esta e só esta — 5.41:1 no pior ponto; a secundária comum cairia para 3.7:1 sobre a ponta rosa.
- **Papel** (`papel`): superfície de toda carta, trilho e campo de entrada. Branco puro, para a carta ganhar relevo sozinha sobre o campo frio.
- **Campo Neutro** (`campo`) e **Campo Neutro 2** (`campo-2`): hover de linha, faixas de fatos, esqueleto de carregamento, avatar.
- **Linha** (`linha`): a única divisória e a única borda de superfície.

### Sinais
- **OK** (`ok` / `ok-fraca`): liberado, na estante, no prazo — 4.8:1 sobre papel.
- **Alerta** (`alerta` / `alerta-fraca`): atenção sem bloqueio — vence hoje, em manutenção, prazo curto — 4.6:1.
- **Trava** (`trava` / `trava-fraca`): o que impede o atendimento — em atraso, perdido, recusa do servidor — 6.0:1.

### Named Rules
**A Regra da Região.** A cor forte ocupa região inteira ou não aparece: selo, botão, barra do ativo, fundo de entrada. Nada de fiozinho, borda decorativa ou ícone tingido "para animar".

**A Regra dos Três Sinais.** Existem exatamente três sinais — ok, alerta, trava — e cada um significa uma coisa só. Um quarto sinal não se inventa; se um estado novo aparece, ele se encaixa em um dos três ou vira neutro.

**A Regra da Medição.** Nenhum par texto/fundo entra sem contraste calculado e anotado ao lado do valor. Um número não medido não é uma decisão.

**A Regra da Ponta Certa.** Onde houver texto ou ícone branco por cima, use a versão forte do gradiente. O cru fica para superfície sem texto.

## Typography

**Display / Body Font:** Manrope (400–800 variável, servida do próprio domínio)
**Mono Font:** JetBrains Mono (400–700, servida do próprio domínio)

**Character:** Manrope é uma grotesca geométrica de altura de x generosa e peso 800 disponível — firme sem ser dura, atual sem moda. JetBrains Mono entra só quando o texto na tela é o mesmo texto colado no livro: o par diz "isto é dado do sistema" contra "isto é o código físico na sua mão".

### Hierarchy
- **Display** (800, `clamp(24px, 3vw, 32px)`, 1.15, -0.021em): título da tarefa aberta e título da caixa de entrada. Um por tela.
- **Headline** (800, 19–22px, 1.3): título da ficha do exemplar e cabeçalho de seção maior.
- **Title** (800, 15px, -0.01em): cabeçalho de carta, ao lado do ícone de 18px.
- **Body** (400, 15px, 1.55): texto corrido; prosa limitada a 68ch.
- **Body Sub** (400, 13.5px): dado secundário — nome do leitor, data, dica de campo. Nunca abaixo de 4.5:1.
- **Label** (700, 12px, +0.04em, caixa alta): nomeia o campo ao lado. **Nunca carrega dado.**
- **Código** (mono 500, 13px, -0.02em, tabular): tombo, ISBN, qualquer coisa que se casa com uma etiqueta.
- **Comando** (mono 500, 20px, +0.02em): o campo de leitura de tombo. É o único campo grande do sistema.

### Named Rules
**A Regra da Mono Curta.** JetBrains Mono só onde há código de tombo, ISBN ou data alinhada em coluna. Prosa em mono é proibida — inclusive em rótulo, botão e recado.

**A Regra do Rótulo Vazio.** A caixa alta espaçada pertence ao rótulo que nomeia um campo. Rótulo nunca carrega valor, e nenhum dado sobe para caixa alta.

**A Regra do Número que Não Pula.** Todo número que muda no lugar usa `tabular-nums` e casas fixas, para a linha não se mexer quando o valor troca.

## Layout

Grade de 4px (`--u`); todo espaçamento é múltiplo dela, escrito como `calc(var(--u) * n)`. Os passos realmente usados são 4, 8, 12, 16, 20, 24, 32, 36, 48 e 56 px.

O casco é de duas colunas: trilho fixo de 248px à esquerda, palco à direita, ambos sobre o campo fixo. O palco tem largura máxima de 1180px e respiro de 32px nas laterais, 56px embaixo. O trilho é `sticky`, ocupa `100dvh` e carrega, de cima para baixo: marca, áreas do papel, e o rodapé de quem está logado com a saída.

Dentro do palco, o ritmo vertical entre blocos é 24px. Grades internas de cartas e fatos usam `repeat(auto-fit, minmax(150–240px, 1fr))` com 16–20px de intervalo — a densidade cresce com a tela sem quebra manual.

O corte responsivo é único, em **980px**: o casco vira uma coluna, o trilho vira faixa horizontal no topo com borda inferior, e a barra do item ativo gira do lado esquerdo (`inset 3px 0 0`) para a base (`inset 0 -3px 0`). Abaixo do corte, o respiro do palco cai para 20/16px.

As telas de entrada (login e troca de senha forçada) fogem do casco: caixa única de 410px, centralizada no campo, canto de 20px e a sombra mais alta do sistema.

## Elevation & Depth

O sistema é **em camadas, nunca chapado**. Profundidade vem de duas coisas juntas e sempre juntas: deslocamento **e** desfoque. Bloco duro deslocado não existe aqui. A hierarquia é curta de propósito — três degraus neutros e um degrau colorido —, e a leitura é: quanto mais alto o objeto, mais raro ele é.

### Shadow Vocabulary
- **Repouso** (`box-shadow: 0 1px 2px rgba(13,21,38,.06), 0 1px 3px rgba(13,21,38,.04)`): toda carta, todo campo em repouso, todo botão suave. O padrão.
- **Peça principal** (`box-shadow: 0 2px 4px rgba(13,21,38,.05), 0 8px 20px -6px rgba(13,21,38,.12)`): a caixa de comando do balcão. Uma por tela.
- **Flutuante** (`box-shadow: 0 4px 8px rgba(13,21,38,.06), 0 20px 40px -12px rgba(13,21,38,.2)`): só as caixas de entrada isoladas no campo.
- **Ação** (`box-shadow: 0 2px 4px rgba(15,126,167,.22), 0 12px 28px -8px rgba(203,48,102,.45)`): a sombra colorida, feita das duas pontas do gradiente. Pertence exclusivamente às peças que carregam o gradiente forte — selo da marca e botão de ação.
- **Foco de campo** (`box-shadow: 0 0 0 4px rgba(22,191,253,.2)`): anel do campo focado, substituindo a sombra de repouso.
- **Barra do ativo** (`box-shadow: inset 3px 0 0 var(--g-a-forte)`): não é sombra, é a única marca sólida — a borda do item ativo do trilho.

### Named Rules
**A Regra do Desfoque Obrigatório.** Toda sombra tem deslocamento e desfoque. Sombra dura de deslocamento seco não pertence a este mundo.

**A Regra da Sombra Colorida.** A sombra de ação só acompanha superfície de gradiente forte. Carta branca nunca recebe sombra colorida.

## Shapes

Cantos arredondados em cinco degraus, cada um com um dono: 9px para a peça dentro de outra peça (aba, avatar quadrado), 10px (`--r`) para o botão, o campo, o recado e o item do trilho, 16px (`--r-g`) para a carta e a moldura de vazio, 20px para a caixa de entrada isolada, e pílula (999px) para o selo de estado.

Bordas são de 1px e de uma cor só (`linha`); o campo focado troca essa borda pela ação e ganha o anel. Superfície branca sobre campo colorido sempre tem borda **e** sombra — a borda define, a sombra levanta.

Os ícones são desenhados dentro do sistema: grade de 24, traço 1.75, ponta e junta arredondadas, todos no mesmo peso, renderizados em 15–26px conforme o lugar. Nenhum emoji, nenhum glifo Unicode, nenhum pacote de ícones fazendo as vezes de ícone.

**A Regra do Traço Único.** Ícone novo se desenha na grade de 24 com traço 1.75 e `currentColor`. Preenchimento só onde a forma exige (o ponto do alerta, o marcador redondo).

## Components

### Buttons
- **Shape:** canto de 10px (`--r`), altura por padding (11px 18px no médio, 8px 12px no pequeno), peso 700, 14px.
- **Ação (primária):** gradiente forte a 115°, texto branco, sombra de ação. É a **única superfície de gradiente cheio da tela** e há no máximo uma por bloco.
- **Suave:** papel, tinta principal, borda `linha`, sombra de repouso. O padrão para ação secundária.
- **Fantasma:** transparente, tinta secundária, sem borda. Para "limpar", "cancelar", "voltar".
- **Trava:** fundo `trava-fraca` sobre tinta `trava`. Só para a ação que destrói ou bloqueia.
- **Estados:** transição de 0.18s na saída exponencial; `:active` afunda 1px e encolhe 0.5%; desabilitado cai para 50% de opacidade e perde a sombra; carregando troca o ícone por um anel girando de 14px em `currentColor`.

### Cards / Containers (Carta)
- **Corner Style:** 16px.
- **Background:** papel, sobre o campo colorido.
- **Border:** 1px `linha`.
- **Shadow Strategy:** sombra de repouso (ver Elevation & Depth).
- **Internal Padding:** 20px no corpo; cabeçalho de 16px/20px separado por divisória de 1px, com ícone de 18px em tinta terciária, título de 15px e uma área à direita reservada a selo ou contagem.

### Inputs / Fields (Campo)
- **Style:** papel, borda `linha` de 1px, canto de 10px, rótulo em caixa alta acima, dica de 13.5px abaixo. Ícone opcional ancorado à esquerda, com o texto recuado para 44px.
- **Focus:** a borda vira `acao`, o ícone acompanha, e a sombra de repouso é substituída pelo anel ciano de 4px. Nunca o contorno padrão do navegador.
- **Grande:** a variante de comando — mono de 20px, padding vertical de 14px, ícone de 20px. Reservada ao campo de tombo.

### Chips (Selo — etiqueta de estado)
- **Style:** pílula, 12.5px peso 700, par fundo-fraco/tinta-forte do tom, ponto opcional de 6px em `currentColor`.
- **State:** cinco tons — ok, neutro, espera, alerta, trava. O mapa do estado do exemplar é fixo: na estante → ok; emprestado → neutro; separado → espera; em manutenção → alerta; perdido → trava.

### Navigation (Trilho)
- **Style:** papel, 248px, borda direita de 1px, colado no topo. Marca no alto (selo de 38px em gradiente forte, canto de 11px, sombra de ação), áreas no meio, quem está logado no pé, separado por divisória.
- **Item:** 14px peso 600, ícone de 18px, canto de 10px, tinta secundária.
- **Hover:** fundo `campo`, tinta principal.
- **Ativo:** região inteira em `acao-fraca` com tinta de ação e barra sólida de 3px em ciano forte na borda de ataque. Estado por região, não por marquinha.
- **Mobile (≤980px):** o trilho vira faixa horizontal no topo e a barra do ativo migra para a base do item.

### Recado (mensagem de resultado)
A recusa ganha a mesma caixa que o sucesso. Canto de 10px, fundo do tom fraco, tinta principal no texto (não a tinta do tom — o texto se lê, a cor sinaliza), ícone de 19px na cor do tom, botão de fechar opcional em tinta terciária. Entra com a animação de surgimento. `role="alert"` na trava, `role="status"` nos demais. **O texto é a frase que o servidor devolveu; a tela não reescreve regra de negócio.**

### Contador
Assinatura do sistema: cada dígito mora numa célula de largura fixa (`0.62em`) que não se move, e só a célula que mudou acende em `acao` e sobe 1px por 420ms. O número nunca é redesenhado inteiro.

### Vazio e Carregando
Vazio é uma moldura de 52px em `campo-2` com ícone de 24px e uma frase de até 34ch — não há ilustração de estado vazio neste sistema. Carregando é o esqueleto no formato da resposta: barras de 56px em gradiente deslizante de 1.3s, para a tela não pular quando o dado chega.

### Movimento
- **Curva única:** `cubic-bezier(0.16, 1, 0.3, 1)` — saída exponencial, rápida no começo, assenta devagar.
- **Surgimento** (0.4s): entrada de tela e de recado. Um momento autoral, não um efeito por seção.
- **Pulso** (0.7s): halo ciano que se expande 14px uma vez, só no que **acabou** de mudar de estado no servidor.
- **Toque** (0.18s): transição de transform, sombra e cor em tudo que se clica.
- `prefers-reduced-motion` desliga tudo para 0.01ms.

**A Regra do Estado Já Visível.** Animação parte de algo que já está na tela e responde ao toque. Nada aparece do nada para fazer número.

## Do's and Don'ts

### Do:
- **Do** medir e anotar o contraste ao lado de todo par texto/fundo novo, como o resto do `global.css` faz.
- **Do** usar `tinta-campo` para qualquer texto apoiado direto no campo colorido — a tinta secundária comum não passa sobre a ponta rosa.
- **Do** usar a versão forte do gradiente sob texto ou ícone branco, e o gradiente cru só em superfície sem texto.
- **Do** dar à ação primária uma superfície de gradiente cheio por bloco, e às demais o botão suave.
- **Do** escrever todo espaçamento como múltiplo de `--u` (4px).
- **Do** mostrar a recusa do servidor na mesma caixa que o sucesso, com a frase que ele mandou.
- **Do** desenhar ícone novo na grade de 24 com traço 1.75 e `currentColor`.
- **Do** manter o esqueleto no formato da resposta que vem, para a tela não pular.

### Don't:
- **Don't** inventar um quarto sinal. Ok, alerta e trava, e nada mais.
- **Don't** polvilhar a cor forte em detalhe, fio ou ícone decorativo — ela ocupa região ou não aparece.
- **Don't** usar sombra sem desfoque, nem sombra colorida em carta branca.
- **Don't** usar JetBrains Mono em prosa, botão, rótulo ou recado; ela é só do código de tombo, ISBN e data em coluna.
- **Don't** subir dado para caixa alta, nem pôr valor dentro de um rótulo.
- **Don't** usar emoji, glifo Unicode ou pacote de ícones no lugar do sistema de ícones desenhado.
- **Don't** carregar fonte de CDN: a rede institucional bloqueia, e as fontes são servidas do próprio domínio.
- **Don't** trazer de volta o mundo anterior — verdes chapados, tipo bitmap, xadrez, ícone de 8px. É a anti-referência confirmada pelo usuário.
