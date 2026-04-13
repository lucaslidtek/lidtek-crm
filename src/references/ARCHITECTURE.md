# Architecture — Lidtek CRM & Gestão de Projetos

> **Fonte:** PRD v1.0 (Seção 10.9) + decisões de arquitetura do projeto.
> **Última atualização:** Abril/2026

---

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa |
|---|---|---|---|
| **Framework** | React | 19 | Ecossistema maduro, concurrent features |
| **Linguagem** | TypeScript | 5.x | Type safety, DX, refatoração segura |
| **Build** | Vite | 7 | HMR instantâneo, bundling otimizado |
| **Routing** | Wouter | latest | Leve, sem dependências, hook-based |
| **CSS** | Tailwind CSS | v4 | Utility-first + CSS custom properties |
| **Componentes UI** | Radix UI | primitives | Acessibilidade nativa, unstyled |
| **Animações** | Framer Motion | latest | Animações declarativas, layout animations |
| **Smooth Scroll** | Lenis | latest | Scroll suave nativo |
| **Ícones** | Lucide React | latest | Outline style, tree-shakeable |
| **Deploy** | Vercel | — | Edge functions, preview deploys |
| **Fontes** | TT Hoves Pro (local) + Work Sans (Google) | — | Brand typography |

### Backend — Supabase

> ✅ **Decisão:** Backend real via Supabase (PostgreSQL + Auth).

| Camada | Abordagem | Detalhes |
|---|---|---|
| **Dados** | Supabase PostgreSQL | 6 tabelas: `profiles`, `leads`, `interactions`, `projects`, `sprints`, `tasks` |
| **Persistência** | Supabase Cloud | Dados persistem no servidor, acessíveis de qualquer dispositivo |
| **API Layer** | `src/shared/lib/supabaseApi.ts` | Interface idêntica ao antigo `mockApi.ts` — UI não precisou mudar |
| **Auth** | Supabase Auth (Google OAuth) | Login via Google, sessão gerenciada pelo Supabase |
| **Real-time** | Disponível (não utilizado) | Supabase suporta subscriptions — ativável quando necessário |

**Padrão de API (Supabase):**
```typescript
// src/shared/lib/supabaseApi.ts — Mesma interface, backend real
export const api = {
  leads: {
    list: () => supabase.from('leads').select('*, interactions(*)'),
    create: (data) => supabase.from('leads').insert(toSnake(data)),
    update: (id, data) => supabase.from('leads').update(toSnake(data)).eq('id', id),
    updateStage: (id, stage) => api.leads.update(id, { stage }),
    delete: (id) => supabase.from('leads').delete().eq('id', id),
  },
  // ... projects, tasks, sprints, users
};
```

> **Mock API preservado:** O arquivo `mockApi.ts` foi mantido como referência. Para voltar ao modo mock, basta trocar 1 linha no `store.tsx`: `import { api } from './supabaseApi'` → `import { api } from './mockApi'`.


---

## 2. Estrutura de Pastas

