# Workflow de Desenvolvimento — Lidtek CRM & Gestão de Projetos

> **Este documento é uma DIRETIVA OPERACIONAL.** O agent DEVE seguir estas fases ao receber qualquer solicitação de feature, refatoração ou correção não-trivial neste projeto.

---

## Sobre o Projeto

**Sistema interno de CRM integrado à gestão de projetos** para a Lidtek — consultoria de TI que atua como departamento de tecnologia terceirizado para empresas em crescimento.

O sistema centraliza o ciclo completo de relacionamento com clientes: desde o primeiro contato comercial até a entrega e manutenção de projetos em andamento.

### Personas do Sistema

| Persona | Necessidades Principais |
|---|---|
| **Gestor Comercial** | Visão rápida do funil de vendas, alertas de follow-ups vencidos |
| **Gerente de Projetos** | Kanban por tipo de projeto, filtros ágeis, gestão de sprints |
| **Sócio / Diretor** | Dashboard consolidado: leads, projetos ativos, próximas entregas |
| **Desenvolvedor / Analista** | Tarefas pendentes do dia, vinculadas ao seu projeto/sprint |

---

## Módulos do Sistema

O sistema é composto por **4 módulos principais** + infraestrutura transversal:

| # | Módulo | Descrição | Funcionalidades-Chave |
|---|---|---|---|
| M1 | **Funil de Vendas (CRM)** | Pipeline comercial: prospecção → contrato assinado | Kanban, CRUD leads, histórico de interações, follow-ups |
| M2 | **Funil de Desenvolvimento** | Projetos ativos: recorrentes + únicos | Kanban por tipo, sprints, transição automática do CRM |
| M3 | **Gestão de Tarefas** | Tarefas de projeto, vendas e avulsas | Lista + Kanban, filtros por tipo/status/responsável/prazo |
| M4 | **Dashboard Inicial** | Visão consolidada e acionável | Resumo de funis, tarefas do dia, atividade recente, atalhos |
| — | **Auth & Segurança** | Autenticação e permissões | Login, perfis (Admin/Gestor/Colaborador/Leitura), audit logs |

### Etapas do Funil de Vendas

```
Prospecção → 1ª Reunião → Briefing → Proposta Enviada → Negociação → Contrato Enviado → Contrato Assinado → [Transição auto → M2]
                                                                                                          → Perdido/Arquivado
```

### Tipos de Projeto (Funil de Desenvolvimento)

| Tipo | Descrição | Sprints |
|---|---|---|
| **Recorrente** | Contrato de manutenção/mensalidade. Modelo "TI terceirizado" | Contínuas |
| **Único (One-shot)** | Escopo e prazo definidos | Sequenciais até entrega |

### Etapas de Projeto (Dinâmicas por Sprint)

```
Onboarding/Kickoff → Levantamento e Arquitetura → Desenvolvimento Sprint [N] → Revisão/Ajustes → Homologação → Deploy/Entrega → Suporte Pós-entrega/Recorrência
```

---

## Roadmap de Entregas

| Fase | Período | Entregas |
|---|---|---|
| **Fase 1 — MVP** | Semanas 1–6 | Funil de Vendas (Kanban + CRUD leads), Funil de Desenvolvimento (Kanban + sprints), Módulo de Tarefas básico |
| **Fase 2 — Essencial** | Semanas 7–10 | Transição automática CRM → Projetos, Dashboard Inicial, Filtros e lista, Alertas de tarefas vencidas |
| **Fase 3 — Aprimoramento** | Semanas 11–14 | Histórico de sprints e interações, Controle de permissões, Campos customizáveis, Etiquetas livres |
| **Fase 4 — Expansão** | Futuro | Relatórios/exportações, Integrações externas, Portal do cliente |

> **REGRA:** Seguir a ordem das fases. Não implementar features de Fase 2+ enquanto Fase 1 não estiver completa e validada.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework | React 19 + TypeScript |
| Routing | Wouter (client-side) |
| CSS | Tailwind CSS v4 + CSS custom properties |
| Animações | Framer Motion |
| Smooth Scroll | Lenis |
| Ícones | Lucide React |
| Componentes UI | Radix UI (primitives) |
| Build | Vite 7 |
| Deploy | Vercel |
| Fontes | TT Hoves Pro (local) + Work Sans (Google Fonts) |

---

## Pipeline Obrigatório

```
BOOTSTRAP → SPEC → BREAK → PLAN → EXECUTE → VERIFY
```

**Cada fase produz um entregável.** O agent não avança para a próxima fase sem aprovação do usuário (exceto quando o usuário explicitamente autoriza execução autônoma).

---

## Fase 0: BOOTSTRAP (Garantir Documentação Base)

**Trigger:** Início de qualquer trabalho no projeto. Executar **uma única vez** — se os docs já existem, pular para Fase 1.

