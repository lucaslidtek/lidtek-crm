# 🛡️ Regras Obrigatórias: Autenticação + Persistência de Dados (Supabase + React)

> **O que é este documento:** Uma lista de bugs REAIS que aconteceram em produção e as soluções definitivas. Siga estas regras ao implementar ou modificar qualquer sistema de autenticação com Supabase em projetos React/Vite.
>
> **Quando consultar:** Sempre que trabalhar com login, logout, OAuth, persistência de sessão, proteção de rotas, ou qualquer coisa que envolva `supabase.auth`.

---

## REGRA 1: Rotas de Callback OAuth NUNCA Devem Ser Redirecionadas

### O Bug
Quando o usuário faz login com Google, o Supabase redireciona para `/auth/callback?code=...` ou `/auth/callback#access_token=...`. Se o componente de layout/guarda de rotas verificar autenticação e redirecionar rotas não-autenticadas para `/login`, ele vai redirecionar o callback ANTES de processar o token → **loop infinito de login**.

### A Regra

**Todo guard de rota, layout wrapper, ou middleware que redireciona para login DEVE exemir rotas de callback.**

```typescript
// ❌ ERRADO — vai causar loop de login
if (!isAuthenticated && location !== "/auth") {
  navigate("/auth");
}

// ✅ CORRETO — exemir TODAS as rotas de callback
if (!isAuthenticated && location !== "/auth" && !location.startsWith("/auth/callback")) {
  navigate("/auth");
}
```

**Checklist — verifique TODOS estes locais:**
- [ ] Guard de redirect no `useEffect`
- [ ] Render condicional que mostra spinner/loading
- [ ] Render condicional que retorna `null` ou fallback
- [ ] Wrapper de layout que pula o layout para rotas públicas
- [ ] `PrivateRoute` / `ProtectedRoute` component
- [ ] Middleware de servidor (se SSR/Next.js)

> ⚠️ **Se esqueceu UM ÚNICO local, o loop acontece.** Faça `Ctrl+F` por toda verificação de rota de auth no projeto inteiro.

---

## REGRA 2: Suportar AMBOS os Fluxos OAuth (PKCE e Implícito)

### O Bug
O Supabase pode usar dois fluxos OAuth:
- **PKCE**: Retorna `?code=ABC` na URL → precisa chamar `exchangeCodeForSession(code)`
- **Implícito**: Retorna `#access_token=XYZ` no hash → Supabase processa automaticamente via `detectSessionInUrl`

Se o callback SÓ implementar um deles, o login falha silenciosamente no outro.

### A Regra

**O `AuthCallback` DEVE implementar 3 estratégias em cascata:**

```typescript
// ✅ CORRETO — 3 estratégias em cascata
async function processAuth() {
  const supabase = getSupabase();

  // ESTRATÉGIA 1: Listener de auth state (captura fluxo implícito automaticamente)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await handleSuccess(session);
      }
    }
  );

  // ESTRATÉGIA 2: Troca de código PKCE (se presente na URL)
  const code = new URLSearchParams(window.location.search).get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      await handleSuccess(data.session);
      return;
    }
  }

  // ESTRATÉGIA 3: Aguardar processamento do hash + getSession
  await new Promise(resolve => setTimeout(resolve, 1000));
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    await handleSuccess(session);
    return;
  }

  // TIMEOUT DE SEGURANÇA
  setTimeout(() => setError("Tempo limite excedido"), 10000);
}
```

