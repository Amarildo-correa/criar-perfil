# Objetivo

Gerar @DESIGN.md como Design System documentado, otimizado para consumo por agentes de IA em OUTRO repositório.

# Análise (você decide o conteúdo, com base no código real)

Leia o repositório inteiro e analise @src/criar-perfil.html, @src/script.js, @src/style.css.
Documente APENAS o que existe de fato no código — não aplique um template genérico de design system nem invente seções (não há variantes primary/secondary, sizes sm/md/lg, sombras, border-radius, gradientes, toasts, modais ou navegação; se não está no código, não entra).
Extraia tudo que é necessário para reconstruir este frontend do zero, dando peso especial ao que é idiossincrático deste projeto:

- Tokens realmente definidos no :root (cores, hairlines, --row, --pad, --pad-field, --kb, tipografia, spacing, ícone, duração, z-index).
- O sistema de "mosaico de bordas": as DUAS categorias de cor e suas regras condicionais de declaração de borda (qual lado declara, quando não repetir, exceções de estado). Preserve as regras e o porquê — não reduza a uma tabela de valores.
- O modelo de estados por classe no .app e no .panel, e o que cada estado ativa visualmente.
- Mecanismos próprios: fake-caret, mirror da bio (seleção bicolor + excedente), validação (MIN_LEN, bio opcional, nome em uso), tratamento de teclado (visualViewport/--kb/kb-open), gesto do CTA da landing, restauração de rascunho.
- Escala responsiva (clamp/vw) e acessibilidade (aria-label, role, aria-live) onde aparecem.

# Requisitos do DESIGN.md (context hygiene / AI-first)

- Comece com um índice (TOC) usando links âncora para cada seção, permitindo leitura parcial e progressiva sem carregar o arquivo inteiro na janela de contexto.
- Uma seção por conceito, autocontida. Evite repetição entre seções para não gerar ruído nem desperdício de tokens.
- Documente tokens em tabelas: nome | valor | uso semântico | onde é aplicado.
- Preserve regras condicionais e rationale como texto, não só como valores — o "porquê" é parte da spec aqui.
- Migre integralmente o conteúdo do comentário @src/style.css#1-56 para as seções correspondentes, sem perda de informação.

# Referência em AGENTS.md

- Em @AGENTS.md, adicione apenas um ponteiro curto para `DESIGN.md` (link + 1 linha descrevendo quando consultá-lo). Não inline o conteúdo — carregamento sob demanda para preservar contexto.

# Etapa final

- Após `DESIGN.md` concluído, remova @src/style.css#1-56 (bloco de comentário agora redundante). Preserve o :root intacto.