**O que fazer:**
1. Verificar se os 3 docs de referência existem em `src/references/`:

| Doc | Caminho | O que contém |
|---|---|---|
| **Architecture** | `src/references/ARCHITECTURE.md` | Stack tecnológica, estrutura de pastas, padrões de código, convenções de naming |
| **Design System** | `src/references/DESIGN.md` | Paleta de cores, tipografia, componentes UI, tokens, regras visuais (ver Seção 10 do PRD) |
| **Business Rules** | `src/references/BUSINESS_RULES.md` | Regras de negócio: funis, transições, tipos de projeto, tarefas, permissões |

2. Para **cada doc que NÃO existir**, extrair do PRD (`PRD_Lidtek_CRM_Gestao_Projetos.docx`) e complementar com perguntas ao usuário:

### Se falta `ARCHITECTURE.md`:
- Usar stack do PRD (React 19, TypeScript, Vite 7, Wouter, Tailwind v4, Radix, Framer Motion)
- Definir estrutura de pastas (sugestão: feature-based modules)
- Documentar convenções de código e patterns
- Perguntar ao usuário: decisões de backend (API, banco, auth provider)

### Se falta `DESIGN.md`:
- Extrair Seção 10 do PRD: paleta, tipografia, tokens, componentes, glassmorphism
- Cores primárias: `#5A4FFF` (Primary), `#6580E1` (Blue Light), `#243A4A` (Secondary)
- Backgrounds: `#080808` (Dark), `#F8F9FA` (Light), `#FEFBFB` (Alt)
- Dark mode é o PADRÃO
- Glassmorphism em tudo (navbar, cards, modais, overlays)

### Se falta `BUSINESS_RULES.md`:
- Extrair Seções 1-5 do PRD: módulos, fluxos, etapas, tipos de tarefa
- Documentar: transição automática CRM → Projetos, lógica de sprints, tipos de tarefa
- Registrar critérios de aceite (Seção 8 do PRD)
- Perguntar ao usuário sobre regras não documentadas no PRD

3. Com as respostas, **gerar os docs** e apresentar ao usuário para revisão.

**Entregável:** Os 3 docs criados/validados em `src/references/`

**Gate:** ✅ Usuário confirma que os docs refletem a realidade do projeto

> **Nota:** Se o agent conseguir inferir informações a partir do código existente (ex: analisar `package.json`, estrutura de pastas, arquivos de config), deve fazer isso ANTES de perguntar — perguntar apenas o que não consegue deduzir.

---

## Fase 1: SPEC (Entender o Escopo)

**Trigger:** Usuário pede uma feature, melhoria, ou o agent identifica uma necessidade.

**O que fazer:**
1. Ler os docs de referência relevantes (`BUSINESS_RULES.md`, `ARCHITECTURE.md`, `DESIGN.md`)
2. **Consultar o PRD** para verificar se a feature solicitada está no escopo e em qual fase do roadmap
3. Analisar os arquivos existentes impactados (grep, view_file)
4. Documentar o que precisa mudar — de forma clara e técnica
5. Identificar qual **módulo** (M1-M4) e qual **funcionalidade** (F01-F14) do PRD é afetada

**Entregável:** Resumo do escopo apresentado ao usuário (pode ser inline na conversa ou um artifact)

**Gate:** ✅ Usuário confirma o escopo

---

## Fase 2: BREAK (Quebrar em Issues)

**O que fazer:**
1. Pegar o escopo aprovado e dividir em **issues atômicas** — cada uma executável em uma única sessão de contexto
2. Numerar sequencialmente: `issues/001-*.md`, `issues/002-*.md`, etc.
3. Cada issue deve ter: título, descrição curta (3-5 linhas), módulo afetado (M1-M4), prioridade, dependências

**Regras:**
- Uma issue = uma unidade de trabalho isolada (1 página, 1 comportamento, 1 fix)
- Priorizar: **protótipo visual (UI) antes da funcionalidade (lógica)**
- Consultar `BUSINESS_RULES.md` para identificar validações, edge cases e regras de domínio que impactam a issue
- Se o escopo é pequeno (1-2 arquivos, <50 linhas de mudança), pode pular a criação formal de issues
- Respeitar dependências entre módulos: M1 (CRM) antes de M2 (Projetos) antes de M3 (Tarefas) antes de M4 (Dashboard)

**Entregável:** Pasta `issues/` com arquivos markdown

**Gate:** ✅ Usuário revisa a lista de issues

---

## Fase 3: PLAN (Planejar Cada Issue)

**O que fazer para cada issue, antes de escrever qualquer código:**

