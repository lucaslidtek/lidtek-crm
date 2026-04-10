# Plan 022 — UI: Redesign do LeadDetailDrawer como CRM

## Descrição
Redesenhar o `LeadDetailDrawer` para funcionar como ficha de empresa de CRM profissional, com seções agrupadas, logo, campos múltiplos de email/phone, CNPJ formatado, website, endereço e razão social.

## Módulo
M1 — Funil de Vendas (CRM) / F02 — Cadastro e edição de leads

## Arquivos

| Ação | Arquivo | O que muda |
|------|---------|------------|
| MODIFY | `src/modules/crm/components/LeadDetailDrawer.tsx` | Redesign completo do conteúdo (preservar estrutura de modal/portal) |

## Pesquisa Interna

### Componentes reutilizáveis já existentes:
- `EditableText` — input inline para campos simples ✅ (manter)
- `EditableTextArea` — textarea inline ✅ (manter)
- `FieldCard` — card com ícone/label/valor ✅ (manter)
- `OwnerFieldCard` — seletor de responsável ✅ (manter)
- `BillingFieldCard` — seletor de cobrança ✅ (manter)
- `Badge` de `@/shared/components/ui/Badge` ✅
- `Button` de `@/shared/components/ui/Button` ✅
- `WhatsAppIcon` ✅

### Ícones Lucide necessários (novos):
- `Globe` — website
- `Building2` — razão social / empresa
- `MapPin` — endereço
- `Plus` — botão de adicionar
- `Trash2` — botão de remover
- `Image` — logo placeholder
- `Link` — URL da logo

### Estrutura preservada:
- Portal via `createPortal()`
- Backdrop animado (framer-motion)
- Modal centralizado com max-w-[900px]
- Layout 2 colunas: esquerda (conteúdo) + direita (atividade)
- Botão de fechar

## Layout Final

```
┌─────────────────────────────────────────────────────┬────────────────┐
│ [BADGES: Stage + Projeto]                      [X]  │                │
│                                                     │   ATIVIDADE    │
│  ┌────────┐  Nome Fantasia ✏️  (EditableText)       │   (sidebar)    │
│  │  LOGO  │  Razão Social ✏️  (EditableText)        │                │
│  │  64x64 │  🌐 website.com ✏️ → abre em nova aba   │   [timeline    │
│  └────────┘                                         │    igual       │
│                                                     │    atual]      │
│  ─── DADOS DA EMPRESA ──────────────────────────    │                │
│  ┌──────────────────┬──────────────────────────┐    │                │
│  │ 🏢 CNPJ          │ 📍 ENDEREÇO              │    │                │
│  │ XX.XXX.XXX/XXXX  │ Rua Tal, 123...          │    │                │
│  └──────────────────┴──────────────────────────┘    │                │
│                                                     │                │
│  ─── CONTATOS ──────────────────────────────────    │                │
│  📧 juliana@construtora.com.br           [ 🗑️ ]    │                │
│  📧 caio@construtora.com.br              [ 🗑️ ]    │                │
│  [ + Adicionar email ]                              │                │
│                                                     │                │
│  📱 (11) 99999-0000  [WhatsApp]          [ 🗑️ ]    │                │
│  [ + Adicionar telefone ]                           │                │
│                                                     │                │
│  ─── INFORMAÇÕES ───────────────────────────────    │                │
│  ┌────────┬──────────┬────────┬────────┬────────┐   │                │
│  │$ Valor │🏷️ Origem│👤 Resp │📅 Próx │💰 Cobr │   │                │
│  └────────┴──────────┴────────┴────────┴────────┘   │                │
│                                                     │                │
│  📝 Observações                                     │                │
│  ┌─────────────────────────────────────────────┐    │                │
│  │ CNPJ: 05.776... (texto livre legado)        │    │                │
│  └─────────────────────────────────────────────┘    │                │
│                                                     │                │
│  [Converter em Projeto] / [Ver Projeto →]           │                │
└─────────────────────────────────────────────────────┴────────────────┘
```

## Componentes Internos Novos

