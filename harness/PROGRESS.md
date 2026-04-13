# PROGRESS.md
> Memória persistente entre sessões. Atualizado ao final de cada tarefa ou sprint.
> **Se você é um agente iniciando uma sessão, leia este arquivo inteiro antes de qualquer ação.**

---

## Estado Atual do Projeto

**Última atualização:** 2026-04-13 14:03 (BRT)
**Sprint ativo:** S-PWA-01 (Progressive Web App)
**Status geral:** ✅ Concluído

---

## Resumo para Nova Sessão

O projeto é o Lidtek CRM — sistema de gestão de projetos e leads em React/Vite + Supabase.

Na sessão de 2026-04-13 (tarde), o app foi configurado como PWA completo:

1. **PWA Setup:** Instalado `vite-plugin-pwa` com `registerType: 'autoUpdate'`, manifest completo (name: "CRM"), service worker com Workbox, runtime caching para Google Fonts.
2. **Ícones PWA:** Gerados a partir da imagem fornecida em: 64x64, 192x192, 512x512, maskable 512x512, apple-touch-icon 180x180, favicons 16x16/32x32.
3. **OG Image:** Gerada a partir do branding fornecido em 1200x630.
4. **Meta tags PWA:** index.html atualizado com theme-color, apple-mobile-web-app-capable, apple-touch-icon, OG tags, twitter cards.
5. **Install prompt:** Componente `PWAInstallPrompt` com hook `usePWAInstall` — captura `beforeinstallprompt`, exibe banner animado com botão de instalar.
6. **Build validado:** manifest.webmanifest + sw.js + workbox gerados corretamente. 31 entries precached.

**Para rodar:** `npm install && npm run dev`
**Banco:** Supabase (hospedado). O script `supabase/whitelist_rls.sql` já foi executado.

---

## Sprints

### Sprint S-PWA-01: Progressive Web App — ✅ Concluído
**Concluído em:** 2026-04-13
**Tarefas:**

- [x] T-01: Instalar vite-plugin-pwa
- [x] T-02: Gerar ícones PWA em múltiplos tamanhos (64, 180, 192, 512, maskable)
- [x] T-03: Configurar vite-plugin-pwa no vite.config.ts (manifest, workbox, autoUpdate)
- [x] T-04: Atualizar index.html com meta tags PWA (theme-color, apple-touch-icon, OG)
- [x] T-05: Registrar Service Worker (auto via plugin)
- [x] T-06: Criar componente PWAInstallPrompt + hook usePWAInstall
- [x] T-07: Sensor build — validar PWA (manifest + SW gerados)

**Notas:**
- Build completa com sucesso. Warnings de chunk size pré-existentes.
- Erros de tsc pré-existentes (ColumnManagerDialog, Dashboard, MemberDetailDrawer) — nenhum novo.
- OG image gerada em 1200x630 a partir do branding Lidtek.

---

### Sprint S-SEC-01: Segurança + Persistência de Dados — ✅ Concluído
**Concluído em:** 2026-04-13
**Tarefas:**

**Persistência de Dados:**
- [x] T-01: Validação de `expires_at` no AuthProvider antes de aceitar sessão
- [x] T-02: `getUser()` como fallback de rede (não confiar em `getSession()` local)
- [x] T-03: Phantom `SIGNED_OUT` guard (delay 300ms + `getUser()`)
- [x] T-04: Tratar `TOKEN_REFRESHED` no `onAuthStateChange`
- [x] T-05: Zombie-session guard no Store (não aceitar tudo-vazio)
- [x] T-06: `visibilitychange` listener no AuthProvider (re-validar sessão)
- [x] T-07: `visibilitychange` listener no Store (re-fetch silencioso)

**Segurança / Whitelist:**
- [x] T-08: Função `is_member()` no banco — whitelist por perfil
- [x] T-09: Atualizar TODAS as policies de SELECT para usar `is_member()`
- [x] T-10: RLS em `funnel_columns` (estava sem proteção)
- [x] T-11: `get_user_role()` retorna NULL se sem perfil (não COALESCE)
- [x] T-12: Remover trigger `handle_new_user()` de auto-criação
- [x] T-13: Remover auto-criação de perfil admin no AuthProvider
- [x] T-14: Criar tela AccessDenied.tsx
- [x] T-15: Rota `/access-denied` no Router
- [x] T-16: Whitelist check no PrivateRoute
- [x] T-17: Criar `whitelist_rls.sql` (script unificado)
- [x] T-18: Executar SQL no Supabase (feito pelo humano)

**Documentação:**
- [x] T-19: Criar `DATA_PERSISTENCE_GUIDE.md` — guia universal
- [x] T-20: Atualizar `PROGRESS.md`

**Notas:**
- Sensores `tsc --noEmit`: 0 erros novos (2 pré-existentes em ColumnManagerDialog e Dashboard)
- O `disable_rls.sql` continua no repo — é script de dev, não de produção

---

## Pendências Identificadas

> Coisas notadas durante implementação mas fora do escopo deste sprint.

- [ ] 2026-04-13 — `ColumnManagerDialog.tsx(177)`: propriedade `ringColor` inválida no CSS-in-JS
- [ ] 2026-04-13 — `Dashboard.tsx(26)`: variável `greeting` declarada mas nunca usada
- [ ] 2026-04-13 — `MemberDetailDrawer.tsx`: múltiplos erros de `cfg`/`roleConfig` possibly undefined
- [ ] 2026-04-13 — `disable_rls.sql` existe no repositório — considerar mover para `.gitignore` ou renomear com prefixo `DANGER_`
- [ ] 2026-04-13 — Bundle size: index.js > 500kB — considerar code splitting com dynamic imports

---

## Bloqueios

> Nenhum bloqueio ativo.

---

## Log de Sessões

| Data | Agente | O que foi feito | Commit |
|------|--------|-----------------|--------|
| 2026-04-13 (manhã) | Implementador | Persistência de dados (T-01 a T-07) + Segurança whitelist (T-08 a T-18) + Docs (T-19, T-20) | pendente |
| 2026-04-13 (tarde) | Implementador | PWA completo: plugin, ícones, manifest, SW, install prompt (T-01 a T-07) | pendente |

---

## Variáveis de Ambiente Necessárias

- [x] `VITE_SUPABASE_URL` configurada
- [x] `VITE_SUPABASE_ANON_KEY` configurada

---

## Como Rodar o Projeto

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
# Copiar .env e preencher com URL e ANON_KEY do Supabase

# 3. Rodar
npm run dev
```

## Arquivos-chave de Referência

- `src/references/AUTH_RULES.md` — 7 regras de auth Supabase
- `src/references/DATA_PERSISTENCE_GUIDE.md` — guia universal de persistência
- `supabase/whitelist_rls.sql` — RLS com whitelist ativo
- `vite.config.ts` — configuração PWA com vite-plugin-pwa