### 3.1 Pesquisa Interna
- `grep_search` por componentes, funções e padrões que já existem no projeto
- Identificar código reutilizável — NUNCA duplicar
- Verificar `ARCHITECTURE.md` para saber onde cada coisa mora
- Consultar `BUSINESS_RULES.md` para validar que a implementação respeita as regras de domínio (fórmulas, fluxos, campos obrigatórios)
- Verificar `DESIGN.md` para garantir conformidade visual (glassmorphism, tokens, tipografia)

### 3.2 Pesquisa Externa (se necessário)
- Consultar documentação de libs usadas no projeto (Radix UI, Framer Motion, Wouter)
- Buscar patterns comprovados para o problema

### 3.3 Escrever o Plan

| Seção | Conteúdo |
|---|---|
| **Descrição** | O que é a tarefa e por que é necessária |
| **Módulo** | Qual módulo (M1-M4) e funcionalidade (F01-F14) do PRD é afetada |
| **Arquivos** | Quais arquivos `[MODIFY]` / `[NEW]` / `[DELETE]` — e O QUE muda em cada um |
| **Dados** | Modelos, interfaces ou campos que mudam |
| **Cenários** | Happy path + edge cases |
| **Design** | Tokens, componentes e regras visuais do DESIGN.md que se aplicam |
| **Checklist** | Lista de tarefas verificável |

> **REGRA DE OURO:** Se não está no plan, não mexe. O plan é o contrato — protege contra edições acidentais em arquivos errados.

**Entregável:** `plans/00X-*.md`

**Gate:** ✅ Usuário aprova o plan (ou autoriza execução direta)

---

## Fase 4: EXECUTE (Implementar)

**O que fazer:**
1. Implementar **APENAS** o que está no plan — nada além
2. Seguir os padrões de código do projeto (ver `ARCHITECTURE.md` e `DESIGN.md`)
3. Respeitar as regras de negócio documentadas em `BUSINESS_RULES.md` (campos obrigatórios, fórmulas, fluxos de dados)
4. Reutilizar componentes existentes antes de criar novos
5. Fazer edits cirúrgicos — jamais reescrever um arquivo inteiro
6. **Dark mode é o padrão** — sempre implementar dark first
7. **Glassmorphism** em todos os elementos de superfície (cards, modais, dropdowns, navbar)
8. **Drag-and-drop** nativo nos Kanbans
9. **Feedback visual imediato** em todas as ações do usuário

**Entregável:** Código implementado

---

## Fase 5: VERIFY (Validar)

**O que fazer:**
1. Verificar visualmente no browser (browser_subagent) que a mudança funciona
2. Capturar screenshots como evidência
3. Confirmar que não quebrou nada adjacente
4. Atualizar o checklist da issue (marcar `[x]`)
5. **Validar critérios de aceite do PRD** (Seção 8) quando aplicável:

### Critérios de Aceite por Módulo

#### Funil de Vendas (M1)
- [ ] Lead pode ser criado em menos de 30 segundos com os campos obrigatórios
- [ ] Kanban exibe todos os leads organizados por etapa sem refresh manual
- [ ] Ao mover para 'Contrato Assinado', sistema exibe modal de confirmação e cria projeto automaticamente
- [ ] Tarefas vinculadas ao lead aparecem tanto na aba de Tarefas quanto no card do lead

#### Funil de Desenvolvimento (M2)
- [ ] Cada projeto exibe sprint/etapa atual de forma legível no card do Kanban
- [ ] Ao criar ou editar sprint, estágio do card é atualizado em tempo real
- [ ] É possível filtrar projetos por tipo (recorrente / único) com um clique

#### Gestão de Tarefas (M3)
- [ ] Tarefas de projeto, vendas e avulsas aparecem na mesma lista, diferenciadas visualmente por tipo
- [ ] É possível criar tarefa avulsa em menos de 20 segundos a partir de qualquer tela
- [ ] Tarefas vencidas em vermelho; prazo em 48h em amarelo

#### Dashboard (M4)
- [ ] Dashboard carrega em menos de 2 segundos com dados atualizados
- [ ] 'Minhas Tarefas do Dia' exibe apenas tarefas atribuídas ao usuário logado com vencimento hoje ou atrasadas
- [ ] Clicar em qualquer item do dashboard leva diretamente ao contexto correspondente

**Entregável:** Walkthrough com screenshots + confirmação

---

## Funcionalidades Priorizadas (MoSCoW)

