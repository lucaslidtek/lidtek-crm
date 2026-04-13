# 🛡️ Guia Definitivo: Persistência de Dados em Apps Supabase + React/Vite

> **O que é este documento:** Um guia universal para prevenir o bug onde o frontend fica vazio após inatividade. Baseado em bugs reais encontrados e corrigidos em produção. Aplica-se a qualquer app que use Supabase Auth + RLS + React (Vite ou Next.js).
>
> **Quando consultar:** Sempre que trabalhar com autenticação, persistência de sessão, data fetching, ou qualquer coisa que envolva `supabase.auth` em projetos React.

---

## O Problema

Quando o usuário fica sem mexer no app (tela bloqueada, aba em background, celular em standby), ao voltar o frontend fica **vazio** — nenhum dado do banco aparece. O bug acontece por 3 causas combinadas:

1. **Token JWT expira** (1h por padrão) e o navegador congela timers de abas inativas, impedindo o auto-refresh
2. **RLS retorna `[]` silenciosamente** quando `auth.uid()` é `null` (token inválido) — sem erro, só vazio
3. **Ninguém re-busca dados** quando o usuário volta à aba

O resultado: o Store recebe arrays vazios do Supabase, substitui o estado atual por `[]`, e o dashboard fica em branco.

---

## A Solução: 3 Camadas de Defesa

### Camada 1 — Supabase Client Blindado

```typescript
// src/lib/supabase.ts

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── HMR Singleton ──
// Vite HMR re-importa módulos e criaria um NOVO client,
// mas o antigo ainda segura o auth lock. Solução: globalThis.
declare global {
  var __supabaseClient: SupabaseClient | undefined;
}

if (!globalThis.__supabaseClient) {
  globalThis.__supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'implicit',               // Sem lock de IndexedDB
      storage: window.localStorage,        // Explícito — sem ambiguidade
      storageKey: 'sb-app-auth',           // Chave única por app
      persistSession: true,                // Manter sessão entre reloads
      autoRefreshToken: true,              // Renovar JWT antes de expirar
      detectSessionInUrl: true,            // Processar OAuth callback
      lock: null as any,                   // Desativar navigator.locks (causa timeout de 5s)
    },
  });
}

export const supabase = globalThis.__supabaseClient;
```

**Por que cada config importa:**

| Config | Problema que resolve |
|--------|---------------------|
| `globalThis` singleton | HMR cria múltiplos clients → lock de IndexedDB trava |
| `flowType: 'implicit'` | PKCE usa navigator.locks que travam em abas inativas |
| `storage: localStorage` | Evita ambiguidade entre localStorage e IndexedDB |
| `lock: null` | "Lock was not released within 5000ms" em hot-reload |
| `autoRefreshToken: true` | Token expira sem re-auth se desativado |

---

### Camada 2 — AuthProvider com Proteções

O AuthProvider precisa lidar com 5 cenários perigosos:

#### 2.1 — Verificação de token expirado no init

```typescript
// Ao restaurar sessão, não confiar cegamente no getSession()
// → Verificar se o token já expirou antes de aceitar

supabase.auth.getSession().then(({ data: { session } }) => {
  const isExpired = session?.expires_at
    ? (session.expires_at * 1000) <= Date.now()
    : false;

  if (session?.user && !isExpired) {
    // Token válido — carregar perfil normalmente
    loadProfile(session.user);
  } else if (session?.user && isExpired) {
    // Token expirado — forçar validação real via rede
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) loadProfile(user);    // Refresh funcionou!
      else clearAuthAndRedirect();     // De verdade expirou
    });
  } else {
    clearAuthAndRedirect();
  }
});
```

> **Regra:** `getSession()` pode retornar um token expirado do cache. Sempre checar `expires_at` e usar `getUser()` como fallback de rede.

#### 2.2 — Tratar TOKEN_REFRESHED (não só SIGNED_IN)

```typescript
supabase.auth.onAuthStateChange(async (event, session) => {
  if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
    await loadProfile(session.user);
  }
  // ...
});
```

> **Regra:** Muitos apps só tratam `SIGNED_IN`. Sem tratar `TOKEN_REFRESHED`, o perfil pode ficar desatualizado após renovação automática do token.

#### 2.3 — Phantom SIGNED_OUT guard

```typescript
// O Supabase pode emitir SIGNED_OUT durante um token refresh.
// Se limpar dados imediatamente, o usuário é deslogado sem razão.

} else if (event === 'SIGNED_OUT' || (event as string) === 'TOKEN_REFRESH_FAILED') {
  // Esperar 300ms e verificar com getUser() se REALMENTE deslogou
  setTimeout(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        // Confirmado — limpar tudo
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
      // Se user existe, foi um phantom — não fazer nada
    });
  }, 300);
}
```

> **Regra:** NUNCA limpar auth data imediatamente no `SIGNED_OUT`. Sempre confirmar com `getUser()` após um delay.

#### 2.4 — HMR fast-path (Vite)

```typescript
// No init do useEffect, verificar se já tem dados antes de re-buscar
const cachedUser = localStorage.getItem(AUTH_STORAGE_KEY);
if (cachedUser) {
  // Usuário em cache — setar para UI (sem flash de login)
  // MAS ainda chamar getSession() para validar o JWT
  supabase.auth.getSession().then(/* validar e resolver loading */);
}
```

> **Regra:** Em hot-reload, o componente remonta mas o estado do módulo persiste. Usar cache local para evitar flash de loading, mas sempre validar a sessão.

#### 2.5 — Safety timeout

