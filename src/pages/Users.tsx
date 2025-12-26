import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Users as UsersIcon, Shield, User, Mail, Calendar, Trash2 } from 'lucide-react';

interface UserProfile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'admin' | 'employee';
    created_at: string;
}

const Users = () => {
    const { isAdmin } = useAuth();
    const toast = useToast();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

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

        if (data) {
            setUsers(data);
        }
        if (error) {
            console.error('Erro ao carregar usuários:', error);
            toast.error('Erro ao carregar usuários.');
        }
        setLoading(false);
    };

    const handleToggleRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'employee' : 'admin';

        if (!confirm(`Tem certeza que deseja ${currentRole === 'admin' ? 'remover privilégios de' : 'promover a'} admin este usuário?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) {
                throw error;
            }

            toast.success('Cargo atualizado com sucesso!');
            loadUsers();
        } catch (error: any) {
            console.error('Error updating role:', error);
            toast.error('Erro ao atualizar cargo do usuário');
        }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
        if (!confirm(`Tem certeza que deseja DELETAR o usuário ${email}? Esta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('user_profiles')
                .delete()
                .eq('id', userId);

            if (error) {
                throw error;
            }

            toast.success('Usuário deletado com sucesso!');
            loadUsers();
        } catch (error: any) {
            console.error('Error deleting user:', error);
            toast.error('Erro ao deletar usuário');
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
            {/* Header */}
            <div style={{ marginBottom: 'var(--space-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <UsersIcon size={32} color="var(--primary)" />
                    <div>
                        <h1 style={{ margin: 0 }}>Gerenciamento de Usuários</h1>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Gerencie permissões e acesso dos usuários do sistema
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid" style={{ marginBottom: 'var(--space-2xl)' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total de Usuários</p>
                            <h2 style={{ margin: '8px 0 0', fontSize: '2rem' }}>{users.length}</h2>
                        </div>
                        <UsersIcon size={32} color="var(--primary)" style={{ opacity: 0.5 }} />
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

            {/* Users List */}
            <div className="card">
                <h3 style={{ marginTop: 0 }}>Lista de Usuários</h3>

                {loading ? (
                    <p style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                        Carregando usuários...
                    </p>
                ) : users.length === 0 ? (
                    <p style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                        Nenhum usuário cadastrado
                    </p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Email</th>
                                    <th>Cargo</th>
                                    <th>Cadastro</th>
                                    <th style={{ textAlign: 'center' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, index) => (
                                    <tr key={user.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-slide-up">
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                                <div style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '50%',
                                                    background: 'var(--gradient-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 'bold',
                                                    color: 'white'
                                                }}>
                                                    {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                                </div>
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
        </div>
    );
}
