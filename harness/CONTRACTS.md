# CONTRACTS.md
> Contrato do sprint ativo. Define exatamente o que será implementado e como será validado.
> Criado pelo Implementador no início de cada sprint. Aprovado pelo Validador antes da implementação.

---

## Como Funciona

1. **Planejamento:** Implementador lê `SPEC.md` + `PROGRESS.md` e escreve o contrato do próximo sprint.
2. **Aprovação:** Validador lê o contrato e confirma que está alinhado com a spec. Se não estiver, negocia ajustes.
3. **Implementação:** Implementador executa apenas o que está no contrato.
4. **Validação:** Validador testa item a item usando os critérios de aceite definidos aqui + sensores de `SENSORS.md`.
5. **Resultado:** Aprovado → atualiza `PROGRESS.md`. Reprovado → volta para Implementador com relatório.

---

## Contrato Ativo

**Sprint:** S-[XX]
**Criado por:** Implementador — [data]
**Aprovado por:** Validador — [data] *(preencher antes de iniciar implementação)*
**Status:** 📝 Rascunho | ✅ Aprovado | 🔄 Em implementação | 🔍 Em validação | ✅ Concluído

---

### Tarefas do Sprint

#### T-[01]: [Título da Tarefa]
**Descrição:** O que exatamente deve ser implementado.
**Arquivos que serão criados/modificados:**
- `src/[caminho]/[arquivo].ts` — [o que muda]
- `src/[caminho]/[arquivo].tsx` — [o que muda]

**Critérios de aceite:**
- [ ] [critério específico e verificável]
- [ ] [critério específico e verificável]
- [ ] Testes unitários cobrindo os casos: [liste os casos]
- [ ] Sensor de lint passa sem erros
- [ ] Sensor de types passa sem erros

---

#### T-[02]: [Título da Tarefa]
**Descrição:** [descrição]
**Arquivos que serão criados/modificados:**
- [lista]

**Critérios de aceite:**
- [ ] [critério]

---

### O Que Este Sprint NÃO Faz

> Explicitamente fora de escopo para evitar scope creep.

- [item fora de escopo]
- [item fora de escopo]

---

### Dependências

> O que precisa estar pronto ou disponível para este sprint funcionar.

- [ex: Banco de dados rodando]
- [ex: Variável `STRIPE_SECRET_KEY` configurada]

---

## Histórico de Contratos Anteriores

| Sprint | Período | Resultado | Notas |
|--------|---------|-----------|-------|
| S-01 | [datas] | ✅ Aprovado | [notas] |
| S-02 | [datas] | ❌ Reprovado (1x) → ✅ | [notas] |

---

## Template para Novo Contrato

> Copie o bloco abaixo quando for iniciar um novo sprint.

```markdown
## Contrato Ativo

**Sprint:** S-[XX]
**Criado por:** Implementador — [data]
**Aprovado por:** Validador — [data]
**Status:** 📝 Rascunho

### Tarefas do Sprint

#### T-[01]: [Título]
**Descrição:** 
**Arquivos:**
- 

**Critérios de aceite:**
- [ ] 

### O Que Este Sprint NÃO Faz
- 

### Dependências
- 
```
