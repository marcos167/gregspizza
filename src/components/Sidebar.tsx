import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, ChefHat, FileText } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/entrada', label: 'Entrada de Estoque', icon: Package },
        { path: '/saida', label: 'Registrar Vendas', icon: ShoppingCart },
        { path: '/receitas', label: 'Receitas', icon: ChefHat },
        { path: '/relatorio', label: 'Relatório Semanal', icon: FileText },
    ];

    return (
        <aside style={{
            width: '280px',
            background: 'var(--bg-card)',
            borderRight: '1px solid var(--border)',
            padding: 'var(--space-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-xl)',
        }}>
            {/* Logo */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                paddingBottom: 'var(--space-lg)',
                borderBottom: '1px solid var(--border)',
            }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                }}>
                    <img src="/logo.png" alt="Greg's Pizza" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div>
                    <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Greg's Pizza</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Sistema Inteligente</p>
                </div>
            </div>

            {/* Navigation */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-md)',
                                padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                textDecoration: 'none',
                                color: isActive ? 'white' : 'var(--text-muted)',
                                background: isActive ? 'var(--primary)' : 'transparent',
                                transition: 'all var(--transition-base)',
                                fontWeight: isActive ? 600 : 400,
                            }}
                            onMouseEnter={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                                    e.currentTarget.style.color = 'var(--text)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = 'var(--text-muted)';
                                }
                            }}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div style={{
                marginTop: 'auto',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(230, 57, 70, 0.1)',
                border: '1px solid var(--primary)',
            }}>
                <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-muted)' }}>
                    🤖 <strong style={{ color: 'var(--primary)' }}>AI Ativa</strong>
                </p>
                <p style={{ fontSize: '0.7rem', margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
                    Analisando seus dados...
                </p>
            </div>
        </aside>
    );
};

export default Sidebar;
