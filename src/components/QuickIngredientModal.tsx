import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface QuickIngredientModalProps {
    onClose: () => void;
    onCreated: (ingredient: { id: string; name: string; unit: string; current_stock: number }) => void;
}

const QuickIngredientModal = ({ onClose, onCreated }: QuickIngredientModalProps) => {
    const [formData, setFormData] = useState({
        name: '',
        unit: 'kg',
        current_stock: '',
        min_stock: '',
        category: 'Massas',
        cost_per_unit: '0',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data, error } = await supabase
                .from('ingredients')
                .insert({
                    name: formData.name,
                    unit: formData.unit,
                    current_stock: formData.current_stock ? parseFloat(formData.current_stock) : 0,
                    min_stock: formData.min_stock ? parseFloat(formData.min_stock) : 0,
                    category: formData.category,
                    cost_per_unit: parseFloat(formData.cost_per_unit),
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                onCreated({
                    id: data.id,
                    name: data.name,
                    unit: data.unit,
                    current_stock: data.current_stock || 0,
                });
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Erro ao criar ingrediente');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div className="card" style={{
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh',
                overflow: 'auto',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
                    <h3 style={{ margin: 0 }}>Criar Ingrediente Rápido</h3>
                    <button
                        onClick={onClose}
                        className="btn btn-outline"
                        style={{ padding: '8px' }}
                        type="button"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                        <label>Nome do Ingrediente</label>
                        <input
                            className="input"
                            type="text"
                            placeholder="Ex: Azeitonas"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-2">
                        <div className="form-group">
                            <label>Unidade de Medida</label>
                            <select
                                className="select"
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            >
                                <optgroup label="Peso">
                                    <option value="kg">kg - Quilograma</option>
                                    <option value="g">g - Grama</option>
                                </optgroup>
                                <optgroup label="Volume">
                                    <option value="L">L - Litro</option>
                                    <option value="ml">ml - Mililitro</option>
                                </optgroup>
                                <optgroup label="Outros">
                                    <option value="un">un - Unidade</option>
                                </optgroup>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Estoque Inicial</label>
                            <input
                                className="input"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.current_stock}
                                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                            />
                            <small className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                                Pode deixar em zero e adicionar depois
                            </small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Estoque Mínimo</label>
                        <input
                            className="input"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={formData.min_stock}
                            onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                        />
                        <small className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                            Nível de alerta para reposição
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Categoria (opcional)</label>
                        <select
                            className="select"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Massas">Massas</option>
                            <option value="Queijos">Queijos</option>
                            <option value="Carnes">Carnes</option>
                            <option value="Vegetais">Vegetais</option>
                            <option value="Molhos">Molhos</option>
                            <option value="Temperos">Temperos</option>
                        </select>
                    </div>

                    <div className="flex gap-md" style={{ marginTop: 'var(--space-md)' }}>
                        <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-success" disabled={saving} style={{ flex: 1 }}>
                            <Plus size={18} />
                            {saving ? 'Criando...' : 'Criar e Usar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickIngredientModal;
