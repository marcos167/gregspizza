/**
 * Payment Success Page
 * © 2025 Marco Antonio de Souza - All rights reserved
 */

import { CheckCircle, Home, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PaymentSuccess() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            align Items: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, var(--bg-darker) 0%, var(--bg-dark) 100%)',
            padding: 'var(--space-lg)'
        }}>
            <div style={{ maxWidth: '600px', textAlign: 'center' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto var(--space-xl)',
                    background: 'rgba(16, 185, 129, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <CheckCircle size={48} color="var(--success)" />
                </div>

                <h1 style={{ fontSize: '2.5rem', margin: '0 0 var(--space-md) 0' }}>
                    Pagamento Confirmado!
                </h1>
                <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
                    Seu pagamento foi processado com sucesso. Bem-vindo ao EstokMax!
                </p>

                <div className="card" style={{ marginBottom: 'var(--space-xl)', textAlign: 'left' }}>
                    <h3 style={{ marginTop: 0 }}>Próximos Passos:</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '8px' }}>✅ Sua assinatura está ativa</li>
                        <li style={{ marginBottom: '8px' }}>✅ Acesso completo às funcionalidades</li>
                        <li style={{ marginBottom: '8px' }}>✅ Suporte técnico disponível</li>
                    </ul>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                    >
                        <Home size={18} />
                        Ir para Dashboard
                    </button>
                    <button
                        onClick={() => navigate('/billing')}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                    >
                        <CreditCard size={18} />
                        Ver Plano
                    </button>
                </div>
            </div>
        </div>
    );
}
