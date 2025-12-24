import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function Signup() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setLoading(true);

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
        }

        try {
            await signUp(email, password, fullName);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta. Tente novamente.');
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
                    <h2 style={{ margin: 0, fontSize: '1.75rem' }}>Criar Conta</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 'var(--space-sm) 0 0' }}>
                        Cadastre-se para acessar o sistema
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

                    {success && (
                        <div style={{
                            padding: 'var(--space-md)',
                            background: 'rgba(0, 217, 160, 0.1)',
                            border: '1px solid var(--success)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--space-lg)',
                            fontSize: '0.875rem',
                            color: 'var(--success)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-sm)'
                        }}>
                            <CheckCircle size={18} />
                            Conta criada com sucesso! Redirecionando...
                        </div>
                    )}

                    <div className="form-group" style={{ marginBottom: 'var(--space-lg)' }}>
                        <label>Nome Completo</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-muted)',
                                pointerEvents: 'none'
                            }} />
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                className="input"
                                placeholder="Seu nome"
                                style={{ paddingLeft: '40px' }}
                                autoComplete="name"
                            />
                        </div>
                    </div>

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
                                placeholder="Mínimo 6 caracteres"
                                style={{ paddingLeft: '40px' }}
                                autoComplete="new-password"
                                minLength={6}
                            />
                        </div>
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 'var(--space-xs)', display: 'block' }}>
                            A senha deve ter pelo menos 6 caracteres
                        </small>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || success}
                        className="btn btn-primary"
                        style={{ width: '100%', marginBottom: 'var(--space-lg)' }}
                    >
                        {loading ? (
                            <span className="animate-pulse">Criando conta...</span>
                        ) : success ? (
                            'Conta criada!'
                        ) : (
                            <>
                                <UserPlus size={18} />
                                Criar Conta
                            </>
                        )}
                    </button>

                    <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0 }}>
                        Já tem uma conta?{' '}
                        <Link
                            to="/login"
                            style={{
                                color: 'var(--primary)',
                                textDecoration: 'none',
                                fontWeight: 600
                            }}
                        >
                            Fazer login
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
