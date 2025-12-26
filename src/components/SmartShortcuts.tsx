import { useState, useEffect } from 'react';
import { Zap, TrendingUp } from 'lucide-react';
import { useActionTracker, type UserAction } from '../hooks/useActionTracker';
import './SmartShortcuts.css';

interface SmartShortcutsProps {
    onShortcutClick?: (action: UserAction) => void;
    limit?: number;
}

const SmartShortcuts = ({ onShortcutClick, limit = 5 }: SmartShortcutsProps) => {
    const [shortcuts, setShortcuts] = useState<UserAction[]>([]);
    const [loading, setLoading] = useState(true);
    const { getTopActions } = useActionTracker();

    useEffect(() => {
        loadShortcuts();
    }, []);

    const loadShortcuts = async () => {
        setLoading(true);
        const actions = await getTopActions(limit);
        setShortcuts(actions);
        setLoading(false);
    };

    const handleShortcutClick = (action: UserAction) => {
        console.log('[SmartShortcuts] Clicked:', action);
        onShortcutClick?.(action);
    };

    const getActionIcon = (actionType: string): string => {
        const icons: Record<string, string> = {
            'create_recipe': '🍕',
            'add_ingredient': '🧈',
            'view_sales': '💰',
            'check_stock': '📦',
            'view_timeline': '📜',
            'create_category': '📁',
            'default': '⚡'
        };
        return icons[actionType] || icons.default;
    };

    if (loading) {
        return (
            <div className="smart-shortcuts loading">
                <div className="shortcuts-skeleton"></div>
            </div>
        );
    }

    if (shortcuts.length === 0) {
        return null;
    }

    return (
        <div className="smart-shortcuts">
            <div className="shortcuts-header">
                <Zap size={18} />
                <h4>Atalhos Recomendados</h4>
                <TrendingUp size={16} className="trending-icon" />
            </div>

            <div className="shortcuts-grid">
                {shortcuts.map((shortcut) => (
                    <button
                        key={shortcut.id}
                        className="shortcut-card"
                        onClick={() => handleShortcutClick(shortcut)}
                        title={`Usado ${shortcut.count} vezes`}
                    >
                        <span className="shortcut-icon">
                            {getActionIcon(shortcut.action_type)}
                        </span>
                        <div className="shortcut-content">
                            <span className="shortcut-label">{shortcut.action_label}</span>
                            <span className="shortcut-count">{shortcut.count}x</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SmartShortcuts;