### 1. `LogoSection`
- Círculo 64x64 com iniciais do nome (fallback)
- Se `logoUrl` existe, exibe a imagem
- Hover: overlay com ícone de editar
- Click: abre mini-form para colar URL da logo
- Cores: `bg-primary/10` com iniciais em `text-primary`

### 2. `MultiField` (genérico para emails e phones)
```typescript
interface MultiFieldProps {
  icon: React.ReactNode;
  label: string;
  items: string[];
  onAdd: (value: string) => void;
  onRemove: (index: number) => void;
  placeholder: string;
  type?: 'email' | 'tel' | 'text';
  renderAction?: (item: string, index: number) => React.ReactNode;
}
```
- Lista items existentes com botão de remover (🗑️) em cada
- Botão "+ Adicionar" na base → muda pra input inline
- Input com Enter para confirmar, Esc para cancelar
- Para phones: cada item mostra botão WhatsApp ao lado

### 3. `SectionHeader`
- Label uppercase com ícone e linha divisória sutil
- Padrões DESIGN.md: `text-[10px] font-semibold uppercase tracking-[0.15em]`

### 4. `CnpjField` (extensão do FieldCard)
- Usa o `FieldCard` existente
- Formata visualmente: `XX.XXX.XXX/XXXX-XX`
- Salva sem formatação
- Máscara aplicada no input durante edição

## Design Tokens (DESIGN.md compliance)

| Elemento | Token/Classe |
|----------|-------------|
| Logo circle | `bg-primary/10 text-primary font-bold` |
| Section label | `text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400` |
| Section divider | `border-t border-zinc-100 dark:border-zinc-800` |
| Add button | `text-xs text-primary hover:text-primary/80 font-medium` |
| Remove button | `text-zinc-400 hover:text-red-500 transition-colors` |
| Multi-field item | `flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50` |
| Inline input (add) | `bg-transparent border-b border-primary/40 text-sm outline-none` |

## Cenários

| Cenário | Comportamento |
|---------|--------------|
| Lead sem logo | Exibe círculo com iniciais (2 primeiras letras do nome) |
| Lead com logoUrl | Exibe imagem dentro do círculo, com object-cover |
| Logo URL inválida | onError → fallback para iniciais |
| Lead sem emails | Mostra apenas botão "+ Adicionar email" |
| Lead com 3 emails | Lista os 3, cada um com botão remover |
| Adicionar email | Botão vira input, Enter salva, Esc cancela |
| Remover email | Remove do array, salva imediatamente via updateLead |
| Lead com phone antigo + phones[] | phone antigo como primeiro, phones[] como extras |
| CNPJ editado | Auto-formata para XX.XXX.XXX/XXXX-XX |
| Website clicável | Ícone de link externo ao lado que abre em nova aba |
| Campo vazio (qualquer) | Exibe "Adicionar..." clicável |
| Permissão readOnly | Todos os campos não editáveis, sem botões +/- |

## Checklist
- [ ] Adicionar imports: `Globe`, `Building2`, `MapPin`, `Plus`, `Trash2`, `Image`, `Link`
- [ ] Criar `LogoSection` com iniciais + URL editável
- [ ] Criar `SectionHeader` reutilizável
- [ ] Criar `MultiField` para emails
- [ ] Criar `MultiField` para phones (com WhatsApp action)
- [ ] Header redesenhado: logo + nome + razão social + website
- [ ] Seção "Dados da Empresa": CNPJ + Endereço (2 FieldCards lado a lado)
- [ ] Seção "Contatos": emails + phones com MultiField
- [ ] Seção "Informações": grid de FieldCards (Valor, Origem, Responsável, Próx. Contato, Cobrança)
- [ ] Seção "Observações" (manter EditableTextArea)
- [ ] Converter em Projeto / Projeto vinculado (manter)
- [ ] `handleFieldSave` atualizado: cnpj, emails, phones, logoUrl, website, razaoSocial, endereco
- [ ] Dark mode: todas as classes com `dark:` variant
- [ ] Permissões: readOnly desativa edição em todos os novos campos
