import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SalesEntry = () => {
    const [formData, setFormData] = useState({
        product_type: 'pizza' as 'pizza' | 'esfiha',
        product_name: '',
        quantity: '',
        revenue: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await supabase
                .from('stock_exits')
                .insert({
                    product_type: formData.product_type,
                    product_name: formData.product_name,
                    quantity: parseInt(formData.quantity),
                    revenue: parseFloat(formData.revenue),
                });

            alert('✅ Venda registrada com sucesso!');

            // Reset form
            setFormData({
                product_type: 'pizza',
                product_name: '',
                quantity: '',
                revenue: '',
            });
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Erro ao registrar venda');
        } finally {
            setSubmitting(false);
        }
    };

    const pizzaOptions = [
        'Margherita',
        'Calabresa',
        'Portuguesa',
        'Frango com Catupiry',
        'Quatro Queijos',
        'Pepperoni',
    ];

    const esfihaOptions = [
        'Carne',
        'Frango',
        'Queijo',
        'Pizza',
        'Escarola',
    ];

    const options = formData.product_type === 'pizza' ? pizzaOptions : esfihaOptions;

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ marginBottom: 'var(--space-sm)' }}>Registrar Vendas</h1>
                <p className="text-muted">Registre as vendas e o estoque será atualizado automaticamente</p>
            </header>

            <div className="grid grid-2">
                {/* Form */}
                <div className="card">
                    <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
                        <ShoppingCart size={24} color="var(--success)" />
                        <h3 style={{ margin: 0 }}>Nova Venda</h3>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div className="form-group">
                            <label>Tipo de Produto</label>
                            <select
                                className="select"
                                value={formData.product_type}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    product_type: e.target.value as 'pizza' | 'esfiha',
                                    product_name: '',
                                })}
                            >
                                <option value="pizza">🍕 Pizza</option>
                                <option value="esfiha">🥟 Esfiha</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Produto</label>
                            <select
                                className="select"
                                value={formData.product_name}
                                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                                required
                            >
                                <option value="">Selecione...</option>
                                {options.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label>Quantidade</label>
                                <input
                                    className="input"
                                    type="number"
                                    min="1"
                                    placeholder="5"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Valor Total</label>
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    placeholder="R$ 150.00"
                                    value={formData.revenue}
                                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-success"
                            disabled={submitting}
                            style={{ marginTop: 'var(--space-md)' }}
                        >
                            <ShoppingCart size={20} />
                            {submitting ? 'Registrando...' : 'Registrar Venda'}
                        </button>
                    </form>
                </div>

                {/* Quick Stats */}
                <div>
                    <div className="card" style={{ marginBottom: 'var(--space-md)' }}>
                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Vendas do Dia</h4>
                        <div className="grid grid-2" style={{ gap: 'var(--space-md)' }}>
                            <div>
                                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Pizzas</p>
                                <h2 style={{ color: 'var(--primary)', margin: 0 }}>24</h2>
                            </div>
                            <div>
                                <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>Esfihas</p>
                                <h2 style={{ color: 'var(--warning)', margin: 0 }}>67</h2>
                            </div>
                        </div>
                    </div>

                    <div className="card card-glass">
                        <h4 style={{ marginBottom: 'var(--space-md)' }}>Dedução Automática</h4>
                        <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                            Ao registrar uma venda, o sistema:
                        </p>
                        <ul style={{
                            marginTop: 'var(--space-md)',
                            paddingLeft: 'var(--space-lg)',
                            fontSize: '0.875rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-sm)',
                        }}>
                            <li>✅ Deduz ingredientes automaticamente</li>
                            <li>✅ Atualiza capacidade de produção</li>
                            <li>✅ Gera alertas se estoque baixo</li>
                            <li>✅ Alimenta a IA com dados</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesEntry;
