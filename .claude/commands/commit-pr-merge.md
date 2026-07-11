---
description: Commit, abre PR para main e faz o merge
argument-hint: [start]
---

Faça o fluxo completo de entrega de uma mudança neste repositório: commit → push → PR para `main` → merge.

Mensagem/contexto do commit fornecido pelo usuário (pode estar vazio, use o diff para inferir): $ARGUMENTS

Siga estes passos, na ordem:

1. **Estado atual**: rode `git status` e `git diff` (staged e unstaged) para ver o que mudou. Se não houver nenhuma mudança para commitar e a branch atual já não tiver commits não enviados à `main`, avise o usuário e pare.

2. **Branch**: se a branch atual for `main`, crie uma branch nova a partir dela com nome curto em kebab-case descrevendo a mudança (siga o padrão do histórico do repo, ex.: `min-len-e-skip-bio`, `landing-toque-inicial`). Se já estiver numa branch de feature, reutilize-a.

3. **Commit**: adicione apenas os arquivos relevantes à mudança (nunca `git add -A`/`git add .` às cegas — revise `git status` antes). Escreva uma mensagem de commit no estilo do histórico do repo (frase curta, em português, começando com verbo — "Adiciona", "Corrige", "Ajusta" etc.), focada no _porquê_. Use o `$ARGUMENTS` como base quando fornecido.

4. **Push**: envie a branch para `origin` com `-u` se for a primeira vez.

5. **Pull Request**: crie o PR com `gh pr create --base main --title "..." --body "..."`, com título curto e corpo em formato `## Summary` / `## Test plan` (checklist do que foi validado — rode `npm run test:e2e` se a mudança tocar `script.js`/`criar-perfil.html`/`style.css` antes de marcar como testado).

6. **Merge**: confirme com o usuário que o PR está pronto (mostre o link) antes de mergiar. Após confirmação, faça `gh pr merge --merge --delete-branch` (merge commit, igual ao histórico existente do repo — não usar squash/rebase salvo pedido explícito).

Regras de segurança:

- Nunca use `git push --force`, `git reset --hard` ou `--no-verify`.
- Se algum passo falhar (ex.: hook de pre-commit, conflito), pare e reporte — não tente contornar com flags de bypass.
- Push, criação de PR e merge são ações visíveis/irreversíveis: sempre mostre o que vai fazer antes de cada uma dessas três ações, mesmo que os passos anteriores já tenham sido aprovados.
