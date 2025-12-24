# 🚀 Deploy Greg's Pizza no Vercel - Guia Rápido

## Método Simples (Interface Web) - RECOMENDADO ⭐

### Passo 1: Acessar Vercel

Click aqui: 👉 **https://vercel.com/new/clone?repository-url=https://github.com/marcos167/gregspizza**

Ou acesse manualmente: https://vercel.com/new

### Passo 2: Fazer Login

- Login com **GitHub** (recomendado)
- Ou Email

### Passo 3: Importar Repositório

1. Se usar o link direto, o repositório já aparece
2. Se não, procure por: `marcos167/gregspizza`
3. Click em **Import**

### Passo 4: Configurar Variáveis de Ambiente

**IMPORTANTE:** Adicione estas 3 variáveis antes de deploy:

```
VITE_SUPABASE_URL = https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY = sua_anon_key_aqui
VITE_AI_API_KEY = sua_gemini_key (opcional)
```

**Como obter as chaves do Supabase:**
1. Acesse https://supabase.com
2. Abra seu projeto (ou crie um novo)
3. Vá em: Settings > API
4. Copie: `Project URL` e `anon public`

### Passo 5: Deploy!

Click em **Deploy**

⏱️ Aguarde 2-3 minutos...

### ✅ Pronto!

Seu site estará no ar em:
```
https://gregspizza.vercel.app
```

Ou um domínio gerado automaticamente!

---

## Método Alternativo (CLI) - Avançado

**Apenas se já estiver logado no Vercel CLI:**

```bash
cd Y:\Dev\gregspizza
vercel --prod
```

Siga as instruções no terminal.

---

## ⚠️ Troubleshooting

### Erro: Missing environment variables

**Solução:** Configure as variáveis no Vercel dashboard:
1. Acesse seu projeto no Vercel
2. Settings > Environment Variables
3. Adicione as 3 variáveis acima
4. Redeploy (Deployments > ... > Redeploy)

### Erro: Build failed

**Solução comum:**
- Verifique se `package.json` está correto
- Execute local: `npm run build`
- Se funcionar local, deve funcionar no Vercel

---

## 📞 Suporte

**Dúvidas?**
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs

**Tudo pronto?**
Acesse seu site e teste! 🎉
