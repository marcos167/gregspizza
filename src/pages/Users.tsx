/**
 * EstokMax - User Management with Complete Invite System
 * 
 * @author Marco Antonio de Souza - https://marcosouza.dev
 * @copyright © 2025 Marco Antonio de Souza. All rights reserved.
 * @license Proprietary - Unauthorized copying or distribution is prohibited.
 * 
 * This code is the intellectual property of Marco Antonio de Souza.
 * Any attempt to copy, modify, or distribute without explicit permission
 * from the author is strictly forbidden and will be prosecuted.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Users as UsersIcon, Shield, User, Mail, Calendar, Trash2, UserPlus, X } from 'lucide-react';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { UpgradeModal } from '../components/UpgradeModal';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'admin' | 'employee';
    created_at: string;
}

export default function Users() {
    const { isAdmin, tenant } = useAuth();
    const toast = useToast();
    const { canAddUser, usage, limits } = usePlanLimits(tenant?.id);

    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [inviteForm, setInviteForm] = useState({
        email: '',
        full_name: '',
        role: 'employee' as 'admin' | 'employee'
    });
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        if (isAdmin) {
            loadUsers();
        }
    }, [isAdmin]);

    const loadUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading users:', error);
            toast.error('Erro ao carregar usuários');
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    };

    const handleToggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'employee' : 'admin';

        const { error } = await supabase
            .from('user_profiles')
            .update({ role: newRole })
            .eq('id', userId);

        if (error) {
            console.error('Error:', error);
            toast.error('Erro ao atualizar permissão');
        } else {
            toast.success(`Permissão atualizada para ${newRole === 'admin' ? 'Administrador' : 'Funcionário'}`);
            loadUsers();
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!confirm(`Tem certeza que deseja deletar o usuário ${email}?`)) {
            return;
        }

        const { error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', userId);

        if (error) {
            console.error('Error:', error);
            toast.error('Erro ao deletar usuário');
        } else {
            toast.success('Usuário deletado com sucesso');
            loadUsers();
        }
    };

    // © Marco Antonio de Souza - User Invite Handler
    const handleInviteClick = () => {
        if (!canAddUser()) {
            setShowUpgradeModal(true);
            return;
        }
        setShowInviteModal(true);
    };

    // © Marco Antonio de Souza - Send Invite
    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inviteForm.email) {
            toast.error('Email é obrigatório');
            return;
        }

        // Double check limit
        if (!canAddUser()) {
            setShowUpgradeModal(true);
            setShowInviteModal(false);
            return;
        }

        setInviting(true);

        try {
            // For now, create a temporary password (user will need to reset)
            const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

            // Create user in auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: inviteForm.email,
                password: tempPassword,
                options: {
                    data: {
                        full_name: inviteForm.full_name || inviteForm.email.split('@')[0]
                    }
                }
            });

            if (authError) throw authError;

            // Create user profile
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    email: inviteForm.email,
                    full_name: inviteForm.full_name || null,
                    role: inviteForm.role
                });

            if (profileError) throw profileError;

            toast.success(`✅ Usuário ${inviteForm.email} adicionado com sucesso!`);
            setShowInviteModal(false);
            setInviteForm({ email: '', full_name: '', role: 'employee' });
            loadUsers();
        } catch (error: any) {
            console.error('Invite error:', error);
            toast.error(error.message || 'Erro ao adicionar usuário');
        } finally {
            setInviting(false);
        }
    };

    if (!isAdmin) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <Shield size={64} color="var(--danger)" style={{ margin: '0 auto var(--space-lg)' }} />
                <h2>Acesso Negado</h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    Apenas administradores podem acessar esta página.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Header - © Marco Antonio de Souza */}
            <div style={{ marginBottom: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <UsersIcon size={32} color="var(--primary)" />
                        <div>
                            <h1 style={{ margin: 0 }}>Gerenciamento de Usuários</h1>
                            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                Gerencie permissões e acesso dos usuários do sistema
                            </p>
                        </div>
                    </div>

                    {/* Invite Button - © Marco Antonio de Souza */}
                    <button
                        onClick={handleInviteClick}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}
                    >
                        <UserPlus size={18} />
                        Convidar Usuário
                    </button>
                </div>
            </div>

            {/* Stats - © Marco Antonio de Souza */}
            <div className="grid grid-3" style={{ marginBottom: 'var(--space-2xl)' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total de Usuários</p>
                            <h2 style={{ margin: '8px 0 0', fontSize: '2rem' }}>
                                {usage?.users || 0}
                                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                    {' '}/ {limits?.max_users === 999999 ? '∞' : limits?.max_users}
                                </span>
                            </h2>
                            {!canAddUser() && (
                                <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--danger)' }}>
                                    ⚠️ Limite atingido
                                </p>
                            )}
                        </div>
                        <UsersIcon size={32} color={canAddUser() ? 'var(--primary)' : 'var(--danger)'} style={{ opacity: 0.5 }} />
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Administradores</p>
                            <h2 style={{ margin: '8px 0 0', fontSize: '2rem' }}>
                                {users.filter(u => u.role === 'admin').length}
                            </h2>
                        </div>
                        <Shield size={32} color="var(--primary)" style={{ opacity: 0.5 }} />
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Funcionários</p>
                            <h2 style={{ margin: '8px 0 0', fontSize: '2rem' }}>
                                {users.filter(u => u.role === 'employee').length}
                            </h2>
                        </div>
                        <User size={32} color="var(--primary)" style={{ opacity: 0.5 }} />
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="card">
                <h3 style={{ marginTop: 0, marginBottom: 'var(--space-lg)' }}>Usuários Cadastrados</h3>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                        <p>Carregando...</p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Email</th>
                                    <th>Função</th>
                                    <th>Criado em</th>
                                    <th style={{ textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <User size={16} color="var(--text-muted)" />
                                                <span style={{ fontWeight: 500 }}>
                                                    {user.full_name || 'Sem nome'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                                                <Mail size={14} color="var(--text-muted)" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: user.role === 'admin' ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.1)',
                                                color: 'white',
                                                display: 'inline-block'
                                            }}>
                                                {user.role === 'admin' ? '👑 Admin' : '👤 Funcionário'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                                <Calendar size={14} />
                                                {new Date(user.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 'var(--space-sm)', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleToggleRole(user.id, user.role)}
                                                    className="btn btn-sm"
                                                    style={{
                                                        background: user.role === 'admin' ? 'rgba(255, 255, 255, 0.1)' : 'var(--gradient-primary)',
                                                        border: 'none'
                                                    }}
                                                    title={user.role === 'admin' ? 'Remover Admin' : 'Promover a Admin'}
                                                >
                                                    <Shield size={14} />
                                                    {user.role === 'admin' ? 'Remover Admin' : 'Tornar Admin'}
                                                </button>

                                                <button
                                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                                    className="btn btn-sm"
                                                    style={{
                                                        background: 'rgba(239, 68, 68, 0.2)',
                                                        border: '1px solid var(--danger)',
                                                        color: 'var(--danger)'
                                                    }}
                                                    title="Deletar Usuário"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Invite Modal - © Marco Antonio de Souza - Inline Style like UpgradeModal */}
            {showInviteModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        padding: 'var(--space-lg)'
                    }}
                    onClick={() => setShowInviteModal(false)}
                >
                    <div
                        style={{
                            background: 'linear-gradient(135deg, var(--bg-dark), var(--bg-darker))',
                            borderRadius: 'var(--radius-lg)',
                            maxWidth: '500px',
                            width: '100%',
                            padding: 'var(--space-2xl)',
                            position: 'relative',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button */}
                        <button
                            onClick={() => setShowInviteModal(false)}
                            style={{
                                position: 'absolute',
                                top: 'var(--space-lg)',
                                right: 'var(--space-lg)',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                        >
                            <X size={18} />
                        </button>

                        {/* Header */}
                        <h2 style={{ margin: '0 0 var(--space-md) 0', fontSize: '1.5rem' }}>
                            <UserPlus size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                            Convidar Novo Usuário
                        </h2>
                        <p style={{ margin: '0 0 var(--space-xl) 0', color: 'var(--text-muted)' }}>
                            Adicione um novo membro à sua equipe
                        </p>

                        {/* Form */}
                        <form onSubmit={handleSendInvite}>
                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                    placeholder="usuario@exemplo.com"
                                    required
                                    disabled={inviting}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-lg)' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    value={inviteForm.full_name}
                                    onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                                    placeholder="Nome do usuário (opcional)"
                                    disabled={inviting}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: 'var(--space-xl)' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>
                                    Função
                                </label>
                                <select
                                    value={inviteForm.role}
                                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'employee' })}
                                    disabled={inviting}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        fontSize: '1rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="employee">👤 Funcionário</option>
                                    <option value="admin">👑 Administrador</option>
                                </select>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="btn btn-secondary"
                                    disabled={inviting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={inviting}
                                    style={{ minWidth: '140px' }}
                                >
                                    {inviting ? 'Enviando...' : 'Enviar Convite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upgrade Modal - © Marco Antonio de Souza */}
            {showUpgradeModal && (
                <UpgradeModal
                    currentPlan={tenant?.plan || 'starter'}
                    feature="adicionar mais usuários"
                    onClose={() => setShowUpgradeModal(false)}
                    onUpgrade={(plan) => {
                        console.log('Upgrade to:', plan);
                        window.location.href = '/billing';
                    }}
                />
            )}
        </div>
    );
}
