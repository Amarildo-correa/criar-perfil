# DESIGN.md

Design system deste frontend estático ("Criar perfil"), documentado a partir do código real em `src/criar-perfil.html`, `src/script.js` e `src/style.css`. Nada aqui é template genérico — cada seção existe porque corresponde a um mecanismo de fato implementado.

> Este documento é sincronizado automaticamente com o skill `design-doc` do plugin [Amarildo-correa/design-doc](https://github.com/Amarildo-correa/design-doc) a cada push em `main`.

## Índice

- [Arquitetura geral](#arquitetura-geral)
- [Tokens (:root)](#tokens-root)
- [Sistema de mosaico de bordas](#sistema-de-mosaico-de-bordas)
- [Estados por classe (.app / .panel)](#estados-por-classe-app--panel)
- [Fake caret (gota decorativa)](#fake-caret-gota-decorativa)
- [Mirror da bio (seleção bicolor + excedente)](#mirror-da-bio-seleção-bicolor--excedente)
- [Validação de etapas](#validação-de-etapas)
- [Teclado nativo (visualViewport / --kb / kb-open)](#teclado-nativo-visualviewport----kb--kb-open)
- [Gesto do CTA da landing](#gesto-do-cta-da-landing)
- [Restauração de rascunho](#restauração-de-rascunho)
- [Escala responsiva e acessibilidade](#escala-responsiva-e-acessibilidade)

---

## Arquitetura geral

`src/criar-perfil.html` + `src/script.js` + `src/style.css` implementam um formulário de página única, em 3 etapas (nome → profissão → bio), dentro de uma `track` que desliza horizontalmente (`translateX` por etapa), sem roteador — é um widget autocontido, **não** a arquitetura vanilla-SPA das preferências globais (não há roteamento via History API, pois existe apenas uma view).

Toda a lógica fica numa única IIFE de nível superior em `script.js`, sem módulos, com `const`s capturadas por `id`. Não há divisão em componentes.

### Máquina de estados de etapas

`step` (0–2) é o estado central. `go(i, focusInput)` faz a transição: apara espaços finais do campo que está sendo deixado, faz `clamp` de `step` em `[0, LAST]`, desliza a `track` (`translateX(-step*100%)`), chama `render()` e — se `focusInput` — refoca o input da etapa dentro do gesto síncrono do usuário (ver [Gesto do CTA da landing](#gesto-do-cta-da-landing)).

`render()` recalcula, a cada chamada, todas as classes de estado do `.app`/`.panel` (ver [Estados por classe](#estados-por-classe-app--panel)), o overlay do mirror (ver [Mirror da bio](#mirror-da-bio-seleção-bicolor--excedente)), os contadores e o ícone/label do `#next` (seta → check na última etapa). `validStep(i)` decide se `.app.ok` libera "Prosseguir" em cada etapa (ver [Validação de etapas](#validação-de-etapas)).

### Estendendo o formulário

Ao adicionar uma etapa (ex.: uma 4ª), atualize **em conjunto** — nenhum é derivado dos outros: `LAST`, o array `inputs`, o mapa `MIN_LEN`, `validStep` e o markup de `.panel[data-step]` no HTML.

---

## Tokens (:root)

Todos definidos em `src/style.css` dentro de `:root`.

| Token                    | Valor                              | Uso semântico                                                      | Onde é aplicado                                                                                                 |
| ------------------------ | ---------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `--bg`                   | `#0a0e17`                          | Fundo geral da página/app                                          | `body`, `.landing`, `.error-msg`                                                                                |
| `--line`                 | `#1a2538`                          | Cor neutra de hairline (bordas comuns)                             | Molduras do `.app`, divisores entre células do mosaico                                                          |
| `--ink`                  | `#dfe7f2`                          | Texto principal                                                    | Corpo do texto, título, mirror                                                                                  |
| `--ink-dim`              | `#94a3ba`                          | Texto secundário/apagado                                           | Placeholder, `.step-total`, `.under-count`                                                                      |
| `--accent`               | `#7aa6e8`                          | Cor de destaque neutra (não-estado de erro/foco)                   | Ícones de botão, spans de título/landing                                                                        |
| `--danger`               | `#ff7a7a`                          | Cor de estado de erro/excedente                                    | Bordas de erro, texto excedente, `#erase`, `.over-count`                                                        |
| `--focus`                | `#8fd0ff`                          | Cor de estado de foco                                              | Borda de painel focado, caret, fake-caret                                                                       |
| `--focus-select-bg`      | `#2c3f61`                          | Fundo de seleção normal (não excedente)                            | `::selection`, `.mirror .sel-normal`                                                                            |
| `--danger-select-bg`     | `#c23c3c`                          | Fundo de seleção em trecho excedente/erro                          | `.panel.err ::selection`, `.mirror .sel-danger`                                                                 |
| `--hair`                 | `max(1px, 0.0625rem)`              | Espessura de hairline interna                                      | Bordas do mosaico entre células                                                                                 |
| `--hair-edge`            | `max(2px, 0.0625rem)`              | Espessura de hairline externa (moldura)                            | Borda externa do `.app`, `.top/right/bottom/left` do posicionamento fixo                                        |
| `--row`                  | `clamp(3.25rem, 16vw, 4rem)`       | Altura de linha padrão (header/footer/células)                     | `grid-template-rows` do `.app`, largura/altura de `.icon-cell`, `.btn`, `.over-count`, `.under-count`           |
| `--pad`                  | `clamp(0.875rem, 4.5vw, 1.125rem)` | Padding horizontal de células com texto                            | `.step-title`, `.landing`, `.error-msg`, `.over-count`, `.under-count`                                          |
| `--pad-field`            | `clamp(1.25rem, 5.5vw, 1.625rem)`  | Respiro interno dos campos de texto (texto nunca encosta na borda) | `.panel input/textarea`, `.mirror`                                                                              |
| `--kb`                   | `0px` (dinâmico via JS)            | Altura ocupada pelo teclado virtual                                | `bottom` do `.app` — atualizado em runtime, ver [Teclado nativo](#teclado-nativo-visualviewport----kb--kb-open) |
| `--font-size-sm`         | `1.0625rem`                        | Tamanho de fonte base                                              | Corpo, título, landing                                                                                          |
| `--font-size-lg`         | `1.375rem`                         | Tamanho de fonte de campos de uma linha                            | `.oneline` (user/role)                                                                                          |
| `--font-weight-regular`  | `400`                              | Peso normal                                                        | `body`                                                                                                          |
| `--font-weight-semibold` | `600`                              | Peso semi-destacado                                                | Títulos, CTA, mensagem de erro                                                                                  |
| `--font-weight-bold`     | `700`                              | Peso máximo                                                        | Contadores (`#stepNow`, `.over-count`, `.under-count`)                                                          |
| `--line-height-base`     | `1.45`                             | Altura de linha do corpo                                           | `body`                                                                                                          |
| `--line-height-relaxed`  | `1.55`                             | Altura de linha dos campos de texto                                | `.panel input/textarea`, `.mirror`                                                                              |
| `--letter-spacing-sm`    | `0.03em`                           | Espaçamento de letras leve                                         | Landing, CTA, mensagem de erro                                                                                  |
| `--letter-spacing-md`    | `0.05em`                           | Espaçamento de letras médio                                        | `.step-title`                                                                                                   |
| `--spacing-sm`           | `1rem`                             | Espaçamento padrão pequeno                                         | Padding horizontal de `.step-state`                                                                             |
| `--spacing-xs`           | `0.25em`                           | Espaçamento mínimo                                                 | `padding-block` de `.sel-normal`/`.sel-danger` no mirror                                                        |
| `--icon-size`            | `1.5rem`                           | Dimensão dos ícones SVG                                            | `.btn svg`                                                                                                      |
| `--duration-base`        | `0.28s`                            | Duração de transição padrão                                        | `transform` do `.track` ao trocar etapa                                                                         |
| `--z-index-sticky`       | `10`                               | Camada do rodapé fixo                                              | `footer`                                                                                                        |
| `--z-index-overlay`      | `20`                               | Camada do overlay de landing                                       | `.landing`                                                                                                      |

---

## Sistema de mosaico de bordas

O layout é uma malha de células adjacentes (header, footer, campos) que compartilham hairlines. Existem **duas categorias de cor** com regras de declaração opostas.

### Categoria 1 — `--line` (cor neutra/comum)

Uma borda compartilhada entre duas células vizinhas da **mesma cor** é declarada **uma única vez**: pelo lado do elemento que vem primeiro no DOM.

- `#exit`, `#back`, `#hideKb` declaram `border-right`; `.step-state` e `#next` declaram `border-left` do lado seguinte; `.under-count` usa só `border-left`.
- Nunca declarar o mesmo lado duas vezes com `--line` — duas hairlines encostadas ficariam mais grossas/duplicadas sem necessidade.
- Uma célula que encosta na moldura externa do `.app` com a mesma cor `--line` também não repete a borda — a moldura já cumpre esse papel.

### Categoria 2 — `--focus`, `--accent`, `--danger` (cores de destaque/estado)

Ao contrário da regra 1, essas cores **sempre se declaram nos 4 lados** do próprio elemento, mesmo que algum lado coincida com uma borda `--line` já existente (moldura do `.app`, footer, vizinho). A cor de destaque precisa aparecer por cima da linha comum, nunca ficar "escondida" atrás dela por omissão.

- `.over-count` e `#erase` (ambos `--danger`, só existem com `.app.over` ativo) mantêm os 4 lados sempre visíveis mesmo tocando bordas `--line` neutras.
- **Exceção**: se dois elementos vizinhos declaram a **mesma** cor de destaque no lado que se encosta (ex.: `.over-count` `border-right` e `#erase` `border-left`, ambos `--danger`), volta a valer a regra 1 — só um dos dois declara aquele lado (o primeiro no DOM), para não duplicar a espessura entre duas bordas idênticas. No código, `.over-count` declara os 4 lados; `.app.over #erase` redeclara apenas `top`/`right`/`bottom`, deixando `left` de fora porque colidiria com o `border-right` de `.over-count`.

### Elementos com subcélulas

Um elemento que contém mais de uma tag/subcélula (ex.: `#next` com seu `.next-icon-cell`) repete essa mesma lógica internamente: cada subcélula fecha sua própria borda, como se fosse mais um item do mosaico — nunca uma borda só no container de fora.

### Posição real vs. ordem no DOM

Elementos cuja posição visual muda por estado (ex.: `.under-count` só é o último item visível do `.end-group` quando `#erase`/`#next` estão escondidos) precisam de bordas que reflitam a **posição real na fileira naquele estado**, não a ordem no DOM.

### Piso de largura mínima

Toda tag/célula nunca fica mais estreita do que alta: largura mínima igual à própria altura (`min-width: var(--row)`, a mesma medida usada pela altura), formando um quadrado como piso — pode crescer além disso se o conteúdo pedir (ex.: `"+15"`), nunca encolher abaixo.

- `.btn` e `.icon-cell` cumprem isso via `aspect-ratio: 1/1` (conteúdo — ícone — nunca varia de largura).
- Células com texto de largura variável (`.over-count`, `.under-count`) usam `min-width` em vez de `aspect-ratio`, pelo mesmo motivo mas em sentido inverso (o conteúdo pode exigir mais espaço).
- Não se aplica a barras intencionalmente largas como `.error-msg`, `.step-title` ou `.landing-cta` — essas ocupam a fileira inteira por design, não são células do mosaico.

---

## Estados por classe (.app / .panel)

Classes alternadas via `classList.toggle` em `render()` (`script.js`) e consumidas puramente em CSS.

### No `.app`

| Classe       | Quando ativa                                                                                   | Efeito visual                                           |
| ------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `.started`   | Após toque no `startBtn` da landing                                                            | Esconde `.landing`; mostra `.bar`                       |
| `.first`     | `step === 0`                                                                                   | Esconde `#back`                                         |
| `.over`      | `step === 2` e `bio.value.length > LIMIT`                                                      | Mostra `.over-count` e `#erase` (bordas `--danger`)     |
| `.under`     | Campo da etapa atual não vazio e abaixo de `MIN_LEN[step]`                                     | Mostra `.under-count` com o quanto falta                |
| `.ok`        | `validStep(step)` verdadeiro                                                                   | Mostra `#next`                                          |
| `.err`       | `step === 0` e nome está em `TAKEN`                                                            | Mostra `.error-msg`; pinta rodapé/painel na cor de erro |
| `.mobile-os` | UA identificada como Android/iPhone/iPad/iPod, ou `MacIntel` com `maxTouchPoints > 1` (iPadOS) | Habilita a possibilidade de exibir `#hideKb`            |
| `.kb-open`   | `visualViewport` reporta altura de teclado > 100px                                             | Junto com `.mobile-os`, mostra `#hideKb`                |

`.over` e `.ok` são mutuamente exclusivos por construção: texto excedido invalida `validStep`, então nunca coexistem (`.end-group > *` começa oculto; só um dos dois grupos aparece por vez).

### No `.panel`

| Classe   | Quando ativa                                       | Efeito visual                                                                                                                                                              |
| -------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.focus` | Input do painel tem foco                           | `box-shadow` inset com `--focus`                                                                                                                                           |
| `.over`  | Painel é o da bio e está acima do `LIMIT`          | `box-shadow` inset com `--danger`                                                                                                                                          |
| `.err`   | Painel é o do nome (`user`) e nome está em `TAKEN` | `box-shadow` inset com `--danger`; texto e caret do textarea assumem `--danger`; fake-caret também fica `--danger`; `::selection` do painel muda para `--danger-select-bg` |

`.over` e `.err` compartilham o mesmo seletor de `box-shadow` (`.panel.over, .panel.err`) porque nunca ocorrem no mesmo painel (etapas diferentes: bio vs. nome).

---

## Fake caret (gota decorativa)

Android desenha uma alça de inserção nativa sob o caret em qualquer campo tocado, mesmo vazio — sem utilidade nesse estado, já que não há texto para reposicionar. `updateFakeCaret()` em `script.js` substitui isso por uma gota própria (SVG, `.fake-caret`), mostrada **apenas enquanto o campo está vazio e focado** (modo placeholder); some no primeiro caractere digitado.

- O caret nativo é preservado (cor, espessura, piscar) — só a gota é desenhada por cima, encostada exatamente na ponta de baixo de onde o caret nasceria.
- `measureCaretRect()` mede a posição via um `<span>` probe invisível (zero-width space) injetado com a mesma fonte/padding do campo, aproveitando o motor de layout do navegador em vez de calcular métricas de fonte manualmente — acompanha qualquer campo sem ajuste fino.
- `halfLeading` corrige a diferença entre a altura de linha inteira (`line-height`) e a caixa real da fonte: sem esse ajuste, sobraria um vão entre o caret verdadeiro e a gota.
- `teardropPath()` gera o path SVG da gota a partir de largura/altura em runtime.
- Reposicionada em: foco, digitação (`input`), e `resize` da janela (rotação de dispositivo ou mudança de `vw` que afeta o `clamp()` do font-size).
- Em erro (`.panel.err`), a cor da gota (`.drop`) muda de `--focus` para `--danger`.

---

## Mirror da bio (seleção bicolor + excedente)

O `<textarea>#bio` não tem forma nativa de (a) destacar texto excedente ao limite, nem (b) exibir uma seleção com cor diferente da seleção normal do navegador. `buildMirror()` resolve isso com uma `<div id="mirror">` sombra, absoluta sobre o textarea.

**Por que precisa de um mirror**: o navegador não permite duas cores de `::selection` num mesmo campo — não há como pintar "seleção dentro do trecho excedente" de vermelho e "seleção no trecho normal" de azul usando só CSS nativo. A textarea real (`#bio`) fica com texto transparente e `::selection` transparente; o `.mirror` por trás é quem pinta tudo (cor de texto normal, `<mark>` para excedente, spans de seleção).

**Algoritmo** (`buildMirror`):

1. Calcula os "pontos de corte" cruzando dois cortes independentes no texto: o limite (`LIMIT`, se excedido) e a seleção nativa atual da textarea (`selectionStart`/`selectionEnd`, se houver foco e seleção não-colapsada).
2. Ordena os pontos e emite um segmento HTML por intervalo entre pontos consecutivos.
3. Cada segmento recebe, em ordem de prioridade: `.sel-danger` (selecionado E excedente) → `.sel-normal` (selecionado, não excedente) → `<mark>` (excedente, não selecionado) → texto puro.

**Sincronização**: o mirror precisa acompanhar a textarea em scroll (`bio.addEventListener("scroll", ...)` copia `scrollTop`) e em qualquer mudança de seleção que não dispare `input` — arrastar o mouse, Shift+setas, Ctrl+A — via `document.addEventListener("selectionchange", ...)`, restrito a quando `bio` está focada. Reforçado em `blur` também. Se a fonte/padding da bio mudar em `style.css`, o mirror precisa continuar sobreposto pixel a pixel (mesmo `font`, `line-height`, `padding` em ambos via CSS compartilhado).

**Contador de excedente**: `overEl.textContent` mostra `"-" + (v.length - LIMIT)` quando acima do limite; o caret real (`bio.style.caretColor`) também muda de `--focus` para `--danger` quando a posição do caret está além do `LIMIT`.

**CSS de suporte**:

- `.mirror .sel-normal`/`.sel-danger` usam `box-decoration-break: clone` + `padding-block` para repetir o padding em cada linha quebrada (o padrão `slice` só aplica no primeiro/último fragmento) — fecha o vão que o `line-height` deixaria entre linhas de uma seleção multi-linha.
- `.mirror mark` fica com fundo transparente e cor `--danger` (o destaque é só de cor de texto, não de fundo).

---

## Validação de etapas

Constantes em `script.js`: `LIMIT = 15` (máximo de caracteres visíveis antes de contar como excedente na bio — nota: `maxlength="1200"` no HTML é apenas um teto duro, `LIMIT` é o limite "visual"), `MIN_LEN = { 0: 8, 1: 6, 2: 6 }` (mínimo de caracteres, por etapa, após `trim()`).

`validStep(i)`:

- **Etapa 0 (nome)**: `user.value.trim().length >= MIN_LEN[0]` **e** nome não está em `TAKEN` (`nameTaken()`, lista fictícia `["amarildo"]` simulando indisponibilidade — trocar por checagem de servidor em produção).
- **Etapa 1 (profissão)**: `role.value.trim().length >= MIN_LEN[1]`.
- **Etapa 2 (bio, opcional)**: `!isOver()` (não excede `LIMIT`) **e** (`bio.value.trim().length === 0` **ou** `>= MIN_LEN[2]`).

**Regra do campo opcional**: bio vazia não bloqueia o avanço — `.app.ok` libera `#next` sem exigir preenchimento, já que não há por que travar algo opcional. Mas assim que o usuário digita o primeiro caractere, o campo passa a valer o mesmo `MIN_LEN` dos campos obrigatórios: abaixo do mínimo, `.under-count` reaparece e `.app.ok` cai, exatamente como nos campos não-opcionais. Esvaziar de novo libera o avanço; parar pela metade não.

**Contador de mínimo** (`.under-count`, inverso do `.over-count`): só aparece depois do primeiro caractere digitado e some assim que o mínimo é atingido — `#next` (via `.ok`) toma o lugar dele no mesmo quadrado do `.end-group` (nunca coexistem).

---

## Teclado nativo (visualViewport / --kb / kb-open)

Usa a API `window.visualViewport` (quando disponível) para reagir ao teclado virtual sem depender de heurísticas de `resize` da janela inteira.

```js
const kb = Math.max(0, innerHeight - vv.height - vv.offsetTop);
app.style.setProperty("--kb", kb + "px");
app.classList.toggle("kb-open", kb > 100);
scrollTo(0, 0);
```

- `--kb` é somado ao `bottom` do `.app` (`calc(var(--kb) + env(safe-area-inset-bottom, 0px) + var(--hair-edge))`), então o layout inteiro encolhe para caber acima do teclado.
- Threshold de `100px` para `.kb-open` ignora pequenas oscilações de barra de endereço/toolbar do navegador mobile, que também alteram a altura do viewport visual.
- Recalculado nos eventos `resize` e `scroll` do `visualViewport`, e uma vez no carregamento (`fit()` chamado imediatamente).
- `#hideKb` só é exibido quando **ambas** `.mobile-os` e `.kb-open` estão ativas — depende também da detecção de dispositivo touch real (ver abaixo).
- Ao clicar em `#hideKb`, o campo da etapa atual perde o foco (`inputs[step].blur()`) para fechar o teclado; sem `preventDefault` no `mousedown` (diferente dos outros botões da barra), já que o objetivo aqui é justamente permitir a perda de foco.

**Detecção de dispositivo touch real** (`isMobileOS`): `/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)` **ou** (`navigator.platform === "MacIntel"` **e** `navigator.maxTouchPoints > 1`) — a segunda condição existe porque iPadOS se identifica como `"MacIntel"` no `userAgent`, indistinguível de um Mac de verdade só por UA; o que diferencia é ter tela touch.

---

## Gesto do CTA da landing

`.landing` cobre o `.track` inteiro até o toque do usuário no `startBtn` ("Criar perfil"). Isso não é cosmético: é esse toque — um gesto real do usuário — que autoriza `focus()`/abertura do teclado em navegadores mobile. Um `focus()` disparado sozinho no carregamento da página é silenciosamente ignorado por iOS Safari e Android.

- `startBtn` clique: adiciona `.started` ao `.app` (esconde `.landing` via CSS, mostra `.bar`) e chama `go(step, true)`, que foca o input da etapa atual **dentro do mesmo gesto síncrono**.
- CSS: `.landing-cta` ocupa o lugar inteiro da `.bar` até `.started` ser aplicada (`.app:not(.started) .landing-cta { display: grid }` / `.app:not(.started) .bar { display: none }`) — os dois papéis (CTA vs. barra de navegação) se invertem nesse ponto.
- Em `go()`, o foco é seguido por `toEnd()` chamado de forma síncrona, via `requestAnimationFrame` e via `setTimeout(0)` — Chrome/Safari às vezes reposicionam o caret depois do foco (por exemplo, para o início, principalmente com texto pré-carregado de rascunho); a reafirmação em múltiplos momentos garante que o caret pare no fim do texto real independentemente do navegador.

---

## Restauração de rascunho

`store` encapsula `localStorage` com fallback em memória (`mem`, objeto simples) para ambientes onde `localStorage` lança exceção (modo privado, quotas, etc.) — `get`/`set` nunca propagam o erro.

Ao carregar o script (fim da IIFE):

```js
const d = JSON.parse(store.get(KEY) || "{}");
user.value = d.user || "";
role.value = d.role || "";
bio.value = d.bio || "";
step = Math.max(0, Math.min(LAST, d.step || 0));
```

- `KEY = "perfil.rascunho"`.
- `track.style.transition = "none"` antes de `go(step, false)` (sem foco) evita animar a transição de etapa na restauração; o transition é restaurado no próximo frame (`requestAnimationFrame`).
- Falhas de parse (`JSON.parse` malformado) são engolidas por um `catch` vazio — os campos ficam com os defaults (`""`, `step 0`).

Nota: não há, no código atual, escrita explícita de rascunho de volta ao `store` (sem botão de "salvar" disparando `store.set`) — a leitura na inicialização é o único uso ativo observado.

---

## Escala responsiva e acessibilidade

**Escala responsiva** — tokens usam `clamp(mín, valor-fluido-em-vw, máx)` para adaptar a fontes/paddings/altura de linha sem breakpoints fixos: `--row`, `--pad`, `--pad-field` (ver tabela de [Tokens](#tokens-root)). Isso é o que torna `updateFakeCaret` sensível a `resize` — o `clamp()` muda o tamanho real da fonte conforme a viewport, deslocando onde o caret nasceria.

**Acessibilidade** — atributos presentes no HTML:

- `aria-label` em todos os botões de ícone sem texto visível: `#exit` ("Sair do formulário"), `#back` ("Voltar etapa"), `#hideKb` ("Fechar teclado"), `#erase` ("Apagar texto excedido"), `#next` (dinâmico: "Prosseguir" ou "Enviar" na última etapa, setado via JS).
- `.step-state` tem `aria-live="polite"` e `aria-label="Etapa atual de total"` — mudanças no número da etapa são anunciadas.
- `#over` e `#under` (contadores) têm `role="status"` com `aria-label` descritivo ("Caracteres excedidos" / "Caracteres mínimos restantes").
- `#nameErr` (`.error-msg`) tem `role="alert"` — erro de nome em uso é anunciado imediatamente.
- Elementos puramente decorativos (`.fake-caret`, `.mirror`) têm `aria-hidden="true"` e, no caso do mirror, também `pointer-events: none` + `user-select: none` em CSS, para não interferir com a textarea real por baixo.
- `@media (prefers-reduced-motion: reduce)` desativa a `transition` do `.track` (troca de etapa deixa de animar).
