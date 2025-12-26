import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PackagePlus, ShoppingCart, BookOpen, FileText, Users, LogOut, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
    const { profile, signOut, isAdmin } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            // Silently fail - não crítico
        }
    };

    return (
        <aside style={{
            width: '280px',
            background: 'linear-gradient(180deg, var(--bg-darker) 0%, var(--bg-dark) 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            position: 'sticky',
            top: 0
        }}>
            {/* Logo */}
            <div style={{
                padding: 'var(--space-xl)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                <img
                    src="/logo.png"
                    alt="Greg's Pizza"
                    style={{
                        width: '120px',
                        display: 'block',
                        margin: '0 auto'
                    }}
                />
            </div>

            {/* Navigation */}
            <nav style={{
                flex: 1,
                padding: 'var(--space-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-sm)',
                overflowY: 'auto'
            }}>
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
                >
                    <LayoutDashboard size={20} />
                    Dashboard
                </NavLink>

                <NavLink
                    to="/entrada"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
                >
                    <PackagePlus size={20} />
                    Entrada de Estoque
                </NavLink>

                <NavLink
                    to="/saida"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
                >
                    <ShoppingCart size={20} />
                    Registro de Vendas
                </NavLink>

                <NavLink
                    to="/receitas"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
                >
                    <BookOpen size={20} />
                    Receitas
                    {isAdmin && (
                        <span style={{
                            marginLeft: 'auto',
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--gradient-primary)',
                            fontWeight: 600
                        }}>
                            ADMIN
                        </span>
                    )}
                </NavLink>

                <NavLink
                    to="/relatorio"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
                >
                    <FileText size={20} />
                    Relatório Semanal
                </NavLink>

                {isAdmin && (
                    <>
                        <NavLink
                            to="/categories"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
                        >
                            <Tag size={20} />
                            Categorias
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--gradient-primary)',
                                fontWeight: 600
                            }}>
                                ADMIN
                            </span>
                        </NavLink>

                        <NavLink
                            to="/usuarios"
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}
                        >
                            <Users size={20} />
                            Usuários
                            <span style={{
                                marginLeft: 'auto',
                                fontSize: '0.65rem',
                                padding: '2px 6px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'var(--gradient-primary)',
                                fontWeight: 600
                            }}>
                                ADMIN
                            </span>
                        </NavLink>
                    </>
                )}
            </nav>

            {/* User Profile */}
            <div style={{
                padding: 'var(--space-lg)',
                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(0, 0, 0, 0.2)'
            }}>
                {profile && (
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-md)',
                            marginBottom: 'var(--space-sm)'
                        }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                background: 'var(--gradient-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.25rem',
                                fontWeight: 'bold',
                                color: 'white'
                            }}>
                                {profile?.full_name?.charAt(0).toUpperCase() || profile?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {profile.full_name || 'Usuário'}
                                </p>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {profile?.email || 'sem email'}
                                </p>
                            </div>
                        </div>
                        <div style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            background: profile.role === 'admin' ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.1)',
                            color: 'white'
                        }}>
                            {profile.role === 'admin' ? '👑 ADMIN' : '👤 FUNCIONÁRIO'}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="btn btn-secondary"
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-sm)'
                    }}
                >
                    <LogOut size={16} />
                    Sair
                </button>
            </div>
        </aside>
    );
}
