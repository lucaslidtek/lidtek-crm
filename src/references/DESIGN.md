# Design System — Lidtek CRM & Gestão de Projetos

> **Fonte:** PRD v1.0 (Seção 10) — Brand Guidelines Lidtek.
> **Última atualização:** Abril/2026

---

## 1. Identidade e Tom de Voz

A Lidtek é uma consultoria de tecnologia que atua como departamento de TI terceirizado. O sistema interno deve refletir:

- **Profissional, mas acessível** — sem jargões visuais desnecessários
- **Direto e objetivo** — cada elemento na tela tem propósito
- **Confiante sem arrogância** — autoridade técnica com empatia visual

> O sistema é uma **ferramenta de trabalho interna** — não é um produto SaaS público. Priorizar clareza e eficiência sobre marketing.

---

## 2. Paleta de Cores

### 2.1 Cores Primárias

| Nome | HEX | HSL | Uso |
|---|---|---|---|
| **Primary (Violeta)** | `#5A4FFF` | `244 100% 65%` | Botões, CTAs, destaques, links, brand |
| **Blue Light** | `#6580E1` | `227 66% 64%` | Links secundários, acentos sutis |
| **Secondary** | `#243A4A` | `205 35% 22%` | Textos em fundo claro |

### 2.2 Cores de Fundo

| Nome | HEX | HSL | Uso |
|---|---|---|---|
| **Background Dark** | `#080808` | `0 0% 3%` | Fundo principal (dark mode **padrão**) |
| **Background Light** | `#F8F9FA` | `210 17% 98%` | Seções claras, fundos de página |
| **Background Alt** | `#FEFBFB` | `240 14% 99%` | Cards e overlays em modo claro |

### 2.3 Cores de Estado

| Estado | HEX / Referência | Uso |
|---|---|---|
| **Destructive** | `hsl(0 84% 60%)` | Erros, alertas críticos, tarefas vencidas |
| **Success** | `#10B981` (emerald-500) | Confirmações, status positivo |
| **Warning** | `#F59E0B` (amber-500) | Prazo próximo (48h), atenção |
| **Muted Light** | `hsl(0 0% 90%)` | Fundo desabilitado, inputs |
| **Muted Dark** | `hsl(0 0% 15%)` | Fundo desabilitado no dark mode |

### 2.4 Cores Semânticas do CRM

| Contexto | Cor Sugerida | Uso |
|---|---|---|
| **Funil de Vendas** | Primary (`#5A4FFF`) | Cards e badges do CRM |
| **Projetos Recorrentes** | Emerald (`#10B981`) | Badges, indicadores |
| **Projetos Únicos** | Blue Light (`#6580E1`) | Badges, indicadores |
| **Tarefa Alta prioridade** | Destructive (`hsl(0 84% 60%)`) | Badge de prioridade |
| **Tarefa Média prioridade** | Warning (`#F59E0B`) | Badge de prioridade |
| **Tarefa Baixa prioridade** | Muted | Badge de prioridade |
| **Status: Bloqueada** | Destructive | Badge de status |
| **Status: Em andamento** | Primary | Badge de status |
| **Status: Concluída** | Success | Badge de status |
| **Status: A fazer** | Muted | Badge de status |

---

## 3. Design Tokens (CSS Custom Properties)

```css
:root {
  /* Core */
  --background: 240 14% 99%;        /* #FEFBFB */
  --foreground: 0 0% 3%;            /* #080808 */
  --primary: 244 100% 65%;          /* #5A4FFF */
  --secondary: 205 35% 22%;         /* #243A4A */
  --accent: 244 100% 65%;           /* #5A4FFF */
  --blue-light: 227 66% 64%;        /* #6580E1 */

  /* Muted */
  --muted: 0 0% 90%;
  --muted-foreground: 0 0% 45%;

  /* States */
  --destructive: 0 84% 60%;
  --success: 160 84% 39%;           /* emerald-500 */
  --warning: 38 92% 50%;            /* amber-500 */

  /* Borders */
  --border: 0 0% 90%;
  --ring: 244 100% 65%;

  /* Radius */
  --radius: 0.5rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;
  --radius-2xl: 2rem;
}

.dark {
  --background: 0 0% 3%;            /* #080808 */
  --foreground: 240 14% 99%;        /* #FEFBFB */
  --primary: 244 100% 65%;          /* #5A4FFF — mesma em ambos modos */
  --secondary: 205 35% 22%;
  --accent: 244 100% 65%;
  --blue-light: 227 66% 64%;

  /* Muted */
  --muted: 0 0% 15%;
  --muted-foreground: 0 0% 65%;

  /* States */
  --destructive: 0 62% 30%;

  /* Borders */
  --border: 0 0% 15%;
  --ring: 244 100% 65%;
}
```

