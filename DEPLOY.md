# 🚀 Deploy Greg's Pizza - Sistema Atualizado

## ✅ Código Já Está no GitHub!

O código com o **sistema de controle de ingredientes** foi enviado com sucesso para:
```
https://github.com/marcos167/gregspizza
```

**Commit:** `feat: Sistema de controle de ingredientes completo`

---

## 🎯 Opções de Deploy

### Opção 1: Deploy Automático via Vercel (RECOMENDADO) ⭐

Se você já tem o projeto conectado ao Vercel, o deploy será **automático**!

**Verificar status:**
1. Acesse: https://vercel.com/dashboard
2. Procure por `gregspizza`
3. Verifique se apareceu um novo deployment

**Se não estiver conectado:**
1. Acesse: https://vercel.com/new
2. Conecte com GitHub
3. Selecione o repositório `marcos167/gregspizza`
4. Configure as variáveis de ambiente (veja abaixo)
5. Deploy!

---

### Opção 2: Deploy Manual via CLI

**Se você já estiver autenticado no Vercel:**

```bash
cd Y:\Dev\gregspizza
vercel login
vercel --prod
```

**Se não estiver autenticado:**

```bash
vercel login
# Siga as instruções para fazer login
```

---

## 🔑 Variáveis de Ambiente Necessárias

**IMPORTANTE:** Configure estas variáveis no Vercel Dashboard:

```env
VITE_SUPABASE_URL=https://pcmyscxqkthrilhazfrz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_AI_API_KEY=sua_gemini_key_aqui (opcional)
```

**Como adicionar:**
1. Vercel Dashboard → Seu Projeto
2. Settings → Environment Variables
3. Adicionar cada variável
4. Production ✓
5. Save

---

## 🗄️ IMPORTANTE: Atualizar Schema do Supabase

### ⚠️ Antes de usar o sistema em produção:

O schema do banco precisa ser atualizado com as novas funções SQL.

**Execute este arquivo no Supabase:**
[supabase-schema.sql](file:///Y:/Dev/gregspizza/supabase-schema.sql)

**Como executar:**
1. Acesse https://supabase.com
2. Abra seu projeto
3. Vá em: SQL Editor
4. Copie o conteúdo completo de `supabase-schema.sql`
5. Cole no editor
6. Clique em "Run"

**O que isso faz:**
- ✅ Atualiza trigger de dedução automática de estoque
- ✅ Adiciona função de cálculo de capacidade
- ✅ Cria view de ingredientes com alertas

---

## 📋 Checklist de Deploy

- [x] Código commitado no Git
- [x] Código pushed para GitHub
- [ ] Deploy no Vercel (automático ou manual)
- [ ] Variáveis de ambiente configuradas
- [ ] Schema SQL atualizado no Supabase
- [ ] Teste de funcionalidade em produção

---

## 🧪 Teste Após Deploy

**Fluxo de teste completo:**

1. **Login** no sistema
2. **Entrada de Estoque** - Adicione alguns ingredientes
3. **Receitas** - Crie receita e vincule ingredientes
4. **Verificar Capacidade** - Deve aparecer número real (não random)
5. **Registrar Venda** - Sem estoque deve bloquear ❌
6. **Com Estoque** - Venda deve funcionar + deduzir ingredientes ✅
7. **Dashboard** - Ver alertas de estoque baixo

---

## 🔗 Links Úteis

- **GitHub Repo:** https://github.com/marcos167/gregspizza
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Documentação Completa:** [walkthrough.md](file:///C:/Users/--/.gemini/antigravity/brain/eaee0d50-e3bc-484c-bc61-6a457814b6ba/walkthrough.md)

---

## ⚡ Deploy Rápido (Se já configurado)

Se o projeto JÁ está no Vercel e com variáveis configuradas:

```bash
git push origin main
```

**Pronto!** Vercel faz deploy automaticamente em ~2 minutos.

---

## 📞 Troubleshooting

### Problema: "Command failed: vercel --prod"
**Solução:** Faça login primeiro
```bash
vercel login
```

### Problema: "Missing environment variables"
**Solução:** Configure no Vercel Dashboard → Settings → Environment Variables

### Problema: Capacidade aparece como "Configure ingredientes"
**Solução:** Execute o `supabase-schema.sql` atualizado

### Problema: Venda não deduz estoque
**Solução:** 
1. Verifique se o trigger foi criado no Supabase
2. Execute o schema SQL completo
3. Teste criar uma venda

---

## ✅ Status Atual

- ✅ **Código:** Atualizado no GitHub
- ⏳ **Deploy:** Aguardando configuração Vercel
- ⏳ **Database:** Aguardando atualização do schema SQL

**Próximo passo:** Configure o deploy no Vercel e atualize o schema do Supabase!
