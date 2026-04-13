# ARCHITECTURE.md
> Decisões de arquitetura, padrões obrigatórios e anti-padrões proibidos.
> O agente implementador deve consultar este arquivo antes de criar qualquer arquivo ou estrutura.

---

## Estrutura de Pastas

```
[cole aqui a estrutura real do seu projeto]

Exemplo:
src/
├── app/              # Rotas Next.js App Router
├── components/       # Componentes React reutilizáveis
│   ├── ui/           # Componentes base (shadcn)
│   └── features/     # Componentes de domínio
├── lib/              # Utilitários, helpers, configs
├── server/           # Lógica server-side
│   ├── actions/      # Server Actions
│   ├── db/           # Queries e schema Prisma
│   └── services/     # Regras de negócio
├── types/            # Tipos TypeScript globais
└── hooks/            # React hooks customizados
```

---

## Padrões Obrigatórios

### Nomenclatura
- Arquivos de componentes: `PascalCase.tsx`
- Arquivos de utilitários: `camelCase.ts`
- Constantes: `UPPER_SNAKE_CASE`
- Variáveis e funções: `camelCase`
- [adicione padrões específicos do projeto]

### Imports
- Use paths absolutos com `@/` para imports internos
- Nunca use `../../../` — configure o `tsconfig.json` paths
- Exemplo: `import { Button } from "@/components/ui/button"`

### Componentes
- Prefira componentes funcionais com hooks
- Props sempre tipadas com `interface` ou `type`
- Nenhum componente com mais de 200 linhas — extraia sub-componentes
- [adicione padrões específicos]

### Estado e Data Fetching
- [ex: Zustand para estado global, React Query para server state]
- [ex: Server Actions para mutations, não API routes]
- [documente a abordagem escolhida]

### Tratamento de Erros
- [ex: Nunca swallow errors silenciosamente]
- [ex: Use Result pattern ou throw com mensagem clara]
- [ex: Logs de erro sempre com contexto]

---

## Anti-Padrões Proibidos

❌ **Nunca faça isso:**

- Lógica de negócio dentro de componentes React
- Queries SQL/ORM diretamente em componentes ou actions (use a camada `server/db/`)
- `any` em TypeScript sem comentário justificando
- Variáveis de ambiente hardcoded no código
- `console.log` sem remoção planejada
- Arquivos com mais de 300 linhas sem justificativa
- Duplicação de lógica — extraia para utilitário compartilhado
- [adicione anti-padrões específicos do projeto]

---

## Banco de Dados

**ORM/Query Builder:** [ex: Prisma]
**Convenções de schema:**
- [ex: Todos os IDs são UUIDs gerados pelo banco]
- [ex: Timestamps `createdAt` e `updatedAt` em toda tabela]
- [ex: Soft delete com campo `deletedAt`]
- [documente as convenções]

**Migrations:**
- Sempre use migrations versionadas — nunca edite o schema diretamente em produção
- [comandos de migration]

---

## Autenticação e Autorização

**Solução:** [ex: NextAuth.js / Clerk / custom JWT]
**Modelo de permissões:** [ex: RBAC com roles: admin, user, viewer]
**Regras:**
- [ex: Toda rota protegida verifica sessão no middleware]
- [ex: Autorização granular nas server actions]

---

## Testes

**Framework:** [ex: Vitest + React Testing Library + Playwright]
**Cobertura mínima:** [ex: 80% em `server/`, 60% em `components/`]
**Padrão de organização:**
```
src/
└── __tests__/        # Testes de integração
components/
└── Button.test.tsx   # Testes unitários colocalizados
e2e/
└── auth.spec.ts      # Testes E2E Playwright
```

---

## Variáveis de Ambiente

**Regra:** Toda variável nova deve ser adicionada ao `.env.example` com comentário descritivo.
**Validação:** [ex: Use `zod` para validar env no startup — `src/lib/env.ts`]

```bash
# Exemplo de .env.example
DATABASE_URL=          # PostgreSQL connection string
NEXTAUTH_SECRET=       # Random string para JWT
STRIPE_SECRET_KEY=     # Chave secreta do Stripe (sk_...)
```