> **REGRA:** Dark mode é o padrão — o sistema abre em `.dark`.

---

## 4. Tipografia

### Famílias

| Uso | Família | Pesos | CSS Variable |
|---|---|---|---|
| **Títulos (Display)** | TT Hoves Pro | 400, 500, 600, 700 | `font-display` |
| **Corpo (Sans)** | Work Sans | 100–900 | `font-sans` |
| **Citações / Itálico** | serif (sistema) | — | `font-serif` |

### Escala Tipográfica

| Elemento | Tamanho | Peso | Tracking | Outras |
|---|---|---|---|---|
| **H1** | `clamp(2.5rem, 8.5vw, 4.5rem)` | 700 | tight | TT Hoves Pro |
| **H2** | `text-3xl → text-6xl` | 600-700 | tight | TT Hoves Pro |
| **H3** | `text-2xl → text-4xl` | 600 | tight | TT Hoves Pro |
| **Body** | `text-base` (16px) | 400 | normal | Work Sans, leading-relaxed |
| **Body Small** | `text-sm` (14px) | 400 | normal | Work Sans |
| **Tags / Labels** | `text-[10px] → text-xs` | 600 | `0.15em → 0.3em` | **SEMPRE UPPERCASE** |
| **Botões** | `text-[11px] → text-sm` | 700 | `0.2em` | **UPPERCASE**, Work Sans |

### Regras Tipográficas

- Todos os headings usam **TT Hoves Pro** com `tracking-tight`
- Tags e labels são **SEMPRE UPPERCASE** com tracking de `0.15em` a `0.3em`
- Botões: `font-bold uppercase tracking-[0.2em] text-[11px]` a `text-sm`
- Corpo usa **Work Sans** com `leading-relaxed`

---

## 5. Espaçamento e Layout

| Propriedade | Valor | Observações |
|---|---|---|
| **Max width** | `max-w-7xl` (1280px) | Container principal |
| **Padding horizontal** | `px-6` (mobile) / `px-12` (desktop) | Margens laterais |
| **Padding vertical (seção)** | `py-20-32` / `py-32-40` desktop | Espaçamento entre seções |
| **Grid** | 1 coluna → 12 colunas (desktop) | Mobile-first |
| **Border radius (cards)** | `rounded-[2rem]` a `rounded-[2.5rem]` | Cards grandes |
| **Border radius (botões)** | `rounded-full` | Botões e navbar |
| **Border radius (pequenos)** | `rounded-2xl` (1rem) | Elementos menores |

### Layout do CRM (Específico)

| Elemento | Layout |
|---|---|
| **Navbar lateral (Sidebar)** | Fixa à esquerda, colapsável, glass effect |
| **Kanban Board** | Grid horizontal com scroll, colunas de largura fixa (~300px) |
| **Kanban Card** | Min-height ~120px, padding `p-4 → p-6` |
| **Lista (Table View)** | Full-width, rows com hover state |
| **Dashboard** | Grid 2-3 colunas, cards de resumo |

---

## 6. Componentes Principais

### 6.1 Botão Primário (CTA)

