# Greg's Pizza - Sistema Inteligente de Gestão de Estoque

Sistema de gestão de estoque com IA para pizzaria, desenvolvido com React + Vite e Supabase.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **UI**: CSS moderno com design system premium
- **Ícones**: Lucide React
- **Gráficos**: Recharts
- **IA**: Google Gemini / OpenAI GPT-4

## 📋 Funcionalidades

✅ **Dashboard em Tempo Real**
- KPIs principais (valor em estoque, capacidade de produção)
- Visualização de status de estoque
- Alertas automáticos
- Insights da IA

✅ **Gestão de Estoque**
- Registro de entradas (compras)
- Registro de saídas (vendas)
- Cálculo automático de capacidade
- Alertas de estoque baixo

✅ **Receitas Inteligentes**
- Cadastro de pizzas e esfihas
- Proporções de ingredientes
- Cálculo automático de produção possível

✅ **Relatórios Semanais**
- Geração automática
- Análise de vendas vs custos
- Recomendações da IA
- Identificação de padrões

✅ **IA Integrada**
- Análise de padrões de venda
- Previsão de demanda
- Sugestões de compra otimizadas
- Detecção de desperdícios

## 🛠️ Setup

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

4. Preencha as variáveis de ambiente:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-key
VITE_AI_API_KEY=sua-api-key-gemini-ou-openai
```

### 3. Criar Banco de Dados

1. Abra o Supabase Dashboard
2. Vá em SQL Editor
3. Execute o arquivo `supabase-schema.sql`

### 4. Executar Aplicação

```bash
npm run dev
```

Acesse: `http://localhost:5173`

## 📁 Estrutura do Projeto

```
gregspizza/
├── src/
│   ├── components/
│   │   └── Sidebar.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── StockEntry.tsx
│   │   ├── SalesEntry.tsx
│   │   ├── RecipeManager.tsx
│   │   └── WeeklyReport.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── App.tsx
│   └── index.css
├── supabase-schema.sql
└── package.json
```

## 🎨 Design System

O projeto utiliza um design system premium com:
- Paleta de cores temática (pizza)
- Componentes reutilizáveis
- Animações suaves
- Responsividade mobile-first
- Glassmorphism effects

## 📊 Banco de Dados

### Tabelas Principais

- **ingredients**: Ingredientes cadastrados
- **stock_entries**: Entradas de estoque
- **stock_exits**: Vendas registradas
- **recipes**: Receitas de produtos
- **recipe_ingredients**: Proporções de ingredientes
- **weekly_reports**: Relatórios semanais
- **ai_insights**: Insights gerados pela IA

## 🤖 Integração com IA

O sistema pode ser integrado com:
- **Google Gemini API** (recomendado para MVP)
- **OpenAI GPT-4** (para análises mais avançadas)

Funcionalidades da IA:
- Análise de padrões de venda
- Previsão de demanda
- Otimização de compras
- Detecção de anomalias

## 🚀 Deploy

### Frontend (Vercel)

```bash
npm run build
# Deploy to Vercel
```

### Backend (Supabase)

O backend já está hospedado no Supabase.
Configure as variáveis de ambiente no seu provedor de hosting.

## 📝 TODO

- [ ] Implementar Edge Functions para IA
- [ ] Adicionar autenticação de usuários
- [ ] Criar sistema de notificações
- [ ] Adicionar exportação de relatórios (PDF)
- [ ] Implementar gráficos interativos
- [ ] Criar app mobile (PWA)

## 📄 Licença

MIT

## 👨‍💻 Desenvolvido por

Greg's Pizza Team - Sistema Inteligente de Gestão
