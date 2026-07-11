# AGENTS.md

Esta é a fonte única da verdade sobre contexto, regras e a estrutura-alvo do repositório para agentes de IA que trabalham neste repositório. Leia-o por completo antes de fazer qualquer alteração.

## Visão geral do projeto

Protótipo de frontend estático ("Criar perfil" — formulário de criação de perfil em múltiplas etapas), em JS/HTML/CSS vanilla puro, sem build step e sem framework. Tudo o que o navegador precisa está sob `src/`; esse diretório é implantado tal como está no GitHub Pages.

## Comandos

```bash
npm run test:e2e     # roda os testes e2e do Playwright (tests/e2e/*.spec.js)
npx playwright test --project=chromium tests/e2e/smoke.spec.js   # um único teste/projeto
npx playwright show-report                                        # visualiza o último relatório HTML
```

Não há etapa de build/lint/typecheck — `src/` é servido diretamente. `npm test` é um placeholder (nenhum teste unitário configurado).

O Playwright roda contra 5 projetos (`chromium`, `chromium-tablet`, `chromium-mobile`, `webkit-tablet`, `webkit-mobile`), então o comportamento mobile/touch é exercitado em toda execução e2e — tenha isso em mente ao alterar lógica de teclado em `script.js`.

## Deploy

`.github/workflows/pages.yml` publica o conteúdo de `src/` no GitHub Pages a cada push para `main` (ou disparo manual). Não há artefato de build separado — o que está em `src/` é exatamente o que vai para produção.

## Arquitetura

`src/criar-perfil.html` + `src/script.js` + `src/style.css` implementam um formulário de página única, em 3 etapas (nome → função → bio), dentro de uma `track` que desliza horizontalmente (`translateX` por etapa), sem roteador — este é um widget autocontido, não a arquitetura vanilla-SPA descrita nas preferências globais (sem roteamento via History API aqui, já que existe apenas uma view).

Mecânicas-chave em `script.js` (uma única IIFE, sem módulos):

- **Máquina de estados de etapas**: `step` (0–2) controla `go(i)`, que transiciona a `track`, refoca o input da etapa atual e chama `render()`. `validStep(i)` determina se "Prosseguir" fica habilitado em cada etapa (o nome precisa ser não vazio e não estar na lista fictícia `TAKEN`; a bio precisa ser não vazia e respeitar `LIMIT`).
- **Espelho de limite de caracteres da bio**: o `<textarea>` da bio não tem forma nativa de destacar texto excedente ou exibir uma seleção colorida independente de `::selection`. `buildMirror()` renderiza uma `<div id="mirror">` sombra atrás do textarea, calculando os "pontos de corte" do texto (limite + seleção atual) e envolvendo trechos em `<mark>` (excedente) ou `.sel-danger`/`.sel-normal` (seleção). Esse espelho precisa permanecer sincronizado com o scroll do textarea e as métricas da fonte — se a fonte/padding da bio mudar em `style.css`, verifique se o espelho continua sobreposto corretamente.
- **Persistência de rascunho**: `store` encapsula `localStorage` com um fallback em memória (`mem`) para ambientes em que `localStorage` lança exceção (modo privado, etc.). Rascunhos só são persistidos explicitamente pelo botão de salvar (disquete) — não a cada tecla digitada.
- **Tratamento do teclado mobile**: usa os eventos `resize`/`scroll` de `visualViewport` para calcular uma variável CSS `--kb` (altura do teclado), permitindo que o layout reaja ao teclado virtual. A tela inicial tem um CTA (`startBtn`) que existe especificamente para que o primeiro `focus()` ocorra dentro de um gesto real do usuário — um `focus()` disparado no carregamento da página sem gesto é silenciosamente ignorado pelo iOS Safari/Android.
- `isMobileOS` distingue dispositivos com toque real (incluindo iPadOS, que reporta `MacIntel` na UA) de desktop, para exibir condicionalmente o botão de "esconder teclado".

Não há divisão em componentes/módulos — toda a lógica fica dentro da IIFE de nível superior em `script.js`, com `const`s capturadas por `id`. Ao estender este formulário (ex.: adicionar uma 4ª etapa), atualize `LAST`, o array `inputs`, `validStep` e o markup correspondente de `.panel[data-step]` em conjunto — eles não são derivados uns dos outros.
