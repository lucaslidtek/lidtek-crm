# Plan 002 — Componentes UI Base (Design System)

## Descrição
Criar componentes Radix UI estilizados conforme DESIGN.md. São a base visual de todos os módulos.

## Módulo
Shared — F01-F07 (todos os módulos dependem destes componentes)

## Arquivos

#### [NEW] `src/shared/components/ui/Button.tsx`
- Variantes: `primary`, `secondary`, `ghost`, `destructive`, `outline`
- Tamanhos: `sm`, `default`, `lg`
- Specs: `rounded-full`, `uppercase`, `tracking-[0.2em]`, `font-bold`, `text-[11px]` a `text-sm`
- Primary: `bg-primary text-white glow-primary`, hover: `scale-105`, active: `scale-95`
- Transição: `300ms ease`
- Props: `variant`, `size`, `className`, `children`, `disabled`, `onClick`, `asChild`

#### [NEW] `src/shared/components/ui/Badge.tsx`
- Variantes por contexto:
  - **Status:** `todo` (muted), `in_progress` (primary), `done` (success), `blocked` (destructive)
  - **Prioridade:** `high` (destructive), `medium` (warning), `low` (muted)
  - **Tipo projeto:** `recurring` (emerald), `oneshot` (blue-light)
  - **Tipo tarefa:** `project` (primary), `sales` (blue-light), `standalone` (muted)
- Specs: `px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full`

#### [NEW] `src/shared/components/ui/Card.tsx`
- Classe base: `glass rounded-2xl p-6`
- Hover: `translate-y-[-4px]` com `transition 600ms cubic-bezier(0.16,1,0.3,1)`
- Variante `interactive` (cursor-pointer, hover effects)
- Variante `static` (sem hover)

#### [NEW] `src/shared/components/ui/Input.tsx`
- Input + Textarea
- Specs: `bg-white/5 border border-border rounded-xl px-4 py-2.5`
- Focus: `ring-2 ring-primary/30`
- Label opcional (acima do input, `label-style`)

#### [NEW] `src/shared/components/ui/Dialog.tsx`
- Radix Dialog com overlay `bg-black/60 backdrop-blur-sm`
- Content: `glass rounded-2xl p-8`, animação `fade-in + scale 0.95→1`
- Max-width configurável: `sm`, `default` (max-w-lg), `lg` (max-w-2xl)
- Header, Body, Footer slots

#### [NEW] `src/shared/components/ui/Select.tsx`
- Radix Select com trigger estilizado igual Input
- Content: `glass rounded-xl`
- Items com hover `bg-white/5`

#### [NEW] `src/shared/components/ui/DropdownMenu.tsx`
- Radix DropdownMenu
- Content: `glass rounded-xl p-1`
- Items: `px-3 py-2 rounded-lg hover:bg-white/5 text-sm`
- Separator: `border-white/5`

## Design
- Todos usando `cn()` para merge de classes
- Todos exportam sub-componentes quando necessário (ex: `Dialog.Header`, `Dialog.Footer`)
- Cores via tokens CSS (`bg-primary`, `text-foreground`, etc.)
- Sem hardcode de cores — sempre tokens

## Checklist
- [ ] Button com 5 variantes + 3 tamanhos
- [ ] Badge com variantes de status, prioridade, tipo
- [ ] Card glass com hover animation
- [ ] Input + Textarea estilizados
- [ ] Dialog com glassmorphism overlay
- [ ] Select Radix estilizado
- [ ] DropdownMenu Radix estilizado
