# 🔧 GUIA: Corrigir Platform Admin no Supabase

## ❌ ERRO ATUAL
```
Error: Failed to run sql query: ERROR: relation "tenants" does not exist
```

## ✅ SOLUÇÃO: Executar SQLs na ordem correta

### PASSO 1: Executar Schema Base (PRIMEIRO!)

**Arquivo:** `supabase-phase1-multi-tenant-FIXED.sql`

**O que faz:**
- Cria tabela `tenants`
- Adiciona `tenant_id` a todas as tabelas
- Cria enums `user_role` e `user_status`
- Configura RLS básico
- Cria funções de gerenciamento

**Como executar:**
```
1. Supabase Dashboard → SQL Editor
2. Abrir: Y:\Dev\gregspizza\supabase-phase1-multi-tenant-FIXED.sql
3. Copiar TODO o conteúdo
4. Colar no SQL Editor
5. Click "Run"
6. Aguardar mensagem de sucesso
```

---

### PASSO 2: Executar Policies do Platform Admin (SEGUNDO!)

**Arquivo:** `supabase-platform-admin-policies.sql`

**O que faz:**
- Adiciona policies para SUPER_ADMIN acessar tenants
- Permite Platform Admin funcionar SEM service key
- Seguro para uso no browser

**Como executar:**
```
1. APÓS passo 1 ter sucesso
2. Supabase SQL Editor → New Query
3. Abrir: Y:\Dev\gregspizza\supabase-platform-admin-policies.sql
4. Copiar TODO o conteúdo
5. Colar e Run
```

---

### PASSO 3: Criar Tenant Padrão

**SQL para executar DEPOIS dos passos anteriores:**

```sql
-- Inserir tenant padrão "gregs-pizza"
INSERT INTO tenants (
    slug, 
    name, 
    owner_email, 
    plan, 
    status
) VALUES (
    'gregs-pizza',
    'Greg''s Pizza - Flagship',
    'marco.lp12@hotmail.com',
    'pro',
    'active'
) ON CONFLICT (slug) DO NOTHING;

-- Verificar
SELECT * FROM tenants;
```

---

### PASSO 4: Verificar seu usuário SUPER_ADMIN

```sql
-- Ver seu perfil atual
SELECT 
    id, 
    email, 
    role, 
    tenant_id,
    status
FROM user_profiles 
WHERE email = 'marco.lp12@hotmail.com';

-- Se NÃO for SUPER_ADMIN ainda, corrigir:
UPDATE user_profiles
SET 
    role = 'SUPER_ADMIN',
    tenant_id = NULL,
    status = 'ACTIVE'
WHERE email = 'marco.lp12@hotmail.com';
```

---

## 📋 CHECKLIST COMPLETO

- [ ] **1.** Executar `supabase-phase1-multi-tenant-FIXED.sql`
- [ ] **2.** Executar `supabase-platform-admin-policies.sql`  
- [ ] **3.** Inserir tenant "gregs-pizza"
- [ ] **4.** Verificar SUPER_ADMIN está configurado
- [ ] **5.** Commit + Push código atualizado
- [ ] **6.** Aguardar deploy Vercel (~1 min)
- [ ] **7.** Testar `/platform/admin`

---

## 🎯 RESULTADO ESPERADO

Após executar tudo:

✅ Tenant "gregs-pizza" criado  
✅ Você é SUPER_ADMIN sem tenant_id  
✅ Platform Admin carrega lista de tenants  
✅ Pode criar novos tenants  
✅ Sem errors "Erro ao carregar tenants"

---

## 🚨 SE DER ERRO

**"extension uuid-ossp does not exist":**
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**"relation already exists":**
- Ignorar, significa que já estava criado
- Continue para próximo passo

**"permission denied":**
- Certifique que está logado no Supabase
- Use o mesmo projeto configurado no .env

---

## ⚡ QUICK START (copie e cole no SQL Editor)

```sql
-- 1. Criar extension (se necessário)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Colar conteúdo de supabase-phase1-multi-tenant-FIXED.sql
-- (copiar manualmente do arquivo)

-- 3. Depois, colar conteúdo de supabase-platform-admin-policies.sql  
-- (copiar manualmente do arquivo)

-- 4. Criar tenant e verificar
INSERT INTO tenants (slug, name, owner_email, plan, status)
VALUES ('gregs-pizza', 'Greg''s Pizza', 'marco.lp12@hotmail.com', 'pro', 'active')
ON CONFLICT (slug) DO NOTHING;

UPDATE user_profiles
SET role = 'SUPER_ADMIN', tenant_id = NULL, status = 'ACTIVE'
WHERE email = 'marco.lp12@hotmail.com';

-- 5. Verificar tudo
SELECT * FROM tenants;
SELECT * FROM user_profiles WHERE email LIKE '%marco%';
```

Pronto! 🎉
