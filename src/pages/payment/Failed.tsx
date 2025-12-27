/**
 * Payment Failed Page
 * © 2025 Marco Antonio de Souza - All rights reserved
 */

import { XCircle, Home, CreditCard, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PaymentFailed() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, var(--bg-darker) 0%, var(--bg-dark) 100%)',
            padding: 'var(--space-lg)'
        }}>
            <div style={{ maxWidth: '600px', textAlign: 'center' }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    margin: '0 auto var(--space-xl)',
                    background: 'rgba(239, 68, 68, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <XCircle size={48} color="var(--danger)" />
                </div>

                <h1 style={{ fontSize: '2.5rem', margin: '0 0 var(--space-md) 0' }}>
                    Pagamento Não Aprovado
                </h1>
                <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
                    Não foi possível processar seu pagamento. Verifique os dados e tente novamente.
                </p>

                <div className="card" style={{ marginBottom: 'var(--space-xl)', textAlign: 'left', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                    <h3 style={{ marginTop: 0, color: 'var(--danger)' }}>Possíveis causas:</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '8px' }}>💳 Saldo insuficiente</li>
                        <li style={{ marginBottom: '8px' }}>🔒 Cartão bloqueado ou expirado</li>
                        <li style={{ marginBottom: '8px' }}>❌ Dados incorretos</li>
                        <li style={{ marginBottom: '8px' }}>🏦 Problema temporário do banco</li>
                    </ul>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate('/pricing')}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                    >
                        <RefreshCw size={18} />
                        Tentar Novamente
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                    >
                        <Home size={18} />
                        Voltar ao Dashboard
                    </button>
                </div>

                <p style={{ marginTop: 'var(--space-xl)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Precisa de ajuda? Entre en contato com nosso suporte: <strong>suporte@estokmax.com</strong>
                </p>
            </div>
        </div>
    );
}
