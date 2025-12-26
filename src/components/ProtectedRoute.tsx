import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, profile, loading, profileLoading } = useAuth();

    // Show loading ONLY while checking session (very fast)
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-dark)'
            }}>
                <div className="animate-pulse" style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        margin: '0 auto var(--space-md)',
                        borderRadius: '50%',

                        borderTopColor: 'var(--primary)',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
                </div>
            </div>
        );
    }

    // If no session/user, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // For admin routes, check profile (show loading if profile still loading)
    if (requireAdmin) {
        if (profileLoading) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-dark)'
                }}>
                    <div className="animate-pulse" style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--text-muted)' }}>Verificando permissões...</p>
                    </div>
                </div>
            );
        }

        if (profile?.role !== 'admin') {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
}
