import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Building2, Users, DollarSign, TrendingUp, Eye, Pause, Play, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { validateAdminClient } from '../../lib/supabase';
import type { Tenant } from '../../contexts/TenantContext';
import CreateTenantModal from './CreateTenantModal';
import './PlatformAdmin.css';

interface TenantWithStats extends Tenant {
    user_count?: number;
    recipe_count?: number;
}

const PlatformAdmin = () => {
    const { profile } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [tenants, setTenants] = useState<TenantWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [stats, setStats] = useState({
        totalTenants: 0,
        activeTenants: 0,
        totalUsers: 0,
        totalRevenue: 0
    });

    useEffect(() => {
        // Security validation
        if (profile?.role !== 'SUPER_ADMIN') {
            console.error('[SECURITY] Non-SUPER_ADMIN attempted platform admin access');
            navigate('/dashboard');
            return;
        }

        if (profile?.tenant_id) {
            console.error('[SECURITY] Platform admin has tenant context');
            toast.error('Erro de segurança detectado');
            navigate('/dashboard');
            return;
        }

        try {
            validateAdminClient();
        } catch (error) {
            console.error('[SECURITY] Admin client not configured');
            toast.error('Cliente admin não configurado');
            return;
        }

        loadTenants();
        loadStats();
    }, [profile, navigate, toast]);

    const loadTenants = async () => {
        setLoading(true);
        try {
            const adminClient = validateAdminClient();

            const { data: tenantsData, error } = await adminClient
                .from('tenants')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const tenantsWithStats = await Promise.all(
                (tenantsData || []).map(async (tenant) => {
                    const { count: userCount } = await adminClient
                        .from('user_profiles')
                        .select('*', { count: 'exact', head: true })
                        .eq('tenant_id', tenant.id);

                    const { count: recipeCount } = await adminClient
                        .from('recipes')
                        .select('*', { count: 'exact', head: true })
                        .eq('tenant_id', tenant.id)
                        .is('deleted_at', null);

                    return {
                        ...tenant,
                        user_count: userCount || 0,
                        recipe_count: recipeCount || 0
                    };
                })
            );

            setTenants(tenantsWithStats);
        } catch (error) {
            console.error('[PlatformAdmin] Error loading tenants:', error);
            toast.error('Erro ao carregar tenants');
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const adminClient = validateAdminClient();

            const { count: totalTenants } = await adminClient
                .from('tenants')
                .select('*', { count: 'exact', head: true });

            const { count: activeTenants } = await adminClient
                .from('tenants')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');

            const { count: totalUsers } = await adminClient
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'ACTIVE');

            setStats({
                totalTenants: totalTenants || 0,
                activeTenants: activeTenants || 0,
                totalUsers: totalUsers || 0,
                totalRevenue: 0
            });
        } catch (error) {
            console.error('[PlatformAdmin] Error loading stats:', error);
            toast.error('Erro ao carregar estatísticas');
        }
    };

    const handleSuspendTenant = async (tenantId: string) => {
        if (!confirm('Suspender este tenant? Todos os usuários perderão acesso.')) return;

        try {
            const { error } = await supabase.rpc('suspend_tenant', {
                p_tenant_id: tenantId,
                p_reason: 'Suspenso pelo administrador da plataforma'
            });

            if (error) throw error;
            toast.success('Tenant suspenso com sucesso');
            loadTenants();
        } catch (error) {
            console.error('[PlatformAdmin] Error suspending tenant:', error);
            toast.error('Erro ao suspender tenant');
        }
    };

    const handleActivateTenant = async (tenantId: string) => {
        try {
            const { error } = await supabase.rpc('activate_tenant', {
                p_tenant_id: tenantId
            });

            if (error) throw error;
            toast.success('Tenant ativado com sucesso');
            loadTenants();
        } catch (error) {
            console.error('[PlatformAdmin] Error activating tenant:', error);
            toast.error('Erro ao ativar tenant');
        }
    };

    const getPlanBadge = (plan: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            free: { label: 'Free', color: '#94a3b8' },
            starter: { label: 'Starter', color: '#10b981' },
            pro: { label: 'Pro', color: '#667eea' },
            enterprise: { label: 'Enterprise', color: '#f59e0b' }
        };
        return badges[plan] || badges.free;
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; color: string }> = {
            active: { label: 'Ativo', color: '#10b981' },
            trial: { label: 'Trial', color: '#f59e0b' },
            suspended: { label: 'Suspenso', color: '#ef4444' }
        };
        return badges[status] || { label: status, color: '#94a3b8' };
    };

    if (profile?.role !== 'SUPER_ADMIN') {
        return (
            <div className="platform-admin">
                <div className="card" style={{ textAlign: 'center', padding: '64px' }}>
                    <h2>🔒 Acesso Negado</h2>
                    <p className="text-muted">Apenas Super Admins podem acessar esta página.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="platform-admin animate-fade-in">
            <header className="platform-header">
                <div>
                    <h1><Building2 size={32} /> Platform Admin</h1>
                    <p className="text-muted">Gerenciamento global de tenants</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    <Plus size={20} />
                    Novo Tenant
                </button>
            </header>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--primary)20', color: 'var(--primary)' }}>
                        <Building2 size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Tenants</span>
                        <span className="stat-value">{stats.totalTenants}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--success)20', color: 'var(--success)' }}>
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Ativos</span>
                        <span className="stat-value">{stats.activeTenants}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--warning)20', color: 'var(--warning)' }}>
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">Total Usuários</span>
                        <span className="stat-value">{stats.totalUsers}</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--info)20', color: 'var(--info)' }}>
                        <DollarSign size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-label">MRR</span>
                        <span className="stat-value">R$ {stats.totalRevenue}</span>
                    </div>
                </div>
            </div>

            {/* Tenants Table */}
            <div className="card">
                <h3 style={{ marginBottom: 'var(--space-lg)' }}>Todos os Tenants</h3>

                {loading ? (
                    <div className="skeleton" style={{ height: '400px' }}></div>
                ) : tenants.length > 0 ? (
                    <div className="tenants-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Tenant</th>
                                    <th>Plano</th>
                                    <th>Status</th>
                                    <th>Usuários</th>
                                    <th>Receitas</th>
                                    <th>Criado</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((tenant) => {
                                    const planBadge = getPlanBadge(tenant.plan);
                                    const statusBadge = getStatusBadge(tenant.status);

                                    return (
                                        <tr key={tenant.id}>
                                            <td>
                                                <div className="tenant-cell">
                                                    {tenant.logo_url && (
                                                        <img
                                                            src={tenant.logo_url}
                                                            alt={tenant.name}
                                                            className="tenant-logo-small"
                                                        />
                                                    )}
                                                    <div>
                                                        <strong>{tenant.name}</strong>
                                                        <span className="tenant-slug">{tenant.slug}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span
                                                    className="badge"
                                                    style={{ background: planBadge.color }}
                                                >
                                                    {planBadge.label}
                                                </span>
                                            </td>
                                            <td>
                                                <span
                                                    className="badge"
                                                    style={{ background: statusBadge.color }}
                                                >
                                                    {statusBadge.label}
                                                </span>
                                            </td>
                                            <td>{tenant.user_count || 0} / {tenant.max_users}</td>
                                            <td>{tenant.recipe_count || 0} / {tenant.max_recipes}</td>
                                            <td>{new Date(tenant.created_at).toLocaleDateString('pt-BR')}</td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-icon"
                                                        title="Ver detalhes"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {tenant.status === 'active' ? (
                                                        <button
                                                            className="btn-icon btn-danger"
                                                            onClick={() => handleSuspendTenant(tenant.id)}
                                                            title="Suspender"
                                                        >
                                                            <Pause size={16} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn-icon btn-success"
                                                            onClick={() => handleActivateTenant(tenant.id)}
                                                            title="Ativar"
                                                        >
                                                            <Play size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-icon"
                                                        title="Configurações"
                                                    >
                                                        <Settings size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '64px' }}>
                        <Building2 size={64} color="var(--text-muted)" />
                        <h3 className="text-muted">Nenhum tenant cadastrado</h3>
                        <p className="text-muted">Clique em "Novo Tenant" para começar</p>
                    </div>
                )}
            </div>

            {/* Create Tenant Modal */}
            {showCreateModal && (
                <CreateTenantModal
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        loadTenants();
                        loadStats();
                    }}
                />
            )}
        </div>
    );
};

export default PlatformAdmin;
