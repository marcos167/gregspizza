# 🔐 Guia de Configuração - Mercado Pago

## 📋 PASSO 1: Obter Credenciais Mercado Pago

### 1.1 Acesse o Painel de Desenvolvedores
```
https://www.mercadopago.com.br/developers/panel
```

### 1.2 Crie uma Aplicação (se ainda não tiver)
- Nome: **EstokMax**
- Tipo: **Online Payments**

### 1.3 Obtenha as Credenciais
```
https://www.mercadopago.com.br/developers/panel/credentials
```

**Modo TEST (para desenvolvimento):**
- Access Token: `APP_USR-XXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXX`
- Public Key: `APP_USR-XXXXXXXX-XXXXXX-XX`

**Modo PRODUCTION (quando estiver pronto):**
- Access Token: `APP_USR-YYYYYYYY-YYYYYY-YYYYYYYYYYYYYYYY`
- Public Key: `APP_USR-YYYYYYYY-YYYYYY-YY`

---

## 📂 PASSO 2: Configurar Localmente

### 2.1 Criar arquivo .env.local
```bash
# Na raiz do projeto Y:\Dev\gregspizza\
# Copie o .env.local.example
cp .env.local.example .env.local
```

### 2.2 Editar .env.local
```env
# Substitua com suas credenciais REAIS
MERCADOPAGO_ACCESS_TOKEN=APP_USR-seu-token-do-painel
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-sua-key-do-painel
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ☁️ PASSO 3: Configurar no Vercel

### 3.1 Acesse Vercel Settings
```
https://vercel.com/povitys-projects/gregspizza/settings/environment-variables
```

### 3.2 Adicionar Environment Variables

**Adicione 3 variáveis:**

1. **MERCADOPAGO_ACCESS_TOKEN**
   - Value: `APP_USR-seu-access-token-aqui`
   - Environment: Production, Preview, Development

2. **NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY**
   - Value: `APP_USR-sua-public-key-aqui`
   - Environment: Production, Preview, Development

3. **NEXT_PUBLIC_APP_URL**
   - Value: `https://gregspizza.vercel.app`
   - Environment: Production
   - Value: seu-preview-url para Preview
   - Value: `http://localhost:3000` para Development

---

## 🔔 PASSO 4: Configurar Webhook URL

### 4.1 Acesse Notificações
```
https://www.mercadopago.com.br/developers/panel/notifications
```

### 4.2 Adicionar URL de Notificação

**Para PRODUÇÃO:**
```
https://gregspizza.vercel.app/api/webhooks/mercadopago
```

**Para TESTE (ngrok):**
```
https://determinatively-luscious-miki.ngrok-free.dev/api/webhooks/mercadopago
```

### 4.3 Eventos a Monitorar
✅ Marque:
- `payment` (pagamentos)
- `preapproval` (assinaturas)

---

## ⚠️ IMPORTANTE: WEBHOOK SECRET

### ❌ Mercado Pago NÃO tem Webhook Secret!

Diferente do Stripe, o Mercado Pago usa um sistema diferente:

**Como funciona:**
1. MP envia notificação: `{ type: "payment", data: { id: "123456" } }`
2. Seu webhook **NÃO confia** no payload
3. Webhook **busca** na API: `getPayment("123456")`
4. Processa dados **confirmados** pela API oficial

**Por que isso é seguro:**
- ✅ Dados sempre vêm da API oficial do MP
- ✅ Impossível falsificar (precisa do Access Token)
- ✅ Sem risco de replay attacks

**No código:**
```typescript
// Webhook recebe notificação
const { data } = req.body; // { id: "123456" }

// SEMPRE busca dados reais via API
const payment = await getPayment(data.id); // Usa Access Token

// Processa dados confirmados
if (payment.status === 'approved') {
  // ...
}
```

**Conclusão:** Você NÃO precisa de webhook secret! O código já está correto.

---

## 🧪 PASSO 5: Testar Localmente

### 5.1 Instalar Dependências
```bash
npm install
```

### 5.2 Rodar Dev Server
```bash
npm run dev
```

### 5.3 Expor com ngrok
```bash
ngrok http 3000
```

### 5.4 Atualizar Webhook no MP
Use a URL do ngrok nas notificações (passo 4.2)

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

- [ ] Obtido Access Token do Mercado Pago
- [ ] Obtido Public Key do Mercado Pago
- [ ] Criado .env.local local
- [ ] Adicionado variáveis no Vercel
- [ ] Configurado webhook URL no MP
- [ ] npm install executado
- [ ] Testado localmente com ngrok

---

## 🚀 NEXT STEPS

Após configurar tudo:

1. **Testar Checkout:**
   - Use SubscribeButton em alguma página
   - Faça um pagamento de teste
   - Confira webhook recebendo notificação

2. **Cartões de Teste:**
   ```
   Aprovado: 5031 4332 1540 6351
   Recusado: 5031 7557 3453 0604
   ```

3. **Monitorar Webhooks:**
   - Veja logs no Vercel
   - Confira notificações no painel MP
   - Verifique database (billing_transactions)

**Pronto para processar pagamentos! 🎉**
