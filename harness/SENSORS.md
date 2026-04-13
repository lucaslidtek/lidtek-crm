# SENSORS.md
> Sensores são comandos que retornam 0 (passou) ou 1 (falhou).
> O agente nunca julga se o código está bom. Os sensores julgam.
> **Rode todos os sensores antes de marcar qualquer tarefa como concluída.**

---

## Regra de Ouro

> Se um sensor falha, a tarefa **não está concluída**. Não há exceções.
> Corrija o erro, rode os sensores novamente, só então marque como feito.

---

## Sensores Obrigatórios

> Adapte os comandos para a stack do seu projeto.

### 1. Type Check
```bash
# TypeScript — deve retornar 0 erros
npx tsc --noEmit
```
**Quando rodar:** Após qualquer alteração em arquivos `.ts` ou `.tsx`
**Passa se:** Sem erros de tipo
**Falha se:** Qualquer erro de tipo

---

### 2. Lint
```bash
# ESLint
npx eslint src/ --ext .ts,.tsx

# ou com auto-fix (use antes de commitar)
npx eslint src/ --ext .ts,.tsx --fix
```
**Quando rodar:** Após qualquer alteração de código
**Passa se:** 0 errors (warnings são aceitáveis se documentados)
**Falha se:** Qualquer error

---

### 3. Testes Unitários
```bash
# Vitest
npx vitest run

# Jest
npx jest --passWithNoTests
```
**Quando rodar:** Após implementar qualquer lógica com testes associados
**Passa se:** Todos os testes passam
**Falha se:** Qualquer teste falha

---

### 4. Build
```bash
# Next.js
npm run build

# Vite
npm run build
```
**Quando rodar:** Ao final de cada sprint, antes da validação final
**Passa se:** Build completa sem erros
**Falha se:** Qualquer erro de compilação

---

### 5. Testes E2E *(se configurado)*
```bash
# Playwright
npx playwright test

# Cypress
npx cypress run --headless
```
**Quando rodar:** Ao final de cada sprint
**Passa se:** Todos os cenários passam
**Falha se:** Qualquer cenário falha

---

## Sensores por Tipo de Tarefa

| Tipo de tarefa | Sensores obrigatórios |
|---|---|
| Novo componente UI | type-check + lint + testes unitários |
| Nova server action / API | type-check + lint + testes unitários + build |
| Alteração de schema DB | type-check + lint + testes unitários + build |
| Feature completa (fim de sprint) | **todos os sensores** |
| Hotfix | type-check + lint + testes relevantes |

---

## Sensor de Saúde Rápida

> Rode este comando para verificar tudo de uma vez.
> Crie este script em `package.json` > `scripts`:

```json
{
  "scripts": {
    "harness:check": "tsc --noEmit && eslint src/ --ext .ts,.tsx && vitest run"
  }
}
```

```bash
npm run harness:check
```

---

## Interpretando Resultados

### Exit code 0 = sensor passou
```bash
echo $?  # deve retornar 0
```

### Exit code 1+ = sensor falhou
- Não avance para o próximo item
- Copie o erro completo
- Corrija antes de continuar
- Se não conseguir corrigir em 2 tentativas, documente em `PROGRESS.md` > Bloqueios

---

## Adicionando Novos Sensores

Quando o projeto evoluir, adicione sensores aqui seguindo o padrão:

```markdown
### [N]. [Nome do Sensor]
```bash
[comando]
```
**Quando rodar:** [condição]
**Passa se:** [critério]
**Falha se:** [critério]
```