```
lidtek-crm/
├── public/
│   ├── fonts/                    # TT Hoves Pro (local)
│   └── favicon.ico
├── src/
│   ├── app/                      # Entry point, providers, router
│   │   ├── App.tsx
│   │   ├── Router.tsx
│   │   └── providers/
│   │       ├── ThemeProvider.tsx
│   │       └── AuthProvider.tsx
│   │
│   ├── modules/                  # Feature modules (domain-driven)
│   │   ├── crm/                  # M1: Funil de Vendas
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── pages/
│   │   │       ├── CrmKanban.tsx
│   │   │       └── CrmList.tsx
│   │   │
│   │   ├── projects/             # M2: Funil de Desenvolvimento
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── pages/
│   │   │       ├── ProjectsKanban.tsx
│   │   │       └── ProjectsList.tsx
│   │   │
│   │   ├── tasks/                # M3: Gestão de Tarefas
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── pages/
│   │   │       ├── TasksKanban.tsx
│   │   │       └── TasksList.tsx
│   │   │
│   │   ├── dashboard/            # M4: Dashboard Inicial
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── pages/
│   │   │       └── Dashboard.tsx
│   │   │
│   │   └── auth/                 # Autenticação & Permissões
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── types/
│   │       └── pages/
│   │           └── Login.tsx
│   │
│   ├── shared/                   # Código compartilhado entre módulos
│   │   ├── components/           # Componentes UI genéricos
│   │   │   ├── ui/               # Radix primitives estilizados
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Dialog.tsx
│   │   │   │   ├── DropdownMenu.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   └── Badge.tsx
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── PageLayout.tsx
│   │   │   │   ├── BottomNavigation.tsx    # Tab bar mobile (hidden md:)
│   │   │   │   └── MobileDrawerWrapper.tsx # Drawer → bottom sheet/side panel
│   │   │   └── kanban/           # Componentes de Kanban reutilizáveis
│   │   │       ├── KanbanBoard.tsx
│   │   │       ├── KanbanColumn.tsx
│   │   │       └── KanbanCard.tsx
│   │   ├── hooks/                # Hooks genéricos
│   │   │   ├── useAuth.ts
│   │   │   ├── useIsMobile.ts    # Detecção mobile (< 640px)
│   │   │   ├── useDragAndDrop.ts
│   │   │   └── useDebounce.ts
│   │   ├── types/                # Types globais
│   │   │   ├── common.ts
│   │   │   └── api.ts
│   │   ├── utils/                # Utilitários
│   │   │   ├── cn.ts             # classnames helper
│   │   │   ├── date.ts
│   │   │   └── format.ts
│   │   └── lib/                  # Configurações de libs externas
│   │       ├── api.ts            # Cliente API
│   │       └── constants.ts
│   │
│   ├── styles/                   # Estilos globais
│   │   ├── globals.css           # Tailwind imports + CSS tokens
│   │   └── fonts.css             # @font-face declarations
│   │
│   ├── references/               # Documentação de referência (NUNCA deploy)
│   │   ├── ARCHITECTURE.md       # Este arquivo
│   │   ├── DESIGN.md
│   │   └── BUSINESS_RULES.md
│   │
│   └── main.tsx                  # React entry point
│
├── issues/                       # Issues atômicas (workflow)
├── plans/                        # Plans detalhados (workflow)
├── WORKFLOW.md                   # Diretiva operacional
├── PRD_Lidtek_CRM_Gestao_Projetos.docx
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── .gitignore
```

### Princípios de Organização

1. **Feature-based modules**: Cada módulo (M1-M4) é autossuficiente com seus próprios componentes, hooks, types e pages.
2. **Shared kernel**: Componentes, hooks e utils compartilhados vivem em `shared/`.
3. **Colocation**: Tudo que pertence a um módulo fica junto. Sem pastas globais de `components/` com 50 arquivos.
4. **Barrel exports**: Cada pasta com `index.ts` para re-exports limpos.

---

## 3. Convenções de Código

### Naming

| Elemento | Convenção | Exemplo |
|---|---|---|
| **Componentes** | PascalCase | `KanbanBoard.tsx`, `LeadCard.tsx` |
| **Hooks** | camelCase com `use` | `useLeads.ts`, `useDragAndDrop.ts` |
| **Utilitários** | camelCase | `formatDate.ts`, `cn.ts` |
| **Types/Interfaces** | PascalCase, sem prefixo `I` | `Lead`, `Project`, `Task` |
| **Constantes** | UPPER_SNAKE | `FUNNEL_STAGES`, `TASK_PRIORITIES` |
| **CSS tokens** | kebab-case com `--` | `--primary`, `--background` |
| **Pastas** | kebab-case | `kanban-board/`, `drag-and-drop/` |
| **Arquivos de page** | PascalCase | `CrmKanban.tsx`, `Dashboard.tsx` |

### Imports

```typescript
// 1. React & libs externas
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

// 2. Shared (absoluto com @/)
import { Button } from '@/shared/components/ui/Button';
import { cn } from '@/shared/utils/cn';

// 3. Módulo atual (relativo)
import { LeadCard } from './components/LeadCard';
import { useLeads } from './hooks/useLeads';
import type { Lead } from './types';
```

