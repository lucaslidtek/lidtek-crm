# Issue 003B — Tela de Login (Auth Mock)

**Módulo:** Auth / Infra
**Prioridade:** Alta
**Dependências:** 001, 002

## Descrição

Criar tela de login com autenticação genérica (mock). Credenciais fixas para entrar e testar o sistema (ex: `admin@lidtek.com` / `123456`). Após login, redireciona para o Dashboard. Inclui AuthProvider com Context API, estado de sessão em localStorage (sobrevive refresh), e rota protegida (PrivateRoute) que redireciona para `/login` se não autenticado.

## Comportamento

- Tela `/login` com logo Lidtek + botão "Entrar com Google" (estilo Google Sign-In)
- Ao clicar: simula autenticação, loga como usuário mock padrão (ex: Lucas R.), redireciona para `/`
- Sem campos de e-mail/senha — apenas o botão do Google
- Após login: salva user no localStorage, redireciona para `/`
- Logout: botão no avatar da TopBar, limpa sessão, volta pra `/login`
- Rotas protegidas: qualquer rota diferente de `/login` exige sessão ativa

## Arquivos

- `[NEW]` `src/modules/auth/pages/Login.tsx` — tela de login glassmorphism, logo Lidtek, campos e-mail/senha
- `[NEW]` `src/modules/auth/hooks/useAuth.ts` — hook com login/logout/currentUser
- `[NEW]` `src/app/providers/AuthProvider.tsx` — Context com estado de sessão + localStorage
- `[NEW]` `src/app/PrivateRoute.tsx` — wrapper que redireciona pra /login se não autenticado
- `[MODIFY]` `src/app/Router.tsx` — adicionar rota /login, proteger demais rotas
- `[MODIFY]` `src/shared/components/layout/TopBar.tsx` — dropdown no avatar com opção "Sair"
