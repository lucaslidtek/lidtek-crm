# PROGRESS.md
> Memória persistente entre sessões. Atualizado ao final de cada tarefa ou sprint.
> **Se você é um agente iniciando uma sessão, leia este arquivo inteiro antes de qualquer ação.**

---

## Estado Atual do Projeto

**Última atualização:** [data e hora]
**Sprint ativo:** [S-XX ou "Nenhum"]
**Status geral:** 🔲 Não iniciado | 🔄 Em progresso | ✅ Concluído

---

## Resumo para Nova Sessão

> Cole aqui um parágrafo descrevendo o estado atual do código para um agente que nunca viu o projeto.
> Atualize a cada sprint concluído.

```
[Exemplo:]
O projeto é um app de gestão de tarefas em Next.js 14. A autenticação com NextAuth foi
implementada no S-01 e está funcionando. O dashboard base foi criado no S-02 mas ainda 
não tem dados reais — usa mock data. O próximo passo é o S-03: conectar o dashboard
com a API real e implementar filtros. O banco está rodando localmente via Docker.
Para iniciar: `npm install && docker-compose up -d && npx prisma migrate dev && npm run dev`
```

---

## Sprints

### Sprint S-01: [Nome] — ✅ Concluído
**Concluído em:** [data]
**Tarefas:**
- [x] T-01: [descrição] — ✅
- [x] T-02: [descrição] — ✅

**Notas:**
- [observações relevantes, decisões tomadas, problemas encontrados]

---

### Sprint S-02: [Nome] — 🔄 Em progresso
**Iniciado em:** [data]
**Tarefas:**
- [x] T-03: [descrição] — ✅ concluída
- [ ] T-04: [descrição] — 🔄 em progresso
- [ ] T-05: [descrição] — 🔲 não iniciada

**Notas:**
- [observações da sessão atual]

---

### Sprint S-03: [Nome] — 🔲 Não iniciado

---

## Pendências Identificadas

> Coisas que o agente notou durante implementação mas estão FORA do sprint atual.
> Não implemente. Documente aqui para revisão humana.

- [ ] [data] — [descrição do que foi identificado e por que pode ser importante]

---

## Bloqueios

> Situações onde o agente travou e precisou parar. Descreva o que aconteceu para o humano resolver.

- [ ] [data] — [descrição do bloqueio]

---

## Log de Sessões

> Registro cronológico das sessões de desenvolvimento.

| Data | Agente | O que foi feito | Commit |
|------|--------|-----------------|--------|
| [data] | Implementador | [resumo] | [hash] |
| [data] | Validador | [resultado da validação] | — |

---

## Variáveis de Ambiente Necessárias

> Checklist para qualquer pessoa (humano ou agente) que for rodar o projeto do zero.

- [ ] `DATABASE_URL` configurada
- [ ] `NEXTAUTH_SECRET` gerada
- [ ] [adicione conforme o projeto]

---

## Como Rodar o Projeto

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# edite o .env com os valores corretos

# 3. Banco de dados
docker-compose up -d
npx prisma migrate dev

# 4. Rodar
npm run dev
```
