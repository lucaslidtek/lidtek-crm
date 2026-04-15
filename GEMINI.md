# GEMINI.md — Antigravity: Harness Engineering Mode

## Contexto do Projeto

Este workspace opera em Harness Engineering. Leia harness/ antes de qualquer ação.

## Perfil de Autonomia Recomendado

Use Review-driven development como perfil padrão:
- Planejamento visível antes de executar
- Checkpoints entre tarefas
- Nunca execute múltiplos arquivos em sequência sem confirmar o anterior

## Workflow Padrão

Para qualquer pedido recebido:

1. Leia harness/CONTRACTS.md — existe tarefa aberta que cobre este pedido?
   - Sim → execute dentro do contrato
   - Não → crie uma entrada T-AD-XX antes de prosseguir
2. Implemente
3. Rode os sensores de harness/SENSORS.md para o tipo de mudança
4. Atualize harness/PROGRESS.md
5. Commit: [sprint S-XX] [T-XX]: descrição

## Testes

- Mudanças de back-end: type-check + lint + testes unitários + build
- Mudanças de front-end (incluindo CSS/design): lint + testes de componente
  + snapshot visual + checklist de responsividade
- Feature completa: todos os sensores

## Sem Exceções

Pedidos como "só muda essa cor" ou "corrige esse bug rápido" seguem o mesmo fluxo.
Velocidade não justifica pular o harness.