| # | Funcionalidade | Prioridade | Módulo |
|---|---|---|---|
| F01 | Funil de Vendas com etapas configuráveis e Kanban | **Alta** | CRM |
| F02 | Cadastro e edição de leads com histórico de interações | **Alta** | CRM |
| F03 | Funil de Desenvolvimento com Kanban por tipo de projeto | **Alta** | Projetos |
| F04 | Transição automática lead → projeto ao fechar contrato | **Alta** | CRM / Projetos |
| F05 | Gestão de sprints e atualização dinâmica de etapa no card | **Alta** | Projetos |
| F06 | Aba de Tarefas com os três tipos (projeto, vendas, avulsa) | **Alta** | Tarefas |
| F07 | Dashboard com resumo de pendências e tarefas do dia | **Alta** | Dashboard |
| F08 | Visualização em lista com filtros avançados | Média | CRM / Projetos |
| F09 | Alertas de tarefas vencidas e follow-ups atrasados | Média | Tarefas |
| F10 | Histórico de sprints concluídas por projeto | Média | Projetos |
| F11 | Controle de permissões por perfil de usuário | Média | Segurança |
| F12 | Campos customizáveis por etapa do funil de vendas | Baixa | CRM |
| F13 | Etiquetas (tags) livres em tarefas e projetos | Baixa | Tarefas |
| F14 | Relatórios exportáveis (CSV) de tarefas e projetos | Baixa | Geral |

---

## Documentos de Referência

| Documento | Para quê | Caminho |
|---|---|---|
| **PRD** | Fonte da verdade de requisitos | `PRD_Lidtek_CRM_Gestao_Projetos.docx` |
| **Architecture** | Estrutura de pastas, padrões, stack | `src/references/ARCHITECTURE.md` |
| **Design System** | Cores, tipografia, componentes UI, tokens | `src/references/DESIGN.md` |
| **Business Rules** | Regras de negócio extraídas do PRD e stakeholders | `src/references/BUSINESS_RULES.md` |
| **Issues** | Tarefas atômicas | `issues/*.md` |
| **Plans** | Planejamento detalhado de cada issue | `plans/*.md` |

---

## Fluxos Críticos do Sistema

### Fluxo 1: Novo Lead → Cliente Ativo

```
1. Usuário cria novo card de lead no Funil de Vendas (dados básicos)
2. Lead avança pelas etapas conforme reuniões, proposta e negociação
3. Tarefas de follow-up são criadas e vinculadas ao card do lead
4. Ao mover para 'Contrato Assinado' → sistema solicita confirmação do tipo de projeto
5. Sistema cria automaticamente um card no Funil de Desenvolvimento (dados migrados)
6. Card do lead é arquivado no Funil de Vendas (mantido no histórico)
7. Time recebe notificação do novo projeto e inicia o onboarding
```

### Fluxo 2: Gestão de Sprint em Projeto Ativo

```
1. Gerente abre o card do projeto no Funil de Desenvolvimento
2. Gerente cria ou edita a sprint atual (ex.: 'Ajuste — Reunião 10/04')
3. Sistema atualiza automaticamente o estágio exibido no Kanban do projeto
4. Uma tarefa é gerada na aba de Tarefas vinculada ao projeto e à sprint
5. Ao concluir a sprint, sistema registra no histórico do projeto
6. Próxima sprint é iniciada, atualizando o estágio exibido no card
```

---

## Requisitos Não-Funcionais

| Categoria | Requisitos |
|---|---|
| **Usabilidade** | Interface responsiva (desktop + tablet), drag-and-drop nos Kanbans, feedback visual imediato, carregamento < 2s |
| **Segurança** | Login com senha (futuro SSO), perfis Admin/Gestor/Colaborador/Leitura, audit logs para ações críticas |
| **Confiabilidade** | Disponibilidade 99,5% em horário comercial, backups diários, sem perda de dados em queda de conexão |

---

## Fora do Escopo (v1.0)

> **NÃO implementar** na versão 1.0:
> - Integração com calendário, e-mail ou cobrança
> - Automações de marketing
> - Gestão financeira ou emissão de propostas/contratos
> - Portal do cliente / acesso externo

---

## Regras Invioláveis

1. **Janela de contexto limpa.** Tarefas grandes = quebrar em issues. Nunca empurrar tudo de uma vez.
2. **Sem adivinhação.** Especificar quais arquivos criar/modificar. Sem edits surpresa.
3. **Pesquisar antes de implementar.** Grep no código existente. Ler docs de referência. Zero duplicação.
4. **Isolamento.** Cada feature na sua área. Mexer numa coisa não pode quebrar outra.
5. **Se não está no plan, não mexe.** A documentação é lei.
6. **Verificar sempre.** Sem "acho que funciona" — abrir no browser, capturar screenshot, confirmar.
7. **PRD é a fonte da verdade.** Em caso de dúvida, consultar `PRD_Lidtek_CRM_Gestao_Projetos.docx`.
8. **Roadmap é sagrado.** Respeitar a ordem das fases — MVP completo antes de features avançadas.
9. **Dark mode first.** O sistema ABRE em dark mode. Sempre implementar dark antes de light.
10. **Design system consistente.** Glassmorphism, tokens e componentes conforme `DESIGN.md`.
