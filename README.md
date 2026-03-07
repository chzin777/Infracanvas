# InfraCanvas Pro

Editor visual de diagramas de infraestrutura e fluxogramas, com modo físico/lógico, assistente de IA e fluxos dentro de nós.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwindcss)

---

## O que é

InfraCanvas Pro é um canvas interativo para desenhar **topologias de rede**, **infraestrutura de TI** e **fluxogramas** em um único lugar. Você alterna entre visão **física** (servidores, switches, firewalls) e **lógica** (APIs, bancos de dados, containers, formas de fluxograma). Nós físicos podem ter um **fluxograma interno** (duplo clique) e a **IA monta diagramas** a partir de um prompt.

---

## Funcionalidades

| Recurso | Descrição |
|--------|------------|
| **Modo Físico** | Servidor, computador, laptop, storage, rack, roteador, switch, firewall, access point, impressora |
| **Modo Lógico** | Banco de dados, software, API, cloud, container, VM, subnet, load balancer, DNS, monitoring |
| **Formas de fluxograma** | Processo, decisão (losango), início/fim (elipse), entrada/saída (paralelogramo), documento, processo predefinido |
| **Assistente de IA** | Descreva o diagrama em português; a IA gera nós, conexões, textos e cores. Detecta se é infra física ou fluxograma e alterna o modo. Pode incluir fluxos dentro de nós físicos. |
| **Conexões** | Unidirecional, bidirecional; cores por tipo de nó; snap ao alinhar |
| **Caixas de texto** | Anotações e legendas; redimensionar pelas bordas; duplo clique para editar |
| **Projetos** | Salvar/carregar no navegador, export/import JSON, múltiplos projetos |
| **Visão interna** | Duplo clique em um nó físico abre um canvas lógico dentro dele (fluxograma ou iframe) |
| **Dicas de atalhos** | Aparecem 1 vez por navegador (Space para navegar, Shift+scroll horizontal, etc.) |

---

## Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **@xyflow/react** (canvas de nós e edges)
- **Tailwind CSS 4**
- **Lucide React** (ícones)
- **react-markdown** (respostas da IA)
- **OpenRouter** (modelo Gemini para o assistente de IA)

---

## Como rodar

### 1. Clonar e instalar

```bash
git clone https://github.com/chzin777/Infracanvas.git
cd Infracanvas
npm install
```

### 2. Variáveis de ambiente (para o Assistente de IA)

Crie um arquivo `.env.local` na raiz:

```env
OPENROUTER_API_KEY=sua-chave-aqui
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

A chave pode ser obtida em [OpenRouter](https://openrouter.ai). Sem ela, o resto do app funciona; apenas o botão **Assistente IA** não fará requisições.

### 3. Subir o projeto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Build de produção:

```bash
npm run build
npm start
```

---

## Atalhos e dicas

| Ação | Atalho |
|------|--------|
| Navegar pelo canvas | Segurar **Espaço** e arrastar |
| Rolagem horizontal | **Shift** + scroll do mouse |
| Editar texto no nó | **Duplo clique** na caixa de texto |
| Mover caixa de texto | Clique simples e arrastar |
| Abrir fluxo interno do nó | **Duplo clique** em um nó físico |
| Salvar projeto | **Ctrl+S** |
| Desfazer / Refazer | **Ctrl+Z** / **Ctrl+Shift+Z** |

As dicas aparecem sozinhas na primeira vez (uma por sessão, salvas no navegador).

---

## Estrutura do projeto

```
infra/
├── app/
│   ├── api/ai/          # Rota da API do assistente (OpenRouter)
│   ├── components/      # Componentes do canvas, sidebar, painéis, IA
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── .env.local           # Sua chave (não commitado)
├── next.config.ts
├── package.json
└── README.md
```

---

## Licença

MIT.
