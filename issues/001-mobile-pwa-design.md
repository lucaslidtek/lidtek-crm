# Issue #001: Integração de Layout Mobile PWA e Melhoria de Contraste

**Descrição:** 
A visão mobile atualmente se baseia no comportamento da Sidebar e tem ausência de suporte apropriado a interfaces do tipo app nativo PWA, exigindo refinamentos no uso de "safe-areas" para aparelhos com notch físico, além de transicionar para uma Bottom Navigation Bar.
Adicionalmente, os fundos com *glassmorphism* não estão trazendo destaque satisfatório no modo "dark mode" porque a transparência "preta" da classe `.glass` se perde no background `bg-black/40` quando este já é inserido sobre o `--color-background` muito escuro. No "light mode", é necessário garantir a diferenciação entre os `.glass`-cards e o fundo branco dominante.

**Módulo:** M4 (Dashboard) e Core UI / Design System
**Prioridade:** Alta (Melhoria de UI/UX)
**Dependências:** Nenhuma

**Critérios de Aceite:**
- Usuário em Mobile (<768px de largura) deverá ver a página com barra de navegação embaixo (BottomNavigation) e a Sidebar oculta garantidamente.
- Usuário no mobile sempre enxergará o logo para não se sentir perdido (o logo ficará na TopBar superior).
- Cartões do relatórios e dashboard se sobressaem do background tanto no dark mode quanto do light mode.
- Todo esse escopo é documentado detalhadamente em `src/references/DESIGN.md`.