```
Padding:      px-8 a px-10, py-4 a py-5
Background:   bg-primary (#5A4FFF)
Texto:        branco, font-bold, uppercase, tracking-[0.2em], text-[11px] a text-sm
Border:       rounded-full
Sombra:       shadow-[0_10px_30px_rgba(90,79,255,0.3)]
Hover:        scale-105 + sombra ampliada
Active:       scale-95
Transição:    300ms ease
```

### 6.2 Tag / Label

```
Texto:        text-[10px] a text-xs, uppercase, tracking-[0.2em], font-semibold
Cor:          primary (#5A4FFF)
Decoração:    linhas laterais (w-8 h-[1px] bg-primary/40)
Regra:        NUNCA em caixa baixa
```

### 6.3 Navbar / Sidebar

```
Posição:      fixed left-0, full-height
Width:        w-64 (expandido) / w-16 (colapsado)
Dark mode:    bg-black/40 backdrop-blur-[32px] saturate-[180%] border-white/10
Light mode:   bg-white/70 backdrop-blur-[32px] border-black/5
```

### 6.4 Cards — Kanban (Dark Mode)

```
Border:       rounded-[1.5rem a 2rem]
Background:   bg-black/40 (ou bg-white/5)
Backdrop:     backdrop-blur-[32px] saturate-[180%]
Border:       border-white/10
Hover:        translate-y-[-4px] + bg-black/60
Transição:    600ms cubic-bezier(0.16, 1, 0.3, 1)
Cursor:       grab / grabbing (no drag)
```

### 6.5 Cards — Kanban (Light Mode)

```
Border:       rounded-[2rem]
Background:   bg-white
Sombra:       shadow-[0_15px_35px_rgba(0,0,0,0.05)]
Border:       conic-gradient animado (sutil)
Min-height:   120px
Padding:      p-4 a p-6
Hover:        background lilás suave
```

### 6.6 Modal / Dialog

```
Overlay:      bg-black/60 backdrop-blur-sm
Card:         glass-card, rounded-2xl, p-8
Animação:     fade-in + scale de 0.95 → 1
Max-width:    max-w-lg (padrão) / max-w-2xl (formulários)
```

### 6.7 Badge (Status / Prioridade)

```
Padding:      px-2.5 py-0.5
Font:         text-xs font-semibold uppercase tracking-wider
Border:       rounded-full
Variantes:    primary, success, warning, destructive, muted
```

### 6.8 Input / Form Field

```
Background:   bg-muted/50 (dark: bg-white/5)
Border:       border border-border
Focus:        ring-2 ring-primary/30
Padding:      px-4 py-2.5
Radius:       rounded-xl
Placeholder:  text-muted-foreground
```

---

## 7. Glassmorphism (Padrão do Projeto)

> **Glassmorphism é obrigatório** em: navbar, sidebar, cards, modais, overlays, dropdowns, tooltips.

### Dark Mode

```css
.glass-card {
  background: rgba(0, 0, 0, 0.4);         /* bg-black/40 */
  backdrop-filter: blur(40px) saturate(2.5);
  border: 1px solid rgba(255, 255, 255, 0.2);  /* border-white/20 */
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}
```

### Light Mode

```css
.glass-card {
  background: rgba(255, 255, 255, 0.4);   /* bg-white/40 */
  backdrop-filter: blur(40px) saturate(2.5);
  border: 1px solid rgba(255, 255, 255, 0.5);  /* border-white/50 */
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}
```

---

## 8. Animações e Transições

### Tabela de Transições

| Tipo | Easing | Duração |
|---|---|---|
| **Scroll reveal** | `cubic-bezier(0.16, 1, 0.3, 1)` | 0.8s |
| **Hover (scale)** | `ease` | 0.3s |
| **Card expand** | `cubic-bezier(0.16, 1, 0.3, 1)` | 0.7s |
| **Navbar transition** | `cubic-bezier(0.23, 1, 0.32, 1)` | 0.7s |
| **Button press** | `ease` | 0.3s |
| **Modal enter** | `cubic-bezier(0.16, 1, 0.3, 1)` | 0.4s |
| **Drag ghost** | `ease` | 0.15s |

### Glows Decorativos

