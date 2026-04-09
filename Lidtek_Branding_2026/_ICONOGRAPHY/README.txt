Lidtek Iconography - Phosphor Icons

https://phosphoricons.com/

---

## 1. Instalação via terminal (React)

No projeto React (Vite, Next, CRA, etc.), execute:

```bash
npm install phosphor-react
```

ou, se estiver usando Yarn:

```bash
yarn add phosphor-react
```

Isso instala a biblioteca completa de ícones Phosphor com suporte a pesos, tamanhos e cores via props.

---

## 2. Importação dos ícones

No arquivo onde os ícones serão utilizados:

```jsx
import { Gear, Code, Layers } from "phosphor-react";
```

Cada ícone é um componente React independente.

---

## 3. Padrão oficial da Lidtek (definição para o brandbook)

Para manter consistência visual, o sistema de iconografia da Lidtek adota o seguinte **padrão fixo**:

* **Peso:** `regular`
* **Tamanho:** `20px`
* **Stroke alinhado ao grid**
* **Uso preferencial monocromático**

### Exemplo de uso padrão:

```jsx
<Gear size={20} weight="regular" />
```

---

## 4. Definindo um componente padrão (boa prática)

Para garantir consistência em todo o projeto, recomenda-se criar um **wrapper de ícone**:

```jsx
import { IconProps } from "phosphor-react";

export function LidtekIcon(props: IconProps) {
  return (
    <props.icon
      size={20}
      weight="regular"
      {...props}
    />
  );
}
```

Ou, mais simples, um padrão direto de uso documentado:

```jsx
<Icon size={20} weight="regular" />
```

---

## 5. Uso com cores da marca

Os ícones herdam a cor automaticamente via `color` ou CSS.

### Exemplo com cores da Lidtek:

```jsx
<Code size={20} weight="regular" color="#6580E1" />
```

Ou via CSS (recomendado):

```jsx
<Layers className="icon-primary" />
```

```css
.icon-primary {
  color: #243A4A;
}
```

---

