import './ActionPreview.css';

export interface ActionImpact {
    [key: string]: string;
}

export interface ActionPreviewData {
    action: string;
    title: string;
    description: string;
    impact: ActionImpact;
    previewData?: any;
    onConfirm?: () => Promise<boolean> | void;
    onCancel?: () => void;
}

interface ActionPreviewProps {
    data: ActionPreviewData;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const ActionPreview = ({ data, onConfirm, onCancel, isLoading = false }: ActionPreviewProps) => {
    const renderPreviewContent = () => {
        if (Array.isArray(data.previewData)) {
            return (
                <div className="preview-list">
                    {data.previewData.map((item, idx) => (
                        <div key={idx} className="preview-item">
                            <h5>{item.name || item.title}</h5>
                            {item.description && <p>{item.description}</p>}
                        </div>
                    ))}
                </div>
            );
        }

        return (
            <pre className="preview-json">
                {JSON.stringify(data.previewData, null, 2)}
            </pre>
        );
    };

    return (
        <div className="action-preview-overlay">
            <div className="action-preview-card">
                {/* Header */}
                <div className="preview-header">
                    <h3>⚡ {data.title}</h3>
                    <p className="preview-description">{data.description}</p>
                </div>

                {/* Impact Section */}
                <div className="impact-section">
                    <h4>📊 Impacto da Ação</h4>
                    <div className="impact-grid">
                        {data.impact.stock && (
                            <div className="impact-item">
                                <span className="impact-icon">📦</span>
                                <div>
                                    <strong>Estoque</strong>
                                    <p>{data.impact.stock}</p>
                                </div>
                            </div>
                        )}
                        {data.impact.cost && (
                            <div className="impact-item">
                                <span className="impact-icon">💰</span>
                                <div>
                                    <strong>Custo</strong>
                                    <p>{data.impact.cost}</p>
                                </div>
                            </div>
                        )}
                        {data.impact.recipes && (
                            <div className="impact-item">
                                <span className="impact-icon">🍕</span>
                                <div>
                                    <strong>Receitas</strong>
                                    <p>{data.impact.recipes}</p>
                                </div>
                            </div>
                        )}
                        {data.impact.warning && (
                            <div className="impact-item warning">
                                <span className="impact-icon">⚠️</span>
                                <div>
                                    <strong>Atenção</strong>
                                    <p>{data.impact.warning}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview Content */}
                <div className="preview-content">
                    <h4>👁️ Prévia</h4>
                    {renderPreviewContent()}
                </div>

                {/* Actions */}
                <div className="preview-actions">
                    <button
                        onClick={onCancel}
                        className="btn-cancel"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn-confirm"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner"></span>
                                Executando...
                            </>
                        ) : (
                            <>
                                ✓ Confirmar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionPreview;