```
Esferas:      500-800px, bg-primary/5-20, blur-[100-150px], rounded-full
Posição:      fora do viewport parcialmente
Interação:    pointer-events-none (SEMPRE)
Mouse follow: w-600px h-600px bg-primary/20 blur-[120px] mix-blend-screen (desktop only: hidden md:block)
```

### Regras de Animação

- Animações são **sutis** — scroll-triggered com `once: true`
- Nunca animações em loop que distraiam do trabalho
- Drag-and-drop precisa de feedback **imediato** (< 100ms)
- Loading states com skeleton pulse (não spinners)

---

## 9. Padrões de Tela

| Tipo de Tela | Background | Texto Principal | Border |
|---|---|---|---|
| **Dashboard / Main** | `#080808` (dark) | white / white/70 | border-white/5-10 |
| **Seções alternadas** | `#F8F9FA` (light) | black / black/70 | border-black/10 |
| **Cards Light** | `#FEFBFB` | black | white com conic-gradient |
| **Modais** | glass-card | foreground | border-white/10 |

---

## 10. Ícones e Assets

| Elemento | Especificação |
|---|---|
| **Biblioteca** | Lucide React — estilo outline |
| **Tamanho padrão** | `w-5 h-5` (dentro de botões/nav) ou `w-6 h-6` (standalone) |
| **Cor padrão** | `text-primary` (`#5A4FFF`) em container `bg-primary/10` |
| **Logo wordmark** | `lidtek-primary-logo_white.png` — branco (navbar), `class='invert'` em seções claras |
| **Símbolo da marca** | X angular (SVG) como watermark com opacity 3-5% |

---

## 11. Padrões Mobile PWA

O sistema implementa uma interface híbrida para suportar visão nativa em dispositivos móveis (App-like feel).

### 11.1 Detecção Mobile

```typescript
// useIsMobile() — breakpoint: 640px (sm)
const isMobile = useIsMobile();
```

Usado em: `CrmKanban`, `TasksKanban`, `ProjectsPage`, `TeamPage`, `Dashboard`, `ProjectListView`, `PageLayout`, `MobileDrawerWrapper`.

### 11.2 Navegação

| Elemento | Mobile | Desktop |
|---|---|---|
| **Sidebar** | Hidden (`hidden md:flex`) | Fixa à esquerda |
| **BottomNavigation** | Tab bar fixa (`z-50`), 5 itens com touch targets ≥ 48px | Hidden |
| **PageHeader** | Stacking vertical, botões menores | Horizontal |

### 11.3 Bottom Sheet (MobileDrawerWrapper)

O `MobileDrawerWrapper` renderiza detail drawers de forma responsiva:

```
Desktop → motion.aside inline (largura animada, ao lado do conteúdo)
Mobile  → createPortal(bottom sheet, document.body)
```

**Specs do Bottom Sheet:**

| Propriedade | Valor |
|---|---|
| **Altura** | `h-[92vh] max-h-[92vh]` |
| **Z-index** | `z-[60]` (acima do BottomNavigation z-50) |
| **Overlay** | `bg-black/50 backdrop-blur-sm` |
| **Radius** | `rounded-t-2xl` |
| **Animação** | Slide-up: `y: 100% → 0`, easing `[0.16, 1, 0.3, 1]`, 350ms |
| **Drag handle** | `.drag-handle` centralizado (32×4px, rounded, bg-zinc-300) |
| **Scroll** | `overflow-y-auto overscroll-contain safe-bottom` |

> **⚠️ Portal obrigatório:** Sem portal, `position: fixed` dentro de `<motion.main>` (que tem `transform`) fica preso ao stacking context do ancestral. Ver `ARCHITECTURE.md §4.6`.

### 11.4 Containers Responsivos

Nas páginas de lista (CRM, Projects, Tasks, Team), o container visual é **condicional**:

| Viewport | Container |
|---|---|
| **Desktop** | `rounded-xl bg-zinc-50/50 border border-zinc-200/60` |
| **Mobile** | Sem container — cards full-bleed, sem ruído visual |

