# CONTRACTS.md
> Contrato do sprint ativo. Define exatamente o que será implementado e como será validado.
> Criado pelo Implementador no início de cada sprint. Aprovado pelo Validador antes da implementação.

---

## Contrato Ativo

**Sprint:** S-PWA-01
**Criado por:** Implementador — 2026-04-13
**Aprovado por:** Validador — pendente
**Status:** ✅ Concluído

---

### Tarefas do Sprint

#### T-01: Instalar vite-plugin-pwa
**Descrição:** Adicionar dependência `vite-plugin-pwa` ao projeto.
**Arquivos que serão criados/modificados:**
- `package.json` — nova devDependency

**Critérios de aceite:**
- [x] Pacote `vite-plugin-pwa` instalado como devDependency
- [x] `npm install` completa sem erros

---

#### T-02: Gerar ícones PWA em múltiplos tamanhos
**Descrição:** Criar ícones PNG nos tamanhos: 192x192, 512x512 a partir da imagem fornecida. Criar também OG image e apple-touch-icon.
**Arquivos que serão criados/modificados:**
- `public/pwa-192x192.png` — ícone 192px
- `public/pwa-512x512.png` — ícone 512px
- `public/apple-touch-icon-180x180.png` — ícone Apple
- `public/og-image.png` — Open Graph image

**Critérios de aceite:**
- [x] Ícones existem em `public/` nos tamanhos corretos
- [x] OG image existe em `public/`

---

#### T-03: Configurar vite-plugin-pwa no vite.config.ts
**Descrição:** Integrar o plugin PWA com manifest completo, service worker em modo `autoUpdate`, e configuração de ícones.
**Arquivos que serão criados/modificados:**
- `vite.config.ts` — adicionar VitePWA plugin com configuração

**Critérios de aceite:**
- [x] Plugin PWA configurado com `registerType: 'autoUpdate'`
- [x] Manifest inclui: name "CRM", short_name "CRM", theme_color, background_color, icons
- [x] Service worker configurado com runtime caching

---

#### T-04: Atualizar index.html com meta tags PWA
**Descrição:** Adicionar meta tags para PWA: theme-color, apple-touch-icon, og:image, apple-mobile-web-app meta tags.
**Arquivos que serão criados/modificados:**
- `index.html` — meta tags PWA

**Critérios de aceite:**
- [x] Meta tag `theme-color` presente
- [x] Link `apple-touch-icon` presente
- [x] Meta tags Open Graph presentes
- [x] Meta tag `apple-mobile-web-app-capable` presente

---

#### T-05: Registrar Service Worker no app
**Descrição:** Importar e usar `registerSW` do vite-plugin-pwa no entry point.
**Arquivos que serão criados/modificados:**
- `src/main.tsx` — importar registerSW

**Critérios de aceite:**
- [x] SW registration importado e ativado (via plugin registerSW.js injection)
- [x] Prompt de update configurado (auto-update via registerType: autoUpdate)

---

#### T-06: Criar componente de install prompt (PWA)
**Descrição:** Criar um hook `usePWAInstall` e um componente de banner/botão de instalação para quando `beforeinstallprompt` dispara.
**Arquivos que serão criados/modificados:**
- `src/shared/hooks/usePWAInstall.ts` — hook para capturar beforeinstallprompt
- `src/shared/components/PWAInstallPrompt.tsx` — componente UI de install

**Critérios de aceite:**
- [x] Hook captura o evento `beforeinstallprompt`
- [x] Componente aparece quando app é instalável
- [x] Botão de instalar chama `prompt()` no evento
- [x] Componente desaparece após instalação ou dismiss

---

#### T-07: Sensor build — validar PWA
**Descrição:** Rodar build e verificar que manifest e SW são gerados.

**Critérios de aceite:**
- [x] `npm run build` completa sem erros
- [x] `dist/manifest.webmanifest` existe no output (0.60 kB)
- [x] Service Worker gerado no dist (sw.js + workbox-*.js)

---

### O Que Este Sprint NÃO Faz

- Offline-first caching de dados Supabase
- Notificações push
- Background sync
- Splash screens customizados por plataforma

### Dependências

- Node.js instalado
- Imagens do ícone e OG fornecidas pelo humano ✅

---

## Histórico de Contratos Anteriores

| Sprint | Período | Resultado | Notas |
|--------|---------|-----------|-------|
| S-SEC-01 | 2026-04-13 | ✅ Aprovado | Segurança + Persistência |
