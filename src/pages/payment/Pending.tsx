/**
 * Payment Pending Page
 * © 2025 Marco Antonio de Souza - All rights reserved
 */

import { Clock, Home, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PaymentPending() {
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
                    background: 'rgba(245, 158, 11, 0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Clock size={48} color="var(--warning)" />
                </div>

                <h1 style={{ fontSize: '2.5rem', margin: '0 0 var(--space-md) 0' }}>
                    Pagamento Pendente
                </h1>
                <p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', marginBottom: 'var(--space-2xl)' }}>
                    Seu pagamento está sendo processado. Isso pode levar alguns minutos.
                </p>

                <div className="card" style={{ marginBottom: 'var(--space-xl)', textAlign: 'left' }}>
                    <h3 style={{ marginTop: 0 }}>O que acontece agora?</h3>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '8px' }}>⏳ Aguardando confirmação do pagamento</li>
                        <li style={{ marginBottom: '8px' }}>📧 Você receberá um email quando confirmar</li>
                        <li style={{ marginBottom: '8px' }}>🔄 Pode levar até 24 horas</li>
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
                        onClick={() => window.location.reload()}
                        className="btn btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                    >
                        <RefreshCw size={18} />
                        Atualizar Status
                    </button>
                </div>
            </div>
        </div>
    );
}
