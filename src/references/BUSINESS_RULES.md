# Business Rules — Lidtek CRM & Gestão de Projetos

> **Fonte:** PRD v1.0 (Seções 1-8) — Requisitos funcionais e critérios de aceite.
> **Última atualização:** Abril/2026

---

## 1. Contexto do Domínio

A Lidtek é uma consultoria de TI que atua como **departamento de tecnologia terceirizado** para empresas em crescimento. O modelo de negócio opera com:

- **Clientes recorrentes** — contratos de manutenção/mensalidade (modelo "TI terceirizada")
- **Projetos únicos** — escopo e prazo definidos (one-shot)
- Ambos rodando em paralelo

O sistema centraliza o **ciclo completo de relacionamento**: desde o primeiro contato comercial até a entrega e manutenção de projetos.

---

## 2. Módulo M1: Funil de Vendas (CRM)

### 2.1 Etapas do Funil

O funil de vendas é **linear e sequencial**. Um lead avança pelas etapas conforme o relacionamento comercial progride:

| # | Etapa | Descrição | Campos Específicos |
|---|---|---|---|
| 1 | **Prospecção** | Contato inicial identificado. Lead inserido com dados básicos. | Origem do lead |
| 2 | **1ª Reunião** | Reunião inicial agendada ou realizada. Entendimento das dores. | Data da reunião |
| 3 | **Briefing** | Levantamento detalhado de requisitos e escopo. | Escopo preliminar |
| 4 | **Proposta Enviada** | Proposta comercial/técnica enviada ao cliente. | Valor estimado, tipo de solução |
| 5 | **Negociação** | Ajustes de escopo, prazo ou valores em andamento. | Valor negociado |
| 6 | **Contrato Enviado** | Minuta de contrato encaminhada para assinatura. | Data de envio |
| 7 | **Contrato Assinado** | ⚡ **GATILHO DE TRANSIÇÃO** → Cria projeto no M2 automaticamente. | Tipo de projeto (recorrente/único) |
| 8 | **Perdido / Arquivado** | Negociação encerrada sem conversão. Motivo registrado. | Motivo da perda |

### 2.2 Regras do Funil de Vendas

| # | Regra | Detalhes |
|---|---|---|
| R-CRM-01 | **Campos obrigatórios no cadastro** | Nome/empresa, contato, origem, responsável |
| R-CRM-02 | **Tempo máximo de cadastro** | Lead deve poder ser criado em **menos de 30 segundos** |
| R-CRM-03 | **Histórico de interações** | Notas, reuniões e e-mails registrados manualmente, vinculados ao card do lead |
| R-CRM-04 | **Follow-ups** | Tarefas vinculadas ao card com data de próximo contato |
| R-CRM-05 | **Alertas de prazo vencido** | Follow-ups vencidos devem gerar alerta visual (vermelho) |
| R-CRM-06 | **Campos configuráveis por etapa** | Cada etapa pode ter campos específicos (ex: valor estimado na etapa "Proposta Enviada") |
| R-CRM-07 | **Kanban sem refresh** | O Kanban exibe todos os leads organizados por etapa **sem refresh manual** |
| R-CRM-08 | **Visualização dupla** | Kanban (colunas por etapa) + Lista com filtros |

### 2.3 Transição Automática: CRM → Projetos

> **Esta é a regra de negócio mais crítica do sistema.**

| Aspecto | Detalhe |
|---|---|
| **Trigger** | Lead movido para etapa "Contrato Assinado" |
| **Modal de confirmação** | Sistema exibe modal solicitando: tipo de projeto (Recorrente/Único) |
| **Criação automática** | Sistema cria card no Funil de Desenvolvimento (M2) com dados migrados do lead |
| **Dados migrados** | Nome/empresa, contato, responsável, histórico de interações, tipo de projeto |
| **Arquivamento** | Card do lead é arquivado no Funil de Vendas (mantido no histórico, não deletado) |
| **Notificação** | Time recebe notificação do novo projeto para iniciar onboarding |

```
FLUXO:
Lead (M1) → [Contrato Assinado] → [Modal: tipo de projeto?] → Projeto criado (M2) → Lead arquivado (M1)
```

### 2.4 Dados de um Lead

