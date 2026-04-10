# 022 — UI: Redesign do LeadDetailDrawer como CRM

## Descrição
Redesenhar o componente `LeadDetailDrawer` para funcionar como uma ficha de empresa completa de CRM: header com logo + nome/razão social, seção de dados da empresa (CNPJ, website, endereço), seção de contatos com emails e telefones múltiplos (+/-), e info cards reorganizados.

## Módulo
M1 — Funil de Vendas (CRM) / F02 — Cadastro e edição de leads

## Prioridade
**Alta**

## Dependências
- `021-lead-types-api-update` (types e API prontos)

## Arquivos
| Ação | Arquivo |
|------|---------|
| MODIFY | `src/modules/crm/components/LeadDetailDrawer.tsx` |

## Layout Proposto
```
┌─────────────────────────────────────────┬──────────────┐
│ [BADGES]                           [X]  │  ATIVIDADE   │
│ ┌──────┐ Nome Fantasia (editable)       │  (timeline)  │
│ │ LOGO │ Razão Social (editable)        │              │
│ └──────┘ Website (editable)             │              │
│                                         │              │
│ ─── DADOS DA EMPRESA ───                │              │
│ CNPJ | Endereço                         │              │
│                                         │              │
│ ─── CONTATOS ───                        │              │
│ 📧 email1@...              [🗑️]        │              │
│ 📧 email2@...              [🗑️]        │              │
│ [+ Adicionar email]                     │              │
│ 📱 (11)99999-0000 [WA]    [🗑️]        │              │
│ [+ Adicionar telefone]                  │              │
│                                         │              │
│ ─── INFORMAÇÕES ───                     │              │
│ $ Valor | 🏷️ Origem | 👤 Resp | etc     │              │
│                                         │              │
│ 📝 Observações                          │              │
│ [texto livre editável]                  │              │
└─────────────────────────────────────────┴──────────────┘
```

## Componentes Internos Novos
- `LogoSection` — Avatar circular com iniciais + click para editar URL
- `MultiField` — Campo para listas (emails/phones) com botões +/-
- `CnpjField` — Input com máscara XX.XXX.XXX/XXXX-XX
- Seção "Dados da Empresa" agrupada
- Seção "Contatos" agrupada

## Checklist
- [ ] Header com logo (iniciais + URL editável)
- [ ] Nome fantasia editável
- [ ] Razão social editável
- [ ] Website editável com link externo
- [ ] Seção "Dados da Empresa" com CNPJ (máscara) e endereço
- [ ] Seção "Contatos" com emails múltiplos (+/-)
- [ ] Seção "Contatos" com telefones múltiplos (+/-) com botão WhatsApp
- [ ] Info cards reorganizados (Valor, Origem, Responsável, Próx. Contato, Cobrança)
- [ ] Observações (já existe, manter)
- [ ] Manter funcionalidades existentes (Converter em Projeto, Projeto vinculado, etc.)
- [ ] Dark mode first
- [ ] Verificar responsividade
