# Plan 001 — Configurar Fonte TT Hoves Pro

## Descrição
Substituir Inter pelo TT Hoves Pro Trial Variable como fonte de display (títulos). A fonte variable cobre todos os pesos (100-900) em um único arquivo .ttf.

## Módulo
Infraestrutura — não afeta funcionalidades específicas, apenas tipografia global.

## Arquivos

#### [MOVE] Font file
- **De:** `TT Hoves Pro Expanded/TT Hoves Pro Trial Variable.ttf`
- **Para:** `public/fonts/TTHovesProVariable.ttf`

#### [MODIFY] `src/styles/fonts.css`
- Remover `@import url(...)` da Inter (Google Fonts para display)
- Manter `@import url(...)` da Work Sans (corpo)
- Adicionar `@font-face` para TT Hoves Pro usando a Variable font
- Pesos: `100 900` (variable font range)

#### [MODIFY] `src/styles/globals.css`
- Linha 33: trocar `--font-display: "Inter", "TT Hoves Pro"` → `--font-display: "TT Hoves Pro", "Inter", system-ui, sans-serif`

## Cenários
- **Happy path:** Títulos renderizam com TT Hoves Pro, body com Work Sans
- **Edge case:** Se a fonte não carregar, Inter (Google Fonts) é fallback

## Checklist
- [ ] Copiar `TT Hoves Pro Trial Variable.ttf` → `public/fonts/`
- [ ] Atualizar `fonts.css` com `@font-face` local
- [ ] Atualizar `--font-display` em `globals.css`
- [ ] Verificar renderização no browser
