# AGENTS.md

Instruções operacionais para agentes de IA que trabalham neste repositório. Leia antes de fazer qualquer alteração.

Para arquitetura, design system e decisões de projeto, [DESIGN.md](DESIGN.md) é a fonte da verdade — consulte-o antes de alterar qualquer coisa em `src/`.

## Visão geral do projeto

Protótipo de frontend estático ("Criar perfil" — formulário de criação de perfil em múltiplas etapas), em JS/HTML/CSS vanilla puro, sem build step e sem framework. Tudo o que o navegador precisa está sob `src/`; esse diretório é implantado tal como está no GitHub Pages.

## Comandos

```bash
npm run test:e2e     # roda os testes e2e do Playwright (tests/e2e/*.spec.js)
npx playwright test --project=chromium tests/e2e/smoke.spec.js   # um único teste/projeto
npx playwright show-report                                        # visualiza o último relatório HTML
```

Não há etapa de build/lint/typecheck — `src/` é servido diretamente. `npm test` é um placeholder (nenhum teste unitário configurado).

O Playwright roda contra 5 projetos (`chromium`, `chromium-tablet`, `chromium-mobile`, `webkit-tablet`, `webkit-mobile`), então o comportamento mobile/touch é exercitado em toda execução e2e — tenha isso em mente ao alterar lógica de teclado em `script.js` (ver [Teclado nativo](DESIGN.md#teclado-nativo-visualviewport----kb--kb-open)).

## Deploy

`.github/workflows/pages.yml` publica o conteúdo de `src/` no GitHub Pages a cada push para `main` (ou disparo manual). Não há artefato de build separado — o que está em `src/` é exatamente o que vai para produção.

## Ao alterar o código

Resumo da arquitetura e todos os detalhes (máquina de estados, tokens, sistema de bordas, mirror da bio, fake caret, teclado mobile) estão em [DESIGN.md](DESIGN.md). Pontos de atenção operacionais:

- **Estender o formulário** (ex.: 4ª etapa): atualize `LAST`, `inputs`, `MIN_LEN`, `validStep` e o markup de `.panel[data-step]` em conjunto — ver [Estendendo o formulário](DESIGN.md#estendendo-o-formulário).
- **Mexer em fonte/padding da bio**: pode desalinhar o overlay do mirror, que precisa ficar sobreposto pixel a pixel — ver [Mirror da bio](DESIGN.md#mirror-da-bio-seleção-bicolor--excedente).
- **Alterar `style.css` ou a lógica visual de `script.js`**: revise o [sistema de mosaico de bordas](DESIGN.md#sistema-de-mosaico-de-bordas) e os [estados por classe](DESIGN.md#estados-por-classe-app--panel) antes.
