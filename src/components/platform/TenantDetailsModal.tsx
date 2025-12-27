import React from 'react';
import { X, Building2, Users, Package, Calendar, DollarSign, Globe, Settings as SettingsIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';

interface TenantDetailsModalProps {
    tenant: any;
    onClose: () => void;
    onUpdate: () => void;
}

export const TenantDetailsModal: React.FC<TenantDetailsModalProps> = ({ tenant, onClose, onUpdate }) => {
    const toast = useToast();
    const [loading, setLoading] = React.useState(false);
    const [selectedPlan, setSelectedPlan] = React.useState(tenant.plan);
    const [plans, setPlans] = React.useState<any[]>([]);

    React.useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        if (!error && data) {
            setPlans(data);
        }
    };

    const handleChangePlan = async () => {
        if (selectedPlan === tenant.plan) {
            toast.error('Selecione um plano diferente');
            return;
        }

        if (!confirm(`Alterar plano de ${tenant.plan} para ${selectedPlan}?`)) {
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.rpc('change_tenant_plan', {
                p_tenant_id: tenant.id,
                p_new_plan: selectedPlan,
                p_reason: 'Alteração via Platform Admin'
            });

            if (error) throw error;

            toast.success('Plano alterado com sucesso!');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Error changing plan:', error);
            toast.error('Erro ao alterar plano');
        } finally {
            setLoading(false);
        }
    };

    const handleImpersonate = async () => {
        const reason = prompt('Motivo da impersonação (obrigatório):');
        if (!reason || reason.trim() === '') {
            toast.error('Motivo é obrigatório');
            return;
        }

        setLoading(true);
        try {
            const { data: sessionId, error } = await supabase.rpc('start_impersonation', {
                p_tenant_id: tenant.id,
                p_reason: reason
            });

            if (error) throw error;

            toast.success(`Impersonation iniciada! Sessão: ${sessionId}`);
            // TODO: Implement actual impersonation redirect
            window.open(`/dashboard?impersonate=${sessionId}`, '_blank');
        } catch (error: any) {
            console.error('Error starting impersonation:', error);
            toast.error(error.message || 'Erro ao iniciar impersonação');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (cents: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(cents / 100);
    };

    const currentPlan = plans.find(p => p.name === tenant.plan);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2>{tenant.name}</h2>
                        <p className="text-muted">{tenant.slug}</p>
                    </div>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Stats Grid */}
                    <div className="stats-grid" style={{ marginBottom: '2rem' }}>
                        <div className="stat-card-sm">
                            <Users size={20} />
                            <div>
                                <span className="stat-label">Usuários</span>
                                <strong>{tenant.user_count || 0}</strong>
                            </div>
                        </div>
                        <div className="stat-card-sm">
                            <Package size={20} />
                            <div>
                                <span className="stat-label">Receitas</span>
                                <strong>{tenant.recipe_count || 0}</strong>
                            </div>
                        </div>
                        <div className="stat-card-sm">
                            <Calendar size={20} />
                            <div>
                                <span className="stat-label">Criado</span>
                                <strong>{new Date(tenant.created_at).toLocaleDateString('pt-BR')}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Plan Management */}
                    <div className="form-section">
                        <h3>Gerenciar Plano</h3>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Plano Atual</label>
                                <div style={{
                                    padding: '12px',
                                    background: 'var(--background-secondary)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <DollarSign size={18} />
                                    <div>
                                        <strong>{currentPlan?.display_name || tenant.plan}</strong>
                                        <p className="text-muted" style={{ margin: 0, fontSize: '12px' }}>
                                            {currentPlan?.price_monthly ? formatCurrency(currentPlan.price_monthly) + '/mês' : 'Gratuito'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Alterar Para</label>
                                <select
                                    className="input"
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                    disabled={loading}
                                >
                                    {plans.map(plan => (
                                        <option key={plan.name} value={plan.name}>
                                            {plan.display_name} - {plan.price_monthly ? formatCurrency(plan.price_monthly) : 'Gratuito'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {selectedPlan !== tenant.plan && (
                            <button
                                className="btn btn-warning"
                                onClick={handleChangePlan}
                                disabled={loading}
                            >
                                <SettingsIcon size={18} />
                                Confirmar Mudança de Plano
                            </button>
                        )}
                    </div>

                    {/* Tenant Info */}
                    <div className="form-section">
                        <h3>Informações</h3>
                        <div className="info-grid">
                            <div className="info-item">
                                <Globe size={16} />
                                <div>
                                    <span className="label">Domínio</span>
                                    <span>{tenant.custom_domain || `${tenant.slug}.estokmax.com`}</span>
                                </div>
                            </div>
                            <div className="info-item">
                                <Building2 size={16} />
                                <div>
                                    <span className="label">Status</span>
                                    <span className={`badge badge-${tenant.status === 'active' ? 'success' : 'warning'}`}>
                                        {tenant.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="form-section">
                        <h3>Ações Administrativas</h3>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={handleImpersonate}
                                disabled={loading || tenant.status === 'suspended'}
                            >
                                <Users size={18} />
                                Impersonar Tenant (2h)
                            </button>
                            <button
                                className="btn btn-secondary"
                                disabled={loading}
                            >
                                <Package size={18} />
                                Ver Audit Logs
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