**E no cliente Supabase, SEMPRE:**
```typescript
createClient(url, key, {
  auth: {
    detectSessionInUrl: true,  // ← OBRIGATÓRIO para fluxo implícito
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## REGRA 3: Salvar Auth ANTES de Buscar Dados do Servidor (Save-First Pattern)

### O Bug
Após o OAuth retornar com sucesso, o callback fazia:
1. Buscar `/api/auth/user` no servidor
2. Só salvar no localStorage DEPOIS de receber resposta

Se o servidor estivesse reiniciando (deploy, cold start), o fetch falhava → **nada era salvo** → usuário achava que nunca logou.

### A Regra

**Sempre salvar os dados de auth IMEDIATAMENTE com o que já tem, e DEPOIS enriquecer.**

```typescript
// ❌ ERRADO — se o fetch falhar, perde tudo
async function handleSuccess(session) {
  const response = await fetch("/api/auth/user", { ... });
  if (!response.ok) throw new Error("Falhou"); // ← PERDE O LOGIN
  const user = await response.json();
  saveAuthData(session, user.id);
  redirect("/");
}

// ✅ CORRETO — save-first, enrich-later
async function handleSuccess(session) {
  // 1. SALVAR IMEDIATAMENTE com dados do JWT (já tem email, nome, avatar)
  saveAuthData(session);

  // 2. TENTAR enriquecer (não bloqueia)
  try {
    const response = await fetch("/api/auth/user", { ... });
    if (response.ok) {
      const user = await response.json();
      saveAuthDataWithServerId(session, user.id); // sobrescreve com dados melhores
    }
  } catch {
    // Não bloqueia — já temos os dados básicos salvos
  }

  // 3. Redirecionar (sempre funciona)
  redirect("/");
}
```

---

## REGRA 4: NUNCA Deslogar por Erro Transitório (Fallback Local Pattern)

### O Bug
O hook `useAuth` fazia fetch do usuário autenticado. Se recebia 401 (token expirado, servidor reiniciando), limpava o localStorage → **deslogava o usuário**. Qualquer instabilidade de rede = perda de sessão.

### A Regra

**Antes de limpar dados de auth, SEMPRE verificar se tem fallback local. Só deslogar se CONFIRMADO que não há sessão válida.**

```typescript
// ❌ ERRADO — qualquer 401 desloga
if (response.status === 401) {
  clearAuthData();        // ← DESASTRE
  throw new Error("Unauthorized");
}

// ✅ CORRETO — fallback local antes de deslogar
if (response.status === 401) {
  // Tentar refresh primeiro
  const refreshed = await refreshToken();
  if (refreshed) {
    return retry(); // tentar de novo com novo token
  }

  // Verificar se tem dados locais como fallback
  const localData = getAuthData();
  if (localData) {
    console.warn("401 após retry — usando dados locais como fallback");
    return {
      id: localData.userId,
      email: localData.email,
      name: localData.name,
    };
  }

  // SÓ limpar se realmente não tem NADA
  clearAuthData();
  throw new Error("Unauthorized");
}
```

**Hierarquia de confiança para decidir se desloga:**
1. Servidor respondeu 200 → dados frescos ✅
2. Servidor respondeu 401 + refresh funcionou → retry ✅
3. Servidor respondeu 401 + refresh falhou + TEM dados locais → fallback local ✅
4. Servidor respondeu 401 + refresh falhou + SEM dados locais → deslogar ❌
5. Erro de rede + TEM dados locais → fallback local ✅
6. Erro de rede + SEM dados locais → deslogar ❌

---

## REGRA 5: `onAuthStateChange` Deve Proteger Dados Locais

### O Bug
O listener `onAuthStateChange` do Supabase emite eventos transitórios (ex: `TOKEN_REFRESHED` sem sessão por milissegundos). O handler limpava os dados a cada evento sem sessão → **deslogava aleatoriamente**.

### A Regra

**Só limpar auth data no evento `SIGNED_OUT` explícito. Todos os outros eventos sem sessão devem verificar dados locais.**

```typescript
// ❌ ERRADO — qualquer evento sem sessão desloga
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    saveAuthData(session);
  } else {
    clearAuthData();  // ← DESASTRE em TOKEN_REFRESHED transitório
  }
});

