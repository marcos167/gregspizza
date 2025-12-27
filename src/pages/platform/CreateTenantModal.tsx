import { useState } from 'react';
import { X, Building2, Mail, Globe } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import './CreateTenantModal.css';

interface CreateTenantModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const CreateTenantModal = ({ onClose, onSuccess }: CreateTenantModalProps) => {
    const toast = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        owner_email: '',
        plan: 'free' as 'free' | 'starter' | 'pro' | 'enterprise',
        primary_color: '#667eea',
        secondary_color: '#764ba2'
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Auto-generate slug from name
        if (field === 'name') {
            const slug = value
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
                .replace(/\s+/g, '-') // Spaces to hyphens
                .replace(/-+/g, '-') // Multiple hyphens to single
                .replace(/^-|-$/g, ''); // Trim hyphens
            setFormData(prev => ({ ...prev, slug }));
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Call enhanced auto-provisioning function
            const { error } = await supabase.rpc('create_tenant_complete', {
                p_slug: formData.slug,
                p_name: formData.name,
                p_owner_email: formData.owner_email,
                p_plan: formData.plan,
                p_subdomain: formData.slug, // Use slug as subdomain for now
                p_primary_color: formData.primary_color,
                p_secondary_color: formData.secondary_color
            });

            if (error) throw error;

            toast.success(`Tenant "${formData.name}" criado com sucesso! Auto-provisioning completo.`);
            onSuccess();
        } catch (error: any) {
            console.error('[CreateTenantModal] Error:', error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const plans = [
        {
            id: 'free',
            name: 'Free',
            price: 'R$ 0',
            features: ['3 usuários', '20 receitas', '500MB storage', '10 ações IA/dia'],
            color: '#94a3b8'
        },
        {
            id: 'starter',
            name: 'Starter',
            price: 'R$ 79',
            features: ['10 usuários', '100 receitas', '2GB storage', '100 ações IA/dia'],
            color: '#10b981'
        },
        {
            id: 'pro',
            name: 'Pro',
            price: 'R$ 199',
            features: ['30 usuários', 'Receitas ilimitadas', '10GB storage', 'IA ilimitada'],
            color: '#667eea'
        },
        {
            id: 'enterprise',
            name: 'Enterprise',
            price: 'Custom',
            features: ['Usuários ilimitados', 'Receitas ilimitadas', '50GB+ storage', 'White-label completo'],
            color: '#f59e0b'
        }
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content create-tenant-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2><Building2 size={24} /> Criar Novo Tenant</h2>
                        <p className="text-muted">Passo {step} de 3</p>
                    </div>
                    <button className="btn-icon" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {/* Step 1: Basic Info */}
                    {step === 1 && (
                        <div className="step-content animate-fade-in">
                            <h3>Informações Básicas</h3>
                            <div className="form-group">
                                <label>Nome do Tenant *</label>
                                <div className="input-icon">
                                    <Building2 size={20} />
                                    <input
                                        type="text"
                                        placeholder="Tony's Pizza"
                                        value={formData.name}
                                        onChange={(e) => handleChange('name', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Slug (URL) *</label>
                                <div className="input-icon">
                                    <Globe size={20} />
                                    <input
                                        type="text"
                                        placeholder="tonys-pizza"
                                        value={formData.slug}
                                        onChange={(e) => handleChange('slug', e.target.value)}
                                    />
                                </div>
                                <span className="input-hint">
                                    URL: {window.location.origin}/{formData.slug || 'slug'}
                                </span>
                            </div>

                            <div className="form-group">
                                <label>Email do Proprietário *</label>
                                <div className="input-icon">
                                    <Mail size={20} />
                                    <input
                                        type="email"
                                        placeholder="tony@tonys.com"
                                        value={formData.owner_email}
                                        onChange={(e) => handleChange('owner_email', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Plan Selection */}
                    {step === 2 && (
                        <div className="step-content animate-fade-in">
                            <h3>Escolha o Plano</h3>
                            <div className="plans-grid">
                                {plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        className={`plan-card ${formData.plan === plan.id ? 'selected' : ''}`}
                                        onClick={() => handleChange('plan', plan.id)}
                                        style={{
                                            borderColor: formData.plan === plan.id ? plan.color : 'var(--border)'
                                        }}
                                    >
                                        <div className="plan-header">
                                            <h4>{plan.name}</h4>
                                            <span
                                                className="plan-price"
                                                style={{ color: plan.color }}
                                            >
                                                {plan.price}
                                            </span>
                                        </div>
                                        <ul className="plan-features">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx}>✓ {feature}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Branding */}
                    {step === 3 && (
                        <div className="step-content animate-fade-in">
                            <h3>Personalização (Opcional)</h3>
                            <div className="branding-grid">
                                <div className="form-group">
                                    <label>Cor Primária</label>
                                    <div className="color-picker">
                                        <input
                                            type="color"
                                            value={formData.primary_color}
                                            onChange={(e) => handleChange('primary_color', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={formData.primary_color}
                                            onChange={(e) => handleChange('primary_color', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Cor Secundária</label>
                                    <div className="color-picker">
                                        <input
                                            type="color"
                                            value={formData.secondary_color}
                                            onChange={(e) => handleChange('secondary_color', e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            value={formData.secondary_color}
                                            onChange={(e) => handleChange('secondary_color', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div
                                className="branding-preview"
                                style={{
                                    background: `linear-gradient(135deg, ${formData.primary_color} 0%, ${formData.secondary_color} 100%)`
                                }}
                            >
                                <h4 style={{ color: 'white' }}>{formData.name || 'Preview'}</h4>
                                <p style={{ color: 'rgba(255,255,255,0.8)' }}>
                                    Cores personalizadas aplicadas
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {step > 1 && (
                        <button
                            className="btn btn-outline"
                            onClick={() => setStep(step - 1)}
                            disabled={loading}
                        >
                            Voltar
                        </button>
                    )}
                    <div style={{ flex: 1 }}></div>
                    {step < 3 ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => setStep(step + 1)}
                            disabled={!formData.name || !formData.slug || !formData.owner_email}
                        >
                            Próximo
                        </button>
                    ) : (
                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Criando...' : 'Criar Tenant'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateTenantModal;