```typescript
interface Lead {
  id: string;
  name: string;              // Nome ou empresa
  contact: string;           // Contato principal (email, telefone)
  origin: string;            // Origem do lead (indicação, site, evento, etc)
  owner: string;             // Responsável pelo lead (userId)
  notes: string;             // Observações livres
  stage: FunnelStage;        // Etapa atual no funil
  nextContactDate?: Date;    // Data do próximo follow-up
  estimatedValue?: number;   // Valor estimado do projeto
  solutionType?: string;     // Tipo de solução proposta
  lossReason?: string;       // Motivo da perda (se Perdido/Arquivado)
  interactions: Interaction[];  // Histórico de interações
  tasks: Task[];             // Tarefas/follow-ups vinculados
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 3. Módulo M2: Funil de Desenvolvimento (Projetos)

### 3.1 Tipos de Projeto

| Tipo | Descrição | Sprints | Ciclo de Vida |
|---|---|---|---|
| **Recorrente** | Contrato de manutenção/mensalidade. Modelo "TI terceirizada". | Contínuas (sem término definido) | Onboarding → Sprints contínuas → Suporte |
| **Único (One-shot)** | Projeto com escopo e prazo definidos. | Sequenciais até entrega | Onboarding → Desenvolvimento → Entrega |

### 3.2 Etapas de Projeto (Dinâmicas)

> **Diferentemente do funil de vendas, as etapas de projeto NÃO são lineares fixas.** O estágio exibido reflete a sprint ou tarefa em execução no momento.

| # | Etapa / Sprint | Descrição |
|---|---|---|
| 1 | **Onboarding / Kickoff** | Recepção do cliente, alinhamento inicial |
| 2 | **Levantamento e Arquitetura** | Definição técnica, especificação |
| 3 | **Desenvolvimento — Sprint [N]** | Ciclos de desenvolvimento iterativos |
| 4 | **Revisão / Ajustes — Reunião [data]** | Review com cliente, correções |
| 5 | **Homologação** | Testes com o cliente |
| 6 | **Deploy / Entrega** | Publicação em produção |
| 7 | **Suporte Pós-entrega / Recorrência** | Manutenção contínua (recorrentes) |

### 3.3 Regras do Funil de Desenvolvimento

| # | Regra | Detalhes |
|---|---|---|
| R-PRJ-01 | **Card exibe sprint atual** | Cada projeto exibe sprint/etapa atual de forma legível no card do Kanban |
| R-PRJ-02 | **Atualização em tempo real** | Ao criar/editar sprint, estágio do card é atualizado imediatamente |
| R-PRJ-03 | **Filtro por tipo** | Filtrar projetos Recorrente/Único com **um clique** |
| R-PRJ-04 | **Kanban configurável** | Colunas configuráveis por agrupamento: Recorrentes / Únicos / Arquivados |
| R-PRJ-05 | **Histórico de sprints** | Registro de todas as sprints concluídas por projeto |
| R-PRJ-06 | **Vinculação com Tarefas** | Cada sprint gera automaticamente uma tarefa no módulo M3 |
| R-PRJ-07 | **Filtros avançados** | Por tipo de projeto, responsável, status (ativo, em pausa, concluído) |
| R-PRJ-08 | **Visualização dupla** | Kanban + Lista com ordenação por data de entrega ou cliente |

### 3.4 Dados de um Projeto

```typescript
interface Project {
  id: string;
  clientName: string;          // Nome do cliente/empresa
  clientContact: string;       // Contato principal
  type: 'recurring' | 'oneshot';  // Tipo de projeto
  status: 'active' | 'paused' | 'completed' | 'archived';
  owner: string;               // Responsável principal (userId)
  currentSprint?: Sprint;      // Sprint em execução
  sprints: Sprint[];           // Histórico de sprints
  tasks: Task[];               // Tarefas vinculadas
  nextDeliveryDate?: Date;     // Próxima data de entrega
  leadId: string;              // Referência ao lead de origem (M1)
  createdAt: Date;
  updatedAt: Date;
}