// ✅ CORRETO — protege dados locais
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    saveAuthData(session);
    callback(session);
  } else if (event === 'SIGNED_OUT') {
    // ÚNICO evento que realmente deve deslogar
    clearAuthData();
    callback(null);
  } else {
    // TOKEN_REFRESHED, INITIAL_SESSION, etc. sem sessão → transitório
    const savedData = getAuthData();
    if (savedData) {
      console.log(`Evento ${event} sem sessão — mantendo dados locais`);
    } else {
      callback(null);
    }
  }
});
```

---

## REGRA 6: Inicialização do AuthProvider Deve Ter 3 Caminhos

### O Bug
Ao recarregar a página, o AuthProvider não restaurava a sessão corretamente:
- Não verificava localStorage
- Não chamava `getSession()` para restaurar o JWT
- Resultado: spinner infinito ou redirect para login

### A Regra

**O AuthProvider DEVE implementar 3 caminhos de inicialização:**

```typescript
// ✅ CORRETO — 3 caminhos de inicialização
function AuthProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initialize = async () => {
      const supabase = getSupabase();
      const localData = getAuthData();

      if (localData) {
        // CAMINHO 1: Tem dados locais → verificar se sessão Supabase é válida
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            saveAuthData(session);
          } else {
            await refreshToken();
          }
        } catch {
          console.log("Erro na verificação — mantendo dados locais");
        }
      } else {
        // CAMINHO 2: Sem dados locais → verificar se Supabase tem sessão
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            saveAuthData(session);
          }
        } catch {
          // Nada a fazer — sem sessão
        }
      }

      // CAMINHO 3: Nenhum dado → manter não-autenticado (renderiza login)
      setIsInitialized(true);
    };

    initialize();
  }, []);

  if (!isInitialized) return <LoadingSpinner />;
  return <>{children}</>;
}
```

**Regras adicionais para o AuthProvider:**
- `isInitialized` SEMPRE começa `false` — resolve SOMENTE após `getSession()` completar
- Se tiver `StoreProvider` que carrega dados do banco, ele DEVE esperar `isInitialized = true` antes de fazer queries
- Safety timeout (5-10s) para nunca travar em loading infinito

---

## REGRA 7: Supabase Client no Vite — Singleton para HMR

### O Bug (específico para Vite/HMR)
Quando o dev salva um arquivo, o Vite faz Hot Module Replacement. Se o módulo que cria o `createClient()` for re-executado, cria uma NOVA instância que não tem o token JWT na memória. Resultado: queries retornam vazio, ou o GoTrue lock trava por 5s.

### A Regra

**Se o projeto usa Vite, o client Supabase DEVE ser singleton.**

```typescript
// ❌ ERRADO — recria a cada HMR
export const supabase = createClient(url, key);

// ✅ CORRETO — globalThis singleton (à prova de HMR)
declare global {
  var __supabaseClient: SupabaseClient | undefined;
}
if (!globalThis.__supabaseClient) {
  globalThis.__supabaseClient = createClient(url, key, { auth: { ... } });
}
export const supabase = globalThis.__supabaseClient;
```

---

## Checklist Rápido Para Revisão

Antes de considerar a autenticação "pronta", verifique:

- [x] **Rotas de callback estão isentas** de TODOS os guards de redirecionamento
- [x] **AuthCallback suporta PKCE E implícito** (3 estratégias em cascata)
- [x] **`detectSessionInUrl: true`** no createClient
- [x] **Auth é salvo ANTES** de buscar dados do servidor (save-first)
- [x] **401 transitório NÃO desloga** — usa fallback local
- [x] **Erros de rede NÃO deslogam** — usa fallback local
- [x] **`onAuthStateChange` só limpa dados no `SIGNED_OUT`** explícito
- [x] **AuthProvider tem 3 caminhos** de inicialização (local → supabase → nada)
- [x] **Supabase client é singleton** (se Vite/HMR)
- [x] **`isLoading`/`isInitialized` começa `true`/`false`** — resolve SOMENTE após `getSession()`
- [x] **Store/data fetching espera auth resolver** antes de fazer queries
- [x] **Safety timeout** (5-10s) existe para nunca travar em loading infinito
