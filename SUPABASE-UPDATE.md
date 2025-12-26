# 🚀 Guia Rápido: Executar Schema SQL no Supabase

## ✅ Passos Simples

### 1. Acesse o Supabase
👉 https://supabase.com/dashboard

### 2. Abra seu Projeto
Procure por: **gregspizza** ou o nome do seu projeto

### 3. Vá para o SQL Editor
- No menu lateral, clique em: **SQL Editor**
- Ou acesse: https://supabase.com/dashboard/project/SEU_PROJECT_ID/sql

### 4. Criar Nova Query
- Clique em: **+ New query**

### 5. Copiar e Colar o Schema

**Opção A - Todo o arquivo (Recomendado):**
1. Abra o arquivo: `supabase-schema.sql`
2. Selecione TUDO (Ctrl+A)
3. Copie (Ctrl+C)
4. Cole no SQL Editor (Ctrl+V)
5. Clique em **RUN** (ou F5)

**Opção B - Apenas as funções novas:**
Se você já executou o schema antes e só quer as atualizações, copie apenas estas seções:

```sql
-- Linhas 110-163: Função deduct_stock_on_sale() atualizada
-- Linhas 165-214: Nova função calculate_recipe_capacity()
-- Linhas 216-246: Nova view low_stock_ingredients
```

### 6. Verificar se Funcionou

Execute esta query para testar:

```sql
-- Testar se as funções existem
SELECT proname FROM pg_proc 
WHERE proname IN ('deduct_stock_on_sale', 'calculate_recipe_capacity');

-- Testar se a view foi criada
SELECT * FROM low_stock_ingredients LIMIT 1;
```

**Resultado esperado:**
- 2 linhas para as funções ✅
- Dados da view (ou 0 linhas se não houver ingredientes) ✅

---

## 🎯 O Que Isso Faz?

### 1. `deduct_stock_on_sale()`
**Quando:** Toda vez que uma venda é registrada  
**Faz:** 
- Busca a receita do produto vendido
- Calcula quanto de cada ingrediente é necessário
- **VALIDA** se há estoque suficiente
- SE NÃO → Bloqueia a venda com erro
- SE SIM → Deduz os ingredientes automaticamente

### 2. `calculate_recipe_capacity()`
**Quando:** Chamada pelo frontend  
**Faz:**
- Calcula quantas unidades podem ser produzidas
- Identifica qual ingrediente está limitando
- Retorna: capacidade, ingrediente limitante

### 3. `low_stock_ingredients` (View)
**Quando:** Consultada pelo frontend  
**Faz:**
- Lista ingredientes com status de alerta
- Calcula percentual do estoque
- Ordena por criticidade
- Conta receitas afetadas

---

## ⚡ Após Executar

1. **Recarregue o app** em produção
2. **Teste o fluxo:**
   - Adicionar ingrediente
   - Criar receita e vincular ingredientes
   - Ver capacidade calculada (número real!)
   - Tentar vender sem estoque → Deve bloquear ❌
   - Tentar vender com estoque → Deve funcionar ✅

---

## ⚠️ Troubleshooting

### Erro: "syntax error"
**Causa:** Parte do código pode estar incompleta  
**Solução:** Copie o arquivo COMPLETO e execute tudo

### Erro: "already exists"
**Solução:** Isso é normal! Significa que a tabela/função já existe  
**Continuar:** As instruções `CREATE OR REPLACE` vão atualizar

### Nada acontece
**Solução:** 
- Verifique se selecionou o projeto correto
- Certifique que está logado
- Tente executar em partes menores

---

## ✅ Checklist Final

- [ ] Acessou Supabase Dashboard
- [ ] Abriu SQL Editor
- [ ] Copiou schema completo
- [ ] Executou com sucesso (sem erros)
- [ ] Testou as funções
- [ ] App em produção funcionando

**Pronto!** 🎉 O sistema de ingredientes está 100% funcional!
