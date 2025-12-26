# 🤖 Configuração da IA - OpenAI

## ✅ O que foi implementado:

### 1. Serviço de IA (`src/services/ai.ts`)
- Integração com OpenAI API (modelo: gpt-4o-mini)
- Geração automática de insights de estoque
- Análise de padrões de vendas
- Recomendações de compra personalizadas

### 2. Funcionalidades da IA

**Análise de Inventário:**
- Detecta estoque baixo ou em excesso
- Identifica padrões de consumo
- Prevê necessidades futuras

**Insights Gerados:**
- Alertas de reposição (prioridade ALTA)
- Oportunidades de otimização (prioridade MÉDIA)
- Sugestões estratégicas (prioridade BAIXA)

**Categorias:**
- `inventory` - Gestão de estoque
- `sales` - Análise de vendas
- `optimization` - Otimizações
- `alert` - Alertas críticos

---

## 🔑 Configuração - Passo a Passo

### Desenvolvimento Local:

1. Adicione no arquivo `.env`:
```env
VITE_OPENAI_API_KEY=sua_chave_openai_aqui
```

2. Reinicie o servidor:
```bash
npm run dev
```

3. No Dashboard, click em **"⚡ Gerar Insights"**

---

### Produção (Vercel):

#### Opção 1: Via Dashboard (Recomendado)

1. Acesse: https://vercel.com/povitys-projects/gregspizza/settings/environment-variables

2. Click em **"Add New"**

3. Preencha:
   - **Name:** `VITE_OPENAI_API_KEY`
   - **Value:** `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`
   - **Environments:** Marque `Production`, `Preview`, `Development`

4. Click **"Save"**

5. Va em **Deployments** > último deploy > **"Redeploy"**

6. Aguarde 2-3 minutos

7. Teste: https://gregspizza.vercel.app

#### Opção 2: Via CLI

```bash
vercel env add VITE_OPENAI_API_KEY
# Cole a chave quando solicitado
# Selecione: Production, Preview, Development

vercel --prod
```

---

## 🎯 Como Usar

### No Dashboard:

1. Acesse: https://gregspizza.vercel.app/dashboard

2. Na seção "Insights da IA", click em **"⚡ Gerar Insights"**

3. Aguarde 5-10 segundos (IA analisando dados)

4. Insights aparecerão automaticamente com:
   - 🔴 **Alta**: Ação urgente necessária
   - 🟡 **Média**: Oportunidade de melhoria  
   - 🟢 **Baixa**: Sugestão estratégica

### Exemplos de Insights:

```
⚡ ALTA: Estoque baixo de queijo mussarela
"Apenas 2kg restantes. Com base nas vendas, reponha 15kg 
para cobrir a semana. Terças e sáb ados têm pico de 40%."

💡 MÉDIA: Otimize compra de tomates
"Você compra toda semana, mas quinzenal seria 15% mais 
econômico. Fornecedor X tem desconto em volume."

💡 BAIXA: Padrão identificado - Pizza Calabresa
"Sextas-feiras vendem 35% mais. Considere oferta especial."
```

---

## 🧪 Testando a IA

### Teste Rápido:

1. Cadastre alguns ingredientes em "Entrada de Estoque"
2. Registre vendas em "Registrar Vendas"
3. Volte ao Dashboard
4. Click "Gerar Insights"
5. Veja a mágica acontecer! ✨

### Teste Avançado:

Execute no console do navegador:
```javascript
// Ver última análise
fetch('https://api.openai.com/v1/models', {
  headers: { 
    'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}` 
  }
}).then(r => r.json()).then(console.log)
```

---

## 📊 Custo Estimado

**Modelo:** gpt-4o-mini  
**Preço:** ~$0.15 por 1M tokens de entrada / $0.60 por 1M de saída

**Uso típico:**
- 1 análise = ~1.000 tokens = $0.0002 (R$ 0,001)
- 100 análises/dia = $0.02/dia (R$ 0,10/dia)
- **~R$ 3/mês** de uso intenso

**Grátis:** OpenAI oferece $5 de créditos iniciais!

---

## 🔒 Segurança

### ⚠️ IMPORTANTE:

1. **NUNCA** compartilhe sua `VITE_OPENAI_API_KEY`
2. **NUNCA** faça commit da chave no GitHub
3. Use `.env` (já está no `.gitignore`)

### Roubaram sua chave?

1. Acesse: https://platform.openai.com/api-keys
2. Click em **"Revoke"** na chave comprometida
3. Gere nova chave
4. Atualize no Vercel

---

## 🐛 Troubleshooting

### Erro: "Missing API Key"
- Verifique se `VITE_OPENAI_API_KEY` está configurada
- Reinicie o servidor local
- No Vercel, force um redeploy

### Erro: "Quota Exceeded"
- Créditos da OpenAI esgotados
- Adicione método de pagamento: https://platform.openai.com/account/billing

### Insights não aparecem
- Verifique console do navegador (F12)
- Certifique-se de ter dados (ingredientes + vendas)
- API pode levar 5-10 segundos

### Erro 429 (Rate Limit)
- Muitas requisições em pouco tempo
- Aguarde 1 minuto
- Configure rate limiting no código (futuro)

---

## 📈 Próximos Passos

### Melhorias Planejadas:

- [ ] Cache de insights (evitar chamadas repetidas)
- [ ] Agendamento automático (insights diários)
- [ ] Gráficos de tendências com IA
- [ ] Chatbot para perguntas personalizadas
- [ ] Integração com WhatsApp (notificações)
- [ ] Previsão de demanda semanal
- [ ] Detecção de fraude/desperdício

---

## 💡 Dicas de Uso

1. **Gere insights 1x por dia** (economiza tokens)
2. **Use nos relatórios semanais** para decisões estratégicas
3. **Compartilhe com a equipe** - IA vê padrões que humanos não veem
4. **Aja nos insights de ALTA prioridade** imediatamente
5. **Monitore custos** em https://platform.openai.com/usage

---

## 📞 Suporte

**Dúvidas sobre IA?**
- OpenAI Docs: https://platform.openai.com/docs
- Suporte OpenAI: https://help.openai.com

**Problemas técnicos?**
- Verifique o console do navegador
- Logs do Vercel: https://vercel.com/povitys-projects/gregspizza/logs

---

**🍕 Sistema Inteligente Pronto!**  
*A IA agora trabalha para você 24/7*
