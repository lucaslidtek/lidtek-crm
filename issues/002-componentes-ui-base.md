# Issue 002 — Componentes UI Base (Design System)

**Módulo:** Shared
**Prioridade:** Alta
**Dependências:** 001

## Descrição

Criar os componentes UI fundamentais estilizados com Radix UI + Design System (glassmorphism, tokens, tipografia). Esses componentes serão reutilizados em todos os módulos (M1-M4). Inclui: Button, Badge, Card, Input, Dialog, Select, DropdownMenu.

## Arquivos

- `[NEW]` `src/shared/components/ui/Button.tsx` — variantes: primary, secondary, ghost, destructive
- `[NEW]` `src/shared/components/ui/Badge.tsx` — status (todo, in_progress, done, blocked) + prioridade (high, medium, low)
- `[NEW]` `src/shared/components/ui/Card.tsx` — glass card com dark/light, hover animations
- `[NEW]` `src/shared/components/ui/Input.tsx` — input + textarea estilizados
- `[NEW]` `src/shared/components/ui/Dialog.tsx` — modal Radix com glassmorphism overlay
- `[NEW]` `src/shared/components/ui/Select.tsx` — select Radix estilizado
- `[NEW]` `src/shared/components/ui/DropdownMenu.tsx` — dropdown Radix com glass
