import { useState, useEffect } from 'react';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const CriticalStockBar = () => {
    const [lowStockCount, setLowStockCount] = useState(0);
    const [isDismissed, setIsDismissed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        checkLowStock();

        // Check if user has dismissed the bar in this session
        const dismissed = sessionStorage.getItem('stockBarDismissed');
        if (dismissed === 'true') {
            setIsDismissed(true);
        }

        // Check every 30 seconds
        const interval = setInterval(checkLowStock, 30000);
        return () => clearInterval(interval);
    }, []);

    const checkLowStock = async () => {
        const { data } = await supabase
            .from('ingredients')
            .select('id, name, current_stock, min_stock')
            .lt('current_stock', supabase.rpc('min_stock'));

        if (data) {
            const criticalItems = data.filter(item => (item.current_stock || 0) < item.min_stock);
            setLowStockCount(criticalItems.length);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('stockBarDismissed', 'true');
    };

    const handleViewStock = () => {
        navigate('/');
        handleDismiss();
    };

    if (lowStockCount === 0 || isDismissed) return null;

    return (
        <div
            className="animate-slide-up"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 999,
                background: 'linear-gradient(135deg, rgba(255, 20, 147, 0.95) 0%, rgba(199, 21, 133, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
                padding: 'var(--space-md) var(--space-lg)',
                boxShadow: '0 4px 20px rgba(255, 20, 147, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
            }}
        >
            <div
                className="container"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 'var(--space-md)'
                }}
            >
                {/* Message */}
                <div className="flex items-center gap-md">
                    <div
                        className="animate-pulse"
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <AlertTriangle size={20} color="white" />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', fontWeight: 600 }}>
                            {lowStockCount === 1
                                ? '⚠️ 1 ingrediente com estoque crítico'
                                : `⚠️ ${lowStockCount} ingredientes com estoque crítico`}
                        </h4>
                        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>
                            Ação imediata necessária para evitar interrupção nas vendas
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-md">
                    <button
                        onClick={handleViewStock}
                        className="btn"
                        style={{
                            background: 'white',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                            gap: 'var(--space-sm)'
                        }}
                    >
                        Ver Estoque
                        <ArrowRight size={16} />
                    </button>
                    <button
                        onClick={handleDismiss}
                        style={{
                            background: 'transparent',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            cursor: 'pointer',
                            padding: 'var(--space-sm)',
                            borderRadius: 'var(--radius-md)',
                            transition: 'all var(--transition-fast)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CriticalStockBar;
