import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    created_at?: string;
}

const Categories = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        icon: '📦',
        color: '#FFB74D',
    });

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('categories')
            .select('*')
            .order('name');

        if (data) {
            setCategories(data);
        }
        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingCategory) {
                // Update
                const { error } = await supabase
                    .from('categories')
                    .update({
                        name: formData.name,
                        icon: formData.icon,
                        color: formData.color,
                    })
                    .eq('id', editingCategory.id);

                if (error) throw error;
                alert('✅ Categoria atualizada!');
            } else {
                // Create
                const { error } = await supabase
                    .from('categories')
                    .insert({
                        name: formData.name,
                        icon: formData.icon,
                        color: formData.color,
                    });

                if (error) throw error;
                alert('✅ Categoria criada!');
            }

            setShowForm(false);
            setEditingCategory(null);
            setFormData({ name: '', icon: '📦', color: '#FFB74D' });
            loadCategories();
        } catch (error: any) {
            console.error('Error:', error);
            alert(error.message || '❌ Erro ao salvar categoria');
        }
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            icon: category.icon,
            color: category.color,
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir a categoria "${name}"?`)) {
            return;
        }

        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            alert('✅ Categoria excluída!');
            loadCategories();
        } catch (error: any) {
            console.error('Error:', error);
            alert(error.message || '❌ Erro ao excluir categoria');
        }
    };

    const commonEmojis = ['🍞', '🧀', '🥩', '🥬', '🍅', '🧂', '🍕', '🥟', '🌶️', '🥑', '🍄', '🧄', '🫒', '🥕', '🧅', '📦', '🏷️'];
    const commonColors = ['#FFB74D', '#FDD835', '#E57373', '#81C784', '#FF7043', '#A1887F', '#64B5F6', '#BA68C8', '#4DD0E1'];

    return (
        <div className="animate-fade-in">
            <header style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--space-sm)' }}>Categorias</h1>
                    <p className="text-muted">Gerencie as categorias de ingredientes</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => {
                        setShowForm(!showForm);
                        setEditingCategory(null);
                        setFormData({ name: '', icon: '📦', color: '#FFB74D' });
                    }}
                >
                    <Plus size={20} />
                    Nova Categoria
                </button>
            </header>

            {showForm && (
                <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)' }}>
                        {editingCategory ? 'Editar Categoria' : 'Criar Nova Categoria'}
                    </h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div className="form-group">
                            <label>Nome da Categoria</label>
                            <input
                                className="input"
                                type="text"
                                placeholder="Ex: Laticínios"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-2">
                            <div className="form-group">
                                <label>Ícone (Emoji)</label>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                    <input
                                        className="input"
                                        type="text"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        maxLength={2}
                                        style={{ width: '80px', textAlign: 'center', fontSize: '1.5rem' }}
                                    />
                                    <span style={{ alignSelf: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        ou escolha:
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {commonEmojis.map((emoji) => (
                                        <button
                                            key={emoji}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: emoji })}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                border: formData.icon === emoji ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                borderRadius: 'var(--radius-sm)',
                                                background: formData.icon === emoji ? 'var(--primary)20' : 'var(--bg-dark)',
                                                cursor: 'pointer',
                                                fontSize: '1.25rem',
                                            }}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Cor</label>
                                <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-xs)' }}>
                                    <input
                                        className="input"
                                        type="color"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        style={{ width: '80px', height: '40px', padding: '4px' }}
                                    />
                                    <input
                                        className="input"
                                        type="text"
                                        value={formData.color}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                        placeholder="#FFB74D"
                                        style={{ flex: 1 }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {commonColors.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, color: color })}
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                border: formData.color === color ? '2px solid #fff' : '1px solid var(--border)',
                                                borderRadius: 'var(--radius-sm)',
                                                background: color,
                                                cursor: 'pointer',
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            padding: 'var(--space-md)',
                            background: 'var(--bg-dark)',
                            borderRadius: 'var(--radius-md)',
                            border: `2px solid ${formData.color}`,
                        }}>
                            <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 'var(--space-sm)' }}>
                                Preview:
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                                <span style={{ fontSize: '2rem' }}>{formData.icon}</span>
                                <div style={{
                                    padding: '8px 16px',
                                    background: `${formData.color}20`,
                                    color: formData.color,
                                    borderRadius: 'var(--radius-md)',
                                    fontWeight: 600,
                                }}>
                                    {formData.name || 'Nome da categoria'}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-md">
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                {editingCategory ? 'Atualizar Categoria' : 'Criar Categoria'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingCategory(null);
                                    setFormData({ name: '', icon: '📦', color: '#FFB74D' });
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="skeleton" style={{ height: '400px' }}></div>
            ) : categories.length > 0 ? (
                <div className="grid grid-4">
                    {categories.map((category) => (
                        <div key={category.id} className="card card-glass">
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-md)',
                                marginBottom: 'var(--space-md)',
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: 'var(--radius-md)',
                                    background: `${category.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                }}>
                                    {category.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0 }}>{category.name}</h4>
                                    <div style={{
                                        marginTop: '4px',
                                        padding: '2px 8px',
                                        background: `${category.color}20`,
                                        color: category.color,
                                        borderRadius: 'var(--radius-sm)',
                                        fontSize: '0.75rem',
                                        display: 'inline-block',
                                    }}>
                                        {category.color}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-sm">
                                <button
                                    className="btn btn-outline"
                                    onClick={() => handleEdit(category)}
                                    style={{ flex: 1 }}
                                >
                                    <Edit2 size={16} />
                                    Editar
                                </button>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => handleDelete(category.id, category.name)}
                                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                    <Tag size={64} color="var(--text-muted)" style={{ margin: '0 auto var(--space-lg)' }} />
                    <h3 className="text-muted">Nenhuma categoria cadastrada</h3>
                    <p className="text-muted">Clique em "Nova Categoria" para começar</p>
                </div>
            )}
        </div>
    );
};

export default Categories;
