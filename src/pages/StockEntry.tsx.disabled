import { useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { supabase, type Ingredient } from '../lib/supabase';
// import QuickIngredientModal from '../components/QuickIngredientModal';

const StockEntry = () => {
    const [formData, setFormData] = useState({
        ingredient_id: '',
        quantity: '',
        supplier: '',
        unit_cost: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const toast = useToast();

    // Placeholder for loadIngredients, assuming it will be defined elsewhere or added later
    // For now, it's an empty function to avoid errors.
    const loadIngredients = () => {
        console.log("loadIngredients called (placeholder)");
        // In a real scenario, this would fetch and update the list of ingredients
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const { error } = await supabase
                .from('stock_entries')
                .insert({
                    ingredient_id: formData.ingredient_id,
                    quantity: parseFloat(formData.quantity),
                    cost: parseFloat(formData.unit_cost), // Assuming 'cost' column in DB stores unit_cost
                    supplier: formData.supplier,
                });
            if (error) throw error;

            toast.success('Entrada registrada com sucesso!');

            // Reset form
            setFormData({
                ingredient_id: '',
                quantity: '',
                supplier: '',
                unit_cost: '',
            });

            // Reload ingredients to update current stock
            loadIngredients();
        } catch (error: any) {
            console.error('Error:', error);
            toast.error('Erro ao registrar entrada');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: 'var(--space-xl)' }}>
                <h1 style={{ marginBottom: 'var(--space-sm)' }}>Entrada de Estoque</h1>
                <p className="text-muted">Registre compras e atualize o inventário</p>
            </header>

            <div className="grid grid-2">
                {/* Form */}
                <div className="card">
                    <div className="flex items-center gap-md" style={{ marginBottom: 'var(--space-lg)' }}>
                        <Package size={24} color="var(--primary)" />
                        <h3 style={{ margin: 0 }}>Nova Entrada</h3>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div className="form-group">
                            <label>Nome do Ingrediente</label>
                            <input
                                className="input"
                                type="text"
                                placeholder="Ex: Queijo Mussarela"
                                value={formData.ingredient_name}
                                onChange={(e) => setFormData({ ...formData, ingredient_name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label>Quantidade</label>
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    placeholder="10.5"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Unidade</label>
                                <select
                                    className="select"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                >
                                    <option value="kg">kg</option>
                                    <option value="litros">litros</option>
                                    <option value="unidades">unidades</option>
                                    <option value="gramas">gramas</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Categoria</label>
                            <select
                                className="select"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                required
                            >
                                <option value="">Selecione...</option>
                                <option value="massa">Massa</option>
                                <option value="queijo">Queijos</option>
                                <option value="carnes">Carnes</option>
                                <option value="vegetais">Vegetais</option>
                                <option value="molhos">Molhos</option>
                                <option value="temperos">Temperos</option>
                            </select>
                        </div>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label>Custo Total</label>
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    placeholder="R$ 150.00"
                                    value={formData.cost}
                                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Custo por Unidade</label>
                                <input
                                    className="input"
                                    type="number"
                                    step="0.01"
                                    placeholder="R$ 15.00"
                                    value={formData.cost_per_unit}
                                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Fornecedor</label>
                            <input
                                className="input"
                                type="text"
                                placeholder="Nome do fornecedor"
                                value={formData.supplier}
                                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Estoque Mínimo</label>
                            <input
                                className="input"
                                type="number"
                                step="0.01"
                                placeholder="5.0"
                                value={formData.min_stock}
                                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                                required
                            />
                            <small className="text-muted">Quantidade mínima antes de alertar</small>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                            style={{ marginTop: 'var(--space-md)' }}
                        >
                            <Plus size={20} />
                            {submitting ? 'Registrando...' : 'Registrar Entrada'}
                        </button>
                    </form>
                </div>

                {/* Instructions */}
                <div className="card card-glass">
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>Como funciona?</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <div>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 'var(--space-sm)',
                                fontWeight: 'bold',
                            }}>1</div>
                            <h4 style={{ marginBottom: 'var(--space-xs)' }}>Preencha os dados</h4>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                                Informe o nome do ingrediente, quantidade comprada e custo
                            </p>
                        </div>

                        <div>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 'var(--space-sm)',
                                fontWeight: 'bold',
                            }}>2</div>
                            <h4 style={{ marginBottom: 'var(--space-xs)' }}>Estoque atualizado</h4>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                                O sistema calcula automaticamente a capacidade de produção
                            </p>
                        </div>

                        <div>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: 'var(--primary)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 'var(--space-sm)',
                                fontWeight: 'bold',
                            }}>3</div>
                            <h4 style={{ marginBottom: 'var(--space-xs)' }}>IA analisa</h4>
                            <p className="text-muted" style={{ fontSize: '0.875rem' }}>
                                A inteligência artificial identifica padrões e sugere otimizações
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockEntry;
