import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-dark)',
            padding: 'var(--space-lg)'
        }}>
            <div className="card animate-scale-in" style={{ width: '100%', maxWidth: '420px' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
                    <img
                        src="/logo.png"
                        alt="Greg's Pizza"
                        style={{ width: '100px', marginBottom: 'var(--space-lg)' }}
                    />
                    <h2 style={{ margin: 0, fontSize: '1.75rem' }}>Bem-vindo de volta!</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 'var(--space-sm) 0 0' }}>
                        Faça login para acessar o sistema de gestão
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{
                            padding: 'var(--space-md)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid var(--danger)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-lg)',
                            fontSize: '0.875rem',
                            color: 'var(--danger)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)'
                        }}>
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
                        <label>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                pointerEvents: 'none'
                            }} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input"
                                placeholder="seu@email.com"
                                style={{ paddingLeft: '40px' }}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 'var(--space-xl)' }}>
                        <label>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                pointerEvents: 'none'
                            }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input"
                                placeholder="••••••••"
                                style={{ paddingLeft: '40px' }}
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', marginBottom: 'var(--space-lg)' }}
                    >
                        {loading ? (
                            <span className="animate-pulse">Entrando...</span>
                        ) : (
                            <>
                                <LogIn size={18} />
                                Entrar
                            </>
                        )}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                        Não tem uma conta?{' '}
                        <Link
                            to="/signup"
                            style={{
                                color: 'var(--primary)',
                                textDecoration: 'none',
                                fontWeight: 600
                            }}
                        >
                            Cadastre-se
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
