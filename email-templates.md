/**
 * EstokMax - Email Notification Templates
 * 
 * @author Marco Antonio de Souza - https://marcosouza.dev
 * @copyright © 2025 Marco Antonio de Souza. All rights reserved.
 * @license Proprietary - Unauthorized copying or distribution is prohibited.
 * 
 * Email templates for trial and payment notifications.
 * These templates should be implemented with a service like Resend, SendGrid, or AWS SES.
 */

# Email Notification Templates - EstokMax

© 2025 Marco Antonio de Souza - All Rights Reserved

---

## 1. Trial Expiring Soon (7 days)

**Subject:** Seu trial expira em 7 dias - Continue usando EstokMax

**Body:**
```
Olá [NOME],

Seu trial do EstokMax expira em **7 dias** (em [DATA_EXPIRACAO]).

Não perca acesso às suas receitas, estoque e relatórios!

**Seu plano atual:** [PLANO]
**Valor:** R$ [PRECO]/mês após trial

[BOTÃO: Adicionar Método de Pagamento]

Caso já tenha adicionado, ignore este email.

---
EstokMax - Gestão inteligente para restaurantes
© Marco Antonio de Souza
```

---

## 2. Trial Expiring Tomorrow (1 day)

**Subject:** ⏰ Último dia de trial - Ação necessária!

**Body:**
```
Olá [NOME],

Seu trial expira AMANHÃ!

Para continuar usando o EstokMax sem interrupções:
1. Adicione um método de pagamento
2. Confirme seu plano: [PLANO] - R$ [PRECO]/mês

[BOTÃO: Adicionar Cartão Agora]

Após o trial:
✅ Acesso completo mantido
✅ Cobrança automática de R$ [PRECO]
✅ Cancelamento a qualquer momento

---
EstokMax - Gestão inteligente para restaurantes
© Marco Antonio de Souza
```

---

## 3. Trial Expired

**Subject:** Seu trial expirou - Reative sua conta

**Body:**
```
Olá [NOME],

Seu trial do EstokMax expirou em [DATA].

Seus dados estão seguros! Para recuperar acesso:

[BOTÃO: Reativar Conta]

**Escolha seu plano:**
- Starter: R$ 49/mês
- Pro: R$ 99/mês
- Business: R$ 199/mês

Seus dados serão mantidos por 30 dias.

---
EstokMax - Gestão inteligente para restaurantes
© Marco Antonio de Souza
```

---

## 4. Payment Successful

**Subject:** ✅ Pagamento confirmado - EstokMax

**Body:**
```
Olá [NOME],

Seu pagamento foi processado com sucesso!

**Detalhes:**
- Plano: [PLANO]
- Valor: R$ [PRECO]
- Próxima cobrança: [PROXIMA_DATA]

[BOTÃO: Ver Comprovante]

Aproveite todas as funcionalidades do EstokMax!

---
EstokMax - Gestão inteligente para restaurantes
© Marco Antonio de Souza
```

---

## 5. Payment Failed

**Subject:** ❌ Falha no pagamento - Ação necessária

**Body:**
```
Olá [NOME],

Não conseguimos processar seu pagamento.

**Possíveis causas:**
- Saldo insuficiente
- Cartão expirado
- Dados incorretos

**Ação necessária:**
Atualize seu método de pagamento em até 3 dias para evitar suspensão.

[BOTÃO: Atualizar Pagamento]

Precisa de ajuda? suporte@estokmax.com

---
EstokMax - Gestão inteligente para restaurantes
© Marco Antonio de Souza
```

---

## 6. Account Suspended (Payment Failed)

**Subject:** Conta suspensa por falta de pagamento

**Body:**
```
Olá [NOME],

Sua conta foi suspensa devido a falha no pagamento.

Para reativar:
1. Atualize seu método de pagamento
2. Pague o valor pendente: R$ [VALOR]

[BOTÃO: Regularizar Pagamento]

Seus dados estão seguros e serão mantidos por 30 dias.

---
EstokMax - Gestão inteligente para restaurantes
© Marco Antonio de Souza
```

---

## 7. Upgrade Successful

**Subject:** 🎉 Upgrade realizado com sucesso!

