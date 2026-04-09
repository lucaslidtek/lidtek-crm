# Plan 001: Integração de Layout Mobile PWA e Melhoria de Contraste

## Descrição
Melhorar toda a casca (layout) para suportar PWA/Native look and feel em mobile, usando varáveis de ambiente CSS (env) para suportar SafeArea. Além de arrumar especificamente o contraste ruim do glass em cima do background do root html.

## Módulo
Core UI (PageLayout, Components, Estilos globais)

## Arquivos Globais de Design e Estilo
### [MODIFY] `src/styles/globals.css`
- Atualizar a declaração `:is(html.dark) .glass` para usar `background: rgba(255, 255, 255, 0.05) !important;`
- No bloco `:is(html.dark) .glass-hover` colocar `rgba(255, 255, 255, 0.08) !important;`
- Adicionar no body `padding-bottom: env(safe-area-inset-bottom);` quando for PWA isolado (se cabível).

### [MODIFY] `src/references/DESIGN.md`
- Inclusão do **Capítulo 12. Padrões Mobile PWA** ou anexo onde documenta a nova `BottomNavigation`.

## Arquivos de Layout e Componentes
### [NEW] `src/shared/components/layout/BottomNavigation.tsx`
- Implementa um container `fixed bottom-0 left-0 right-0 z-50 glass` rodando em `flex md:hidden`.
- Renderiza um conjunto limitido de icones/links iterando um array de navs (Dashboard, CRM, Projetos, etc).
- Insere Padding extra embaixo com suporte a notch em mobile via `pb-[max(calc(env(safe-area-inset-bottom)+0.5rem),0.5rem)]`.

### [MODIFY] `src/shared/components/layout/PageLayout.tsx`
- Importar `BottomNavigation`.
- Rendelizar logo depois ou antes do component pai de UI. E atualizar marginLeft rules para o motion.main garantindo ser zero no mobile (ex: usar media querries ou framer-motion variants que leiam tamanho de tela se for JS bound; o mais facil é CSS tailwind classes com margin variables reset para `ml-0`). O Framer motion por default injeta `style={...}`. Podemos adicionar uma classe `max-md:!ml-0`.
- Deixar a sidebar e bottom navbar renderizadas ao mesmo tempo? Melhor alterar a `<Sidebar />` para ficar oculta na `md`.

### [MODIFY] `src/shared/components/layout/TopBar.tsx`
- Injetar o Logo / Branding no Topbar apenas para displays pequenos `md:hidden`, pois o Sidebar vai sumir do Desktop.

## Casos Extras e Testes
- Hover effects em botões do BottomNav devem usar areas de clique largas visando dedo de usuário. (Minimo `w-12 h-12`).

## Checklist (Gates de Fase 4 / Fase 5)
- [ ] CSS `globals.css` modificado
- [ ] Elemento BottomNavigation construído
- [ ] PageLayout atualizado para esconder Margin/SideBar
- [ ] TopBar contém Logo no mobile
- [ ] Design.md Atualizado