```typescript
// Se nada resolver em 5s, forçar loading=false para nunca travar
const safetyTimeout = setTimeout(() => resolveLoading(), 5000);
```

> **Regra:** Sempre ter um timeout de segurança. Loading infinito é pior que mostrar dados stale.

---

### Camada 3 — Store com Zombie-Session Guard

Esta é a proteção **mais crítica**. O RLS não dá erro quando o token morre — devolve `200 OK` com arrays vazios. Se o Store aceitar esses `[]`, os dados somem.

```typescript
// Após buscar todos os dados do Supabase:
const [users, leads, projects, tasks] = await Promise.all([
  api.users.list(),
  api.leads.list(),
  api.projects.list(),
  api.tasks.list(),
]);

// ── Zombie-session guard ──
const allEmpty = users.length === 0 && leads.length === 0
  && projects.length === 0 && tasks.length === 0;

if (allEmpty && cache && (cache.leads.length > 0 || cache.projects.length > 0)) {
  // TUDO veio vazio mas o cache tinha dados → token provavelmente morreu
  // NÃO sobrescrever o estado — preservar dados existentes
  console.warn('[Store] All empty but cache has data — zombie session detected');

  // Forçar revalidação de sessão
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) {
      // Sessão realmente morreu — AuthProvider vai redirecionar pro login
      supabase.auth.signOut();
    } else {
      // Sessão válida — dados realmente estão vazios (usuário novo?)
      cache = null;              // Limpar cache stale
      fetchedRef.current = false; // Permitir re-fetch
    }
  });
  return; // NÃO atualizar estado com arrays vazios
}

// Se chegou aqui, dados são legítimos — atualizar estado e cache
setUsers(users);
setLeads(leads);
// ...
cache = { users, leads, projects, tasks };
```

> **Regra:** Se o Supabase retorna TUDO vazio mas havia dados no cache, isso é um sinal de token morto — não um banco vazio real. Preservar estado e forçar re-auth.

---

### Camada 4 (Opcional) — HMR Cache Module-Level

Se usar Context API (não Zustand), o estado é destruído no hot-reload. Solução:

```typescript
// Fora do componente — sobrevive HMR
let _cache: { leads: Lead[]; projects: Project[]; /* ... */ } | null = null;

function StoreProvider({ children }) {
  // Inicializar estado do cache se disponível
  const [leads, setLeads] = useState<Lead[]>(() => _cache?.leads ?? []);
  // ...

  // Ao buscar dados, atualizar o cache
  const refreshAll = async () => {
    const data = await fetchAll();
    setLeads(data.leads);
    _cache = data; // Persistir para o próximo HMR
  };
}
```

> **Nota:** Se usar Zustand ou Jotai, o estado já sobrevive HMR por padrão (store vive fora do React). Nesse caso, basta o HMR fast-path no AuthProvider.

---

## 📋 Checklist — Copiar Para Cada Novo Projeto

Antes de considerar auth + data persistence "pronto", verificar:

| # | Proteção | Status |
|---|----------|--------|
| 1 | `persistSession: true` (explícito no createClient) | ☐ |
| 2 | `autoRefreshToken: true` (explícito) | ☐ |
| 3 | HMR singleton (`globalThis.__supabaseClient`) | ☐ |
| 4 | `lock: null` (sem IndexedDB lock) | ☐ |
| 5 | `TOKEN_REFRESHED` tratado no `onAuthStateChange` | ☐ |
| 6 | Phantom `SIGNED_OUT` guard (delay 300ms + `getUser()`) | ☐ |
| 7 | Token expirado → `getUser()` fallback (checar `expires_at`) | ☐ |
| 8 | Zombie-session guard no Store (não aceitar tudo-vazio) | ☐ |
| 9 | HMR cache (module-level ou Zustand) | ☐ |
| 10 | Safety timeout (5s) no AuthProvider | ☐ |
| 11 | Store só busca dados APÓS `isLoading === false` | ☐ |
| 12 | `visibilitychange` listener para re-validar ao voltar à aba | ☐ |

---

## 🎯 O Padrão Que Funciona (Resumo)

```
1. SUPABASE CLIENT
   → Singleton (globalThis) + lock: null + configs explícitas

2. AUTH PROVIDER
   → getSession() no init + checar expires_at
   → TOKEN_REFRESHED tratado
   → SIGNED_OUT com delay + getUser() double-check
   → HMR fast-path (não reseta se já autenticado)
   → Safety timeout (5s)

3. STORE / DATA LAYER
   → Zombie-session guard (não limpa se veio tudo vazio)
   → HMR cache (module-level, fora do React)
   → Só busca dados APÓS auth confirmar (isLoading === false)

4. REALTIME (se usar)
   → Re-fetch no reconnect do channel
   → Anti-duplicação no INSERT
   → Anti-loop no UPDATE (comparar updated_at)
```

---

## ⚠️ Anti-Padrões — NUNCA Fazer

| ❌ Anti-Padrão | Por quê |
|----------------|---------|
| `if (!session) clearAuth()` no `onAuthStateChange` | Token refresh emite evento sem sessão por milissegundos |
| `export const supabase = createClient(...)` sem singleton | HMR cria múltiplos clients, lock trava |
| Confiar em `getSession()` para checar se o token é válido | Retorna token expirado do cache local |
| Limpar dados do Store quando fetch retorna `[]` | RLS retorna vazio silenciosamente com token morto |
| Auto-criar perfil para qualquer autenticado | Qualquer pessoa com Google entra no sistema |
| Usar `flowType: 'pkce'` em SPA sem backend | Navigator.locks travam em abas inativas |
