import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import type { Toast, ToastType } from '../contexts/ToastContext';
import './ToastContainer.css';

const ToastContainer = () => {
    const { toasts, removeToast } = useToast();

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <AlertCircle size={20} />;
            case 'warning':
                return <AlertTriangle size={20} />;
            case 'info':
                return <Info size={20} />;
        }
    };

    const getColors = (type: ToastType) => {
        switch (type) {
            case 'success':
                return {
                    bg: 'var(--success)',
                    border: 'var(--success)',
                    icon: '#fff'
                };
            case 'error':
                return {
                    bg: 'var(--danger)',
                    border: 'var(--danger)',
                    icon: '#fff'
                };
            case 'warning':
                return {
                    bg: 'var(--warning)',
                    border: 'var(--warning)',
                    icon: '#fff'
                };
            case 'info':
                return {
                    bg: 'var(--info)',
                    border: 'var(--info)',
                    icon: '#fff'
                };
        }
    };

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((toast, index) => {
                const colors = getColors(toast.type);
                return (
                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type} animate-slide-in-right`}
                        style={{
                            animationDelay: `${index * 100}ms`,
                            borderLeft: `4px solid ${colors.border}`
                        }}
                    >
                        <div
                            className="toast-icon"
                            style={{
                                background: `${colors.bg}20`,
                                color: colors.bg
                            }}
                        >
                            {getIcon(toast.type)}
                        </div>
                        <div className="toast-content">
                            <p className="toast-message">{toast.message}</p>
                        </div>
                        <button
                            className="toast-close"
                            onClick={() => removeToast(toast.id)}
                            aria-label="Fechar notificação"
                        >
                            <X size={16} />
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default ToastContainer;
