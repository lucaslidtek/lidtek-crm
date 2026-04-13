# BOOTSTRAP.md
> Script de contexto para novas sessões. Se você é um agente começando agora, execute este protocolo.
> Resolve o problema de amnésia entre sessões — garante que cada nova sessão tenha contexto completo.

---

## Protocolo de Início de Sessão

> **Execute na ordem. Não pule etapas.**

### Passo 1 — Leia o Harness
```
Leia os seguintes arquivos nesta ordem:
1. harness/AGENTS.md      → entenda seu papel
2. harness/SPEC.md        → entenda o projeto
3. harness/PROGRESS.md    → entenda onde estamos
4. harness/ARCHITECTURE.md → entenda os padrões
5. harness/CONTRACTS.md   → veja o sprint ativo (se houver)
6. harness/SENSORS.md     → saiba como validar
```

### Passo 2 — Verifique o Ambiente
```bash
# Versões instaladas
node --version
npm --version

# Dependências instaladas?
npm install

# Banco de dados rodando?
docker-compose ps
# ou: verificar serviço externo

# Migrations atualizadas?
npx prisma migrate status
# ou equivalente da sua stack
```

### Passo 3 — Verifique o Estado do Código
```bash
# Tem mudanças não commitadas?
git status

# Qual é o último commit?
git log --oneline -5

# O código atual está compilando?
npx tsc --noEmit

# Os testes estão passando?
npm run harness:check
```

### Passo 4 — Confirme Entendimento

Antes de começar a trabalhar, escreva (internamente ou no output):
```
Resumo do estado atual:
- Projeto: [nome]
- Sprint ativo: [S-XX ou nenhum]
- Última tarefa concluída: [T-XX]
- Próxima tarefa: [T-XX]
- Estado do código: [passando/falhando — quais sensores]
- Minha missão nesta sessão: [implementar/validar/planejar]
```

---

## Protocolo de Fim de Sessão

> Execute antes de encerrar qualquer sessão.

### Passo 1 — Rode os Sensores
```bash
npm run harness:check
```

### Passo 2 — Atualize o PROGRESS.md
- Marque as tarefas concluídas
- Adicione notas da sessão
- Documente pendências identificadas
- Registre qualquer bloqueio

### Passo 3 — Commit
```bash
git add -A
git commit -m "[sprint S-XX] [T-XX]: [descrição curta do que foi feito]"
```

**Padrão de commit message:**
```
[sprint S-01] [T-03]: implementa autenticação com NextAuth

- Adiciona provider Google e GitHub
- Configura middleware de proteção de rotas
- Cria tabelas User e Session no schema Prisma
```

### Passo 4 — Atualize o Resumo em PROGRESS.md
Reescreva a seção "Resumo para Nova Sessão" com o estado atual.

---

## Setup do Zero (Projeto Novo)

```bash
# 1. Clone ou inicie o repositório
git clone [url] ou git init

# 2. Instale dependências
npm install

# 3. Configure ambiente
cp .env.example .env
# Preencha as variáveis

# 4. Banco de dados
docker-compose up -d
npx prisma migrate dev --name init

# 5. Verifique que está funcionando
npm run harness:check
npm run dev
```

---

## Troubleshooting Comum

| Problema | Solução |
|----------|---------|
| `Cannot find module` | `npm install` |
| `Type error` | Leia a mensagem completa, corrija o tipo, rode `tsc --noEmit` |
| `Migration failed` | `npx prisma migrate reset` (⚠️ apaga dados locais) |
| `Port already in use` | `lsof -i :3000` e kill o processo |
| Agente travado sem saber o que fazer | Documente em `PROGRESS.md` > Bloqueios, pare |