### Path Aliases

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/modules/*": ["./src/modules/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

### Padrões de Componente

```typescript
// Componente padrão — Props tipadas, forwardRef quando necessário
interface LeadCardProps {
  lead: Lead;
  onMove?: (leadId: string, targetStage: FunnelStage) => void;
  className?: string;
}

export function LeadCard({ lead, onMove, className }: LeadCardProps) {
  return (
    <motion.div
      className={cn(
        'glass-card rounded-2xl p-6 cursor-grab active:cursor-grabbing',
        className
      )}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      {/* ... */}
    </motion.div>
  );
}
```

---

## 4. Padrões Arquiteturais

### 4.1 State Management

- **Server state**: React Query (TanStack Query) para dados do backend
- **UI state**: useState / useReducer local ao componente
- **Shared UI state**: Context API para temas, auth e sidebar
- **Sem Redux** — complexidade desnecessária para este escopo

### 4.2 Data Fetching

```typescript
// Pattern: Custom hook por entidade
export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: () => api.leads.list(filters),
  });
}

export function useMoveLeadStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, stage }: { leadId: string; stage: FunnelStage }) =>
      api.leads.updateStage(leadId, stage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}
```

### 4.3 Kanban Drag & Drop

- Usar `@dnd-kit/core` + `@dnd-kit/sortable` para drag-and-drop
- Optimistic updates via React Query mutations
- Feedback visual imediato (ghost element, drop zones iluminadas)

### 4.4 Routing

```typescript
// Wouter — rotas declarativas
import { Route, Switch } from 'wouter';

<Switch>
  <Route path="/" component={Dashboard} />
  <Route path="/crm" component={CrmKanban} />
  <Route path="/crm/list" component={CrmList} />
  <Route path="/projects" component={ProjectsKanban} />
  <Route path="/projects/list" component={ProjectsList} />
  <Route path="/tasks" component={TasksList} />
  <Route path="/tasks/kanban" component={TasksKanban} />
  <Route path="/login" component={Login} />
</Switch>
```

### 4.5 Error Handling

- Error Boundaries por módulo (não um global)
- Toast notifications para erros de API (usando Radix Toast)
- Loading states com skeletons glassmorphism
- Retry automático em falhas de rede (React Query default)

### 4.6 Mobile Drawer Pattern (Portal)

O `MobileDrawerWrapper` renderiza detail drawers de maneira responsiva:

- **Desktop:** Painel lateral inline (`motion.aside`) com animação de largura, ao lado do conteúdo.
- **Mobile:** Bottom sheet fullscreen (92vh) renderizado via `createPortal(overlay, document.body)`.

**Razão do Portal:** O `<motion.main>` no `PageLayout` aplica `transform` via Framer Motion para animar `marginLeft` da sidebar. CSS rule: `position: fixed` dentro de um ancestral com `transform` fica preso ao stacking context do ancestral. Sem portal, o overlay do bottom sheet ficaria **atrás** do `BottomNavigation` (z-50) que está fora do `<motion.main>`.

```typescript
// Padrão correto: mobile overlay via portal
if (isMobile) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm">
          <motion.div className="absolute bottom-0 left-0 right-0 max-h-[92vh] h-[92vh] ...">
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body, // Escapa do stacking context do motion.main
  );
}
```

### 4.7 Responsive Container Pattern

Nas páginas de lista (CRM, Projects, Tasks, Team), o container com `rounded-xl bg-zinc-50/50 border` é **condicional**:

```typescript
<div className={cn(
  'flex-1 min-w-0 overflow-hidden h-full',
  !isMobile && 'rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-200/60 dark:border-zinc-700/40',
)}>
```

- **Desktop:** Container com borda/fundo serve como "painel" visual ao lado do drawer inline.
- **Mobile:** Sem container — os cards ficam full-bleed, sem ruído visual.

---

## 5. Performance

| Técnica | Onde Aplicar |
|---|---|
| **Code splitting** | `React.lazy()` por página/módulo |
| **Memoization** | `useMemo` para filtros pesados, `memo` para cards do Kanban |
| **Virtual scrolling** | Listas com > 50 items (react-virtual) |
| **Optimistic updates** | Drag-and-drop no Kanban, status toggle |
| **Debounce** | Inputs de busca e filtros (300ms) |
| **Image lazy loading** | Avatares e assets |

---

## 6. Testes (Futuro)

| Tipo | Ferramenta | Escopo |
|---|---|---|
| **Unit** | Vitest | Utils, hooks, lógica de negócio |
| **Component** | Testing Library | Componentes isolados |
| **E2E** | Playwright | Fluxos críticos (criar lead, mover no kanban, transição CRM→Projetos) |

> Testes serão implementados a partir da Fase 2 do roadmap. Na Fase 1 (MVP), prioridade é validação visual + critérios de aceite manuais.