interface Sprint {
  id: string;
  projectId: string;
  name: string;                // Ex: "Desenvolvimento — Sprint 3"
  stage: ProjectStage;         // Etapa atual
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'completed';
  tasks: Task[];               // Tarefas geradas automaticamente
}
```

---

## 4. Módulo M3: Gestão de Tarefas

### 4.1 Tipos de Tarefa

| Tipo | Origem | Vínculo |
|---|---|---|
| **Tarefa de Projeto (Sprint)** | Criada **automaticamente** ao iniciar sprint no M2 | Projeto + Sprint |
| **Tarefa de Vendas** | Criada **manualmente** dentro do card de um lead | Lead no M1 |
| **Tarefa Avulsa** | Criada manualmente, sem vínculo obrigatório | Nenhum (opcional: cliente/projeto) |

### 4.2 Regras de Tarefas

| # | Regra | Detalhes |
|---|---|---|
| R-TSK-01 | **Criação rápida** | Tarefa avulsa criada em **menos de 20 segundos** a partir de qualquer tela |
| R-TSK-02 | **Diferenciação visual** | Os 3 tipos aparecem na mesma lista, diferenciados visualmente por cor/ícone |
| R-TSK-03 | **Alerta de vencidas** | Tarefas vencidas em **vermelho**; prazo em 48h em **amarelo** |
| R-TSK-04 | **Visualização dupla** | Lista geral com filtros + Kanban por status |
| R-TSK-05 | **Agrupamento** | Por projeto ou por cliente |
| R-TSK-06 | **Filtros** | Por tipo, status, responsável, cliente e prazo |
| R-TSK-07 | **Cross-reference** | Tarefas vinculadas a lead/projeto aparecem tanto na aba de Tarefas quanto no card de origem |

### 4.3 Dados de uma Tarefa

```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'project' | 'sales' | 'standalone';   // Tipo da tarefa
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  priority: 'high' | 'medium' | 'low';
  owner: string;               // Responsável (userId)
  dueDate?: Date;              // Data de vencimento
  tags: string[];              // Etiquetas livres

  // Vínculos opcionais
  projectId?: string;          // Projeto vinculado (M2)
  sprintId?: string;           // Sprint vinculada
  leadId?: string;             // Lead vinculado (M1)

  createdAt: Date;
  updatedAt: Date;
}
```

### 4.4 Status de Tarefa e Visual

| Status | Cor | Ícone sugerido |
|---|---|---|
| **A fazer** | Muted/Gray | `Circle` |
| **Em andamento** | Primary (`#5A4FFF`) | `CircleDot` |
| **Concluída** | Success (`#10B981`) | `CircleCheck` |
| **Bloqueada** | Destructive | `CircleX` |

### 4.5 Prioridade e Visual

| Prioridade | Cor | Label |
|---|---|---|
| **Alta** | Destructive (vermelho) | `ALTA` |
| **Média** | Warning (amarelo) | `MÉDIA` |
| **Baixa** | Muted (cinza) | `BAIXA` |

---

## 5. Módulo M4: Dashboard Inicial

### 5.1 Componentes

| Componente | Dados Exibidos | Regras |
|---|---|---|
| **Resumo do Funil de Vendas** | Total de leads por etapa, leads com follow-up vencido, novos leads (7 dias) | Clicável → navega para M1 |
| **Resumo de Projetos** | Total de projetos ativos por tipo, projetos com entrega em 7 dias | Clicável → navega para M2 |
| **Minhas Tarefas do Dia** | Tarefas com vencimento hoje + atrasadas, do usuário logado | **Apenas do usuário logado** |
| **Atividade Recente** | Últimas movimentações no sistema (timeline) | Últimas 10-15 ações |
| **Atalhos Rápidos** | Adicionar lead, criar tarefa avulsa, iniciar nova sprint | Botões de ação rápida |

### 5.2 Regras do Dashboard

| # | Regra | Detalhes |
|---|---|---|
| R-DSH-01 | **Performance** | Dashboard carrega em **menos de 2 segundos** |
| R-DSH-02 | **Contextual** | "Minhas Tarefas do Dia" exibe **apenas** tarefas do usuário logado (vencimento hoje + atrasadas) |
| R-DSH-03 | **Navegação direta** | Clicar em qualquer item leva ao contexto correspondente (deeplink) |
| R-DSH-04 | **Dados atualizados** | Dados refletem estado atual do sistema (polling ou real-time) |

---

## 6. Autenticação e Permissões

### 6.1 Perfis de Acesso

| Perfil | Descrição | Permissões |
|---|---|---|
| **Admin** | Acesso total, configurações do sistema | CRUD em tudo, gerenciar usuários, configurar funis |
| **Gestor** | Gerencia equipe e projetos | CRUD em leads/projetos/tarefas, visualizar tudo |
| **Colaborador** | Executa tarefas atribuídas | Visualizar e editar tarefas próprias, consultar projetos |
| **Leitura** | Apenas visualização | Somente leitura em todos os módulos |

### 6.2 Regras de Segurança

| # | Regra | Detalhes |
|---|---|---|
| R-SEC-01 | **Autenticação** | Login com e-mail e senha (suporte futuro a SSO) |
| R-SEC-02 | **Audit logs** | Ações críticas registradas: exclusão, transição de contrato, arquivamento |
| R-SEC-03 | **Sem perda de dados** | Queda de conexão durante edição não causa perda de dados (salvar rascunho local) |
| R-SEC-04 | **Backups** | Backups automáticos diários |
| R-SEC-05 | **Disponibilidade** | Mínimo 99,5% em horário comercial |