```typescript
<div className={cn(
  'flex-1 min-w-0 overflow-hidden h-full',
  !isMobile && 'rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 border ...',
)}>
```

### 11.5 Cards Mobile — TaskCard

O `TaskCard` tem layout otimizado para mobile:

| Elemento | Desktop | Mobile |
|---|---|---|
| **Entidade vinculada** | Chip colorido no topo | Idem — ícone + nome (Briefcase=projeto, User=lead) |
| **Título** | `line-clamp-2` | `line-clamp-3` + `pr-14` (evita colisão com botões) |
| **Botões editar/excluir** | Hover only | **Sempre visíveis** (`opacity-100 sm:opacity-0`) |
| **Touch target dos botões** | 24px | 28px (`w-7 h-7`) + `press-scale` |
| **Footer** | Sem separador | `border-t border-border-subtle/50` |
| **Texto** | `10px` | `11px` — legibilidade mobile |

**Chip de entidade vinculada:**
```
Projeto → bg-blue-50 text-blue-600 + Briefcase icon
Lead    → bg-emerald-50 text-emerald-600 + User icon
```

### 11.6 Cards Mobile — ProjectListView

O item de projeto tem **dois layouts distintos**:

**Desktop:** Linha horizontal com 6 elementos (chevron, ícone, nome, badge, sprint, counter, owner).

**Mobile:** Layout empilhado em 2 linhas:
- **Linha 1:** ícone + nome do cliente (`line-clamp-2`) + type badge + chevron expand
- **Linha 2:** sprint ativa (`line-clamp-2`, sem truncate) + sprint counter + owner avatar

**SprintRow Mobile:**
- **Linha 1:** checkbox + nome da sprint (sem truncate, wrap natural) + botão delete (sempre visível)
- **Linha 2:** badges (ativa, prioridade, estágio) + data — com `flex-wrap`
- **Edição:** Tap para editar (em vez de double-click)

### 11.7 Safe Areas (Notch & Home Indicator)

```html
<!-- index.html -->
<meta name="viewport" content="..., viewport-fit=cover">
```

```css
/* globals.css */
.safe-bottom { padding-bottom: max(env(safe-area-inset-bottom), 0px); }
```

Elementos que usam `safe-bottom`: `BottomNavigation`, `MobileDrawerWrapper` (sheet content).

### 11.8 Utilities Mobile

| Classe CSS | Uso | Definição |
|---|---|---|
| `.press-scale` | Feedback tátil em buttons/cards | `active:scale-[0.97] transition-transform` |
| `.safe-bottom` | Padding para Home Indicator iOS | `padding-bottom: env(safe-area-inset-bottom)` |
| `.drag-handle` | Handle visual de bottom sheet | `w-8 h-1 rounded-full bg-zinc-300` |
| `.hide-scrollbar` | Tab bars horizontais | Oculta scrollbar nativa mantendo scroll |

---

## 12. Regras de Ouro

1. **Dark mode é o padrão** — o sistema abre em `.dark`
2. **Nunca use cores puras** — sempre com opacidade (`white/70`, `primary/20`)
3. **Glassmorphism em tudo** — navbar, cards, modais, overlays, dropdowns
4. **Animações são sutis** — o sistema é ferramenta de trabalho, não showcase
5. **Tracking generoso nos labels** — mínimo `0.15em`, ideal `0.2em`
6. **Sempre `overflow-hidden` nas seções** — para conter glows decorativos
7. **`pointer-events-none` em todos os elementos decorativos**
8. **Hierarquia visual via opacidade** — não via tamanho excessivo
9. **Mobile-first** — efeitos complexos apenas em `md:` ou `lg:`
10. **Consistência > criatividade** — usar tokens, nunca valores hardcoded
11. **Portal para overlays mobile** — sempre usar `createPortal` para bottom sheets
12. **Touch targets ≥ 44px** — botões e áreas clicáveis no mobile
13. **Sem container visual no mobile** — cards full-bleed, limpo
14. **Entidades vinculadas sempre visíveis** — chip colorido com ícone, não texto muted

