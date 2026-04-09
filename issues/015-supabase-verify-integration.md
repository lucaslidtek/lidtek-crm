# Issue 015 — Verificação End-to-End da Integração

**Prioridade:** Alta
**Dependências:** 013, 014
**Escopo:** Verificação

## Descrição

Validar que toda a integração funciona end-to-end: login Google → Dashboard carrega dados → CRUD no CRM funciona → dados persistem após refresh → logout/login mantém dados. Capturar screenshots como evidência. Atualizar `ARCHITECTURE.md` para refletir a nova stack (Supabase no lugar de mock).

## Entregáveis

- Screenshots de: Login, Dashboard, CRM Kanban com dados do Supabase
- `src/references/ARCHITECTURE.md` → atualizar seção "Backend" de "Mock" para "Supabase"
- Verificar no Supabase Dashboard que as operações CRUD estão refletindo
- Confirmar que `npm run build` compila sem erros