---

## 7. Fluxos de Dados

### 7.1 Novo Lead → Cliente Ativo (Fluxo Completo)

```
┌─────────────────────────────────────────────────────────┐
│                    FUNIL DE VENDAS (M1)                  │
│                                                         │
│  [Prospecção] → [1ª Reunião] → [Briefing]              │
│       │                                                 │
│       ▼ (tarefas de follow-up criadas em cada etapa)   │
│                                                         │
│  [Proposta] → [Negociação] → [Contrato Enviado]        │
│                                                         │
│  → [Contrato Assinado] ─── GATILHO ──────────┐        │
│       │                                       │        │
│       ▼                                       │        │
│  [Lead Arquivado]                             │        │
│  (mantido no histórico)                       │        │
└───────────────────────────────────────────────┼────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────┐
│              FUNIL DE DESENVOLVIMENTO (M2)              │
│                                                         │
│  [Projeto Criado] → tipo: Recorrente ou Único          │
│       │                                                 │
│       ▼                                                 │
│  [Onboarding] → [Levantamento] → [Sprint 1] → ...     │
│       │                                                 │
│       ▼ (cada sprint gera tarefa em M3)                │
│                                                         │
│  → [Homologação] → [Deploy] → [Suporte/Recorrência]   │
└─────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────┐
│                 GESTÃO DE TAREFAS (M3)                  │
│                                                         │
│  Tarefa de Sprint (auto) + Tarefa de Vendas + Avulsas  │
│  Todas na mesma aba, filtráveis por tipo                │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Gestão de Sprint

```
Gerente abre projeto (M2)
    └→ Cria/edita sprint
         ├→ Kanban do projeto atualiza estágio automaticamente
         ├→ Tarefa gerada em M3 (tipo: projeto)
         └→ Ao concluir sprint:
              ├→ Registra no histórico do projeto
              └→ Próxima sprint inicia, card atualiza
```

---

## 8. Regras de Validação

### 8.1 Lead (M1)

| Campo | Validação |
|---|---|
| `name` | Obrigatório, min 2 caracteres |
| `contact` | Obrigatório, e-mail ou telefone válido |
| `origin` | Obrigatório |
| `owner` | Obrigatório, userId válido |
| `stage` | Deve ser uma etapa válida do funil |
| `nextContactDate` | Se definida, não pode ser no passado (ao criar) |
| `estimatedValue` | Se definido, deve ser > 0 |

### 8.2 Projeto (M2)

| Campo | Validação |
|---|---|
| `clientName` | Obrigatório (migrado do lead) |
| `type` | Obrigatório: `recurring` ou `oneshot` |
| `owner` | Obrigatório |
| `leadId` | Obrigatório (referência ao lead de origem) |

### 8.3 Sprint (M2)

| Campo | Validação |
|---|---|
| `name` | Obrigatório |
| `projectId` | Obrigatório |
| `startDate` | Obrigatório |
| `stage` | Deve ser uma etapa válida |

### 8.4 Tarefa (M3)

| Campo | Validação |
|---|---|
| `title` | Obrigatório, min 3 caracteres |
| `type` | Obrigatório: `project`, `sales` ou `standalone` |
| `status` | Obrigatório, default: `todo` |
| `priority` | Obrigatório, default: `medium` |
| `owner` | Obrigatório |

---

## 9. Glossário

| Termo | Definição |
|---|---|
| **Lead** | Potencial cliente que ainda não assinou contrato. Gerenciado no Funil de Vendas (M1). |
| **Card** | Elemento visual no Kanban que representa um lead ou projeto. |
| **Sprint** | Ciclo de trabalho de duração definida associado a um projeto ativo. Define a etapa atual do projeto no M2. |
| **Projeto Recorrente** | Projeto com contrato de continuidade. Típico do modelo de TI terceirizado. |
| **Projeto Único** | Projeto com escopo e prazo fechados, encerrado após entrega final. |
| **Tarefa Avulsa** | Tarefa sem vínculo obrigatório com cliente ou projeto específico. |
| **Follow-up** | Ação de acompanhamento agendada com um lead para avançar na negociação. |
| **Funil de Vendas** | Pipeline de etapas que um lead percorre desde a prospecção até o fechamento. |
| **Funil de Desenvolvimento** | Pipeline de etapas que um projeto percorre desde o kickoff até a entrega. |
| **Gatilho de Transição** | Ação automática que migra um lead do M1 para projeto no M2 ao atingir "Contrato Assinado". |
