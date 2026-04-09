# Plan 003B — Tela de Login (Auth Mock)

## Descrição
Criar tela de login com botão "Entrar com Google" (mock — não conecta com Google real). Ao clicar, loga como usuário mock padrão (Lucas R.) e redireciona para Dashboard. Inclui AuthProvider, sessão em localStorage, e rotas protegidas.

## Módulo
Auth — R-SEC-01 (autenticação)

## Arquivos

#### [NEW] `src/app/providers/AuthProvider.tsx`
- Context com: `user: User | null`, `isAuthenticated: boolean`, `login()`, `logout()`
- `login()`: salva user mock no state + localStorage, seta `isAuthenticated = true`
- `logout()`: limpa state + localStorage, seta `isAuthenticated = false`
- No mount: verifica localStorage para restaurar sessão

#### [NEW] `src/modules/auth/pages/Login.tsx`
- Layout fullscreen, centrado, sem Sidebar/TopBar
- Background: `#080808` com glow decorativo primary
- Card central glass com:
  - Logo Lidtek (SVG) + "Lidtek CRM" em `font-display`
  - Subtítulo: "Sistema de Gestão de Projetos"
  - Botão "Entrar com Google" com ícone Google (SVG inline)
    - Estilo: `bg-white text-gray-800 rounded-xl px-6 py-3 font-medium`
    - Hover: `shadow-lg scale-[1.02]`
  - Ao clicar: chama `auth.login()`, redireciona para `/`
- Framer Motion: fade-in no card

#### [NEW] `src/app/PrivateRoute.tsx`
- Wrapper que verifica `isAuthenticated`
- Se não autenticado: `<Redirect to="/login" />`
- Se autenticado: renderiza children

#### [MODIFY] `src/app/Router.tsx`
- Importar `PrivateRoute`
- Rota `/login` fora do `PageLayout` (sem sidebar)
- Demais rotas dentro de `PrivateRoute > PageLayout`

#### [MODIFY] `src/shared/components/layout/TopBar.tsx`
- Avatar vira DropdownMenu (Radix)
- Items: nome do user, e-mail, separador, "Sair" (chama `auth.logout()`)
- Nome e iniciais vêm do `currentUser` do AuthProvider

#### [MODIFY] `src/app/App.tsx`
- Envolver com `AuthProvider` (acima do `SidebarProvider`)

## Design
- Tela de login: background escuro com glow decorativo
- Card: `glass rounded-2xl p-10 max-w-sm`
- Botão Google: estilo nativo do Google Sign-In (fundo branco, texto escuro)
- Sem formulário — um único botão

## Cenários
- **Happy path:** Usuário abre `/` → redirecionado para `/login` → clica "Entrar com Google" → vai pro Dashboard
- **Sessão existente:** Usuário com sessão no localStorage → abre `/` → vai pro Dashboard direto
- **Logout:** Clica no avatar → "Sair" → volta pro `/login`

## Checklist
- [ ] AuthProvider com Context + localStorage
- [ ] Tela Login com botão Google
- [ ] PrivateRoute wrapper
- [ ] Atualizar Router (login fora, demais dentro de PrivateRoute)
- [ ] Atualizar TopBar (dropdown no avatar com logout)
- [ ] Atualizar App.tsx com AuthProvider
