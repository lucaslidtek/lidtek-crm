# Issue 001 — Configurar Fonte TT Hoves Pro

**Módulo:** Infraestrutura
**Prioridade:** Alta
**Dependências:** Nenhuma

## Descrição

Mover a fonte TT Hoves Pro Trial Variable (.ttf) para `public/fonts/`, configurar os `@font-face` em `fonts.css`, e atualizar o token `--font-display` em `globals.css` para usar TT Hoves Pro como família primária de títulos (Inter como fallback).

## Arquivos

- `[MOVE]` `TT Hoves Pro Expanded/TT Hoves Pro Trial Variable.ttf` → `public/fonts/TTHovesProVariable.ttf`
- `[MODIFY]` `src/styles/fonts.css` — trocar import Inter por `@font-face` local
- `[MODIFY]` `src/styles/globals.css` — atualizar `--font-display`