**Body:**
```
Olá [NOME],

Parabéns! Você fez upgrade para o plano [NOVO_PLANO]!

**Novos limites:**
- Usuários: [MAX_USERS]
- Receitas: [MAX_RECIPES]
- Armazenamento: [STORAGE] GB
- IA: [AI_ACTIONS] ações/dia

**Valor:** R$ [PRECO]/mês
**Próxima cobrança:** [DATA]

[BOTÃO: Ver Novo Plano]

---
EstokMax - Gestão inteligente para restaurantes
© Marco Antonio de Souza
```

---

## 8. Welcome Email (New Signup)

**Subject:** Bem-vindo ao EstokMax! 🎉

**Body:**
```
Olá [NOME],

Seja bem-vindo ao EstokMax!

**Primeiros passos:**
1. ✅ Complete seu perfil
2. ✅ Adicione seus ingredientes
3. ✅ Crie suas primeiras receitas
4. ✅ Convide sua equipe

**Seu trial:**
- Duração: 14 dias
- Plano: [PLANO]
- Expira em: [DATA]

[BOTÃO: Começar Agora]

Precisa de ajuda? Nossa documentação está disponível 24/7.

---
EstokMax - Gestão inteligente para restaurantes
© Marco Antonio de Souza
```

---

## Implementation with Resend (Recommended)

```typescript
// © Marco Antonio de Souza - Email service wrapper
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTrialExpiringEmail(
    email: string,
    name: string,
    daysRemaining: number,
    expirationDate: string,
    plan: string,
    price: number
) {
    await resend.emails.send({
        from: 'EstokMax <noreply@estokmax.com>',
        to: email,
        subject: `Seu trial expira em ${daysRemaining} dias - Continue usando EstokMax`,
        html: `
            <h1>Olá ${name},</h1>
            <p>Seu trial do EstokMax expira em <strong>${daysRemaining} dias</strong> (em ${expirationDate}).</p>
            <p>Não perca acesso às suas receitas, estoque e relatórios!</p>
            <p><strong>Seu plano atual:</strong> ${plan}</p>
            <p><strong>Valor:</strong> R$ ${price}/mês após trial</p>
            <a href="https://app.estokmax.com/billing" style="background: #9B51E0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Adicionar Método de Pagamento
            </a>
            <hr>
            <p style="color: #666; font-size: 12px;">© Marco Antonio de Souza - EstokMax</p>
        `
    });
}

export async function sendPaymentFailedEmail(
    email: string,
    name: string
) {
    await resend.emails.send({
        from: 'EstokMax <noreply@estokmax.com>',
        to: email,
        subject: '❌ Falha no pagamento - Ação necessária',
        html: `
            <h1>Olá ${name},</h1>
            <p>Não conseguimos processar seu pagamento.</p>
            <h3>Possíveis causas:</h3>
            <ul>
                <li>Saldo insuficiente</li>
                <li>Cartão expirado</li>
                <li>Dados incorretos</li>
            </ul>
            <p><strong>Ação necessária:</strong> Atualize seu método de pagamento em até 3 dias.</p>
            <a href="https://app.estokmax.com/billing" style="background: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                Atualizar Pagamento
            </a>
            <hr>
            <p style="color: #666; font-size: 12px;">© Marco Antonio de Souza - EstokMax</p>
        `
    });
}
```

---

## Cron Jobs for Email Automation

```sql
-- © Marco Antonio de Souza - SQL cron jobs for email notifications

-- Daily check for expiring trials (7 days)
CREATE OR REPLACE FUNCTION notify_trial_expiring_7d()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Find trials expiring in 7 days
    -- Send email via pg_net or trigger webhook
    -- Mark as notified to avoid duplicates
END;
$$;

-- Daily check for expiring trials (1 day)
CREATE OR REPLACE FUNCTION notify_trial_expiring_1d()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Find trials expiring tomorrow
    -- Send urgent email
END;
$$;

-- Check for failed payments
CREATE OR REPLACE FUNCTION notify_payment_failed()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Find failed payments in last 24h
    -- Send recovery email
END;
$$;
```

---

**© 2025 Marco Antonio de Souza - All Rights Reserved**  
**Unauthorized copying or distribution is prohibited.**
