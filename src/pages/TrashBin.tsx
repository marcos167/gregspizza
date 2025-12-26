import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useTrash, type TrashItem } from '../hooks/useTrash';
import './TrashBin.css';

const TrashBin = () => {
    const toast = useToast();
    const [filter, setFilter] = useState<string>('all');
    const { items, loading, refreshTrash, restoreItem, permanentDelete } = useTrash();

    useEffect(() => {
        refreshTrash();
    }, []);

    const handleRestore = async (item: TrashItem) => {
        if (!confirm(`Restaurar "${item.item_name}" ? `)) return;

        try {
            await restoreItem(item.id, item.item_type); // Assuming item_type is the table_name
            toast.success(`"${item.item_name}" restaurado com sucesso!`);
            refreshTrash();
        } catch (error) {
            toast.error('Erro ao restaurar item');
        }
    };

    const handlePermanentDelete = async (item: TrashItem) => {
        if (!confirm(`⚠️ EXCLUIR PERMANENTEMENTE "${item.item_name}" ?\n\nEsta ação não pode ser desfeita!`)) return;

        try {
            await permanentDelete(item.id, item.item_type); // Assuming item_type is the table_name
            toast.success(`"${item.item_name}" excluído permanentemente`);
            refreshTrash();
        } catch (error) {
            toast.error('Erro ao excluir item');
        }
    };

    const filteredItems = filter === 'all'
        ? items
        : items.filter(item => item.item_type === filter);

    const getTypeLabel = (type: string): string => {
        const labels: Record<string, string> = {
            recipe: 'Receita',
            ingredient: 'Ingrediente',
            category: 'Categoria',
            sale: 'Venda'
        };
        return labels[type] || type;
    };

    const getTypeIcon = (type: string): string => {
        const icons: Record<string, string> = {
            recipe: '🍕',
            ingredient: '🧈',
            category: '📁',
            sale: '💰'
        };
        return icons[type] || '📄';
    };

    const getDaysInTrash = (deletedAt: string): number => {
        const deleted = new Date(deletedAt);
        const now = new Date();
        const diff = now.getTime() - deleted.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="animate-fade-in">
            <header className="trash-header">
                <div>
                    <h1><Trash2 size={32} /> Lixeira</h1>
                    <p className="text-muted">
                        Itens excluídos são mantidos por 30 dias
                    </p>
                </div>
                {items.length > 0 && (
                    <div className="trash-stats">
                        <span className="stat-badge">{items.length} itens</span>
                    </div>
                )}
            </header>

            {/* Filters */}
            <div className="trash-filters">
                <button
                    className={`filter - btn ${filter === 'all' ? 'active' : ''} `}
                    onClick={() => setFilter('all')}
                >
                    Todos ({items.length})
                </button>
                <button
                    className={`filter - btn ${filter === 'recipe' ? 'active' : ''} `}
                    onClick={() => setFilter('recipe')}
                >
                    🍕 Receitas ({items.filter(i => i.item_type === 'recipe').length})
                </button>
                <button
                    className={`filter - btn ${filter === 'ingredient' ? 'active' : ''} `}
                    onClick={() => setFilter('ingredient')}
                >
                    🧈 Ingredientes ({items.filter(i => i.item_type === 'ingredient').length})
                </button>
                <button
                    className={`filter - btn ${filter === 'category' ? 'active' : ''} `}
                    onClick={() => setFilter('category')}
                >
                    📁 Categorias ({items.filter(i => i.item_type === 'category').length})
                </button>
            </div>

            {loading ? (
                <div className="skeleton" style={{ height: '400px' }}></div>
            ) : filteredItems.length > 0 ? (
                <div className="trash-grid">
                    {filteredItems.map((item) => {
                        const daysInTrash = getDaysInTrash(item.deleted_at);
                        const isExpiringSoon = daysInTrash >= 25;

                        return (
                            <div key={item.id} className="trash-item card">
                                <div className="trash-item-header">
                                    <span className="trash-icon">
                                        {getTypeIcon(item.item_type)}
                                    </span>
                                    <div className="trash-info">
                                        <h4>{item.item_name}</h4>
                                        <span className="trash-type">{getTypeLabel(item.item_type)}</span>
                                    </div>
                                </div>

                                <div className="trash-meta">
                                    <span className="trash-date">
                                        Excluído há {daysInTrash} {daysInTrash === 1 ? 'dia' : 'dias'}
                                    </span>
                                    {isExpiringSoon && (
                                        <span className="trash-warning">
                                            <AlertTriangle size={14} />
                                            Expira em {30 - daysInTrash} dias
                                        </span>
                                    )}
                                </div>

                                <div className="trash-actions">
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleRestore(item)}
                                        title="Restaurar"
                                    >
                                        <RotateCcw size={16} />
                                        Restaurar
                                    </button>
                                    <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handlePermanentDelete(item)}
                                        title="Excluir permanentemente"
                                    >
                                        <X size={16} />
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card empty-state">
                    <Trash2 size={64} color="var(--text-muted)" />
                    <h3 className="text-muted">Lixeira vazia</h3>
                    <p className="text-muted">
                        {filter === 'all'
                            ? 'Nenhum item na lixeira'
                            : `Nenhum ${getTypeLabel(filter).toLowerCase()} na lixeira`
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default TrashBin;
