import { useState } from 'react';
import { Sparkles } from 'lucide-react';

interface FloatingAIButtonProps {
    onClick: () => void;
    suggestionCount?: number;
}

const FloatingAIButton = ({ onClick, suggestionCount = 0 }: FloatingAIButtonProps) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="floating-ai-button"
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                boxShadow: isHovered
                    ? '0 8px 32px rgba(102, 126, 234, 0.6)'
                    : '0 4px 24px rgba(102, 126, 234, 0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isHovered ? 'scale(1.1) translateY(-4px)' : 'scale(1)',
                zIndex: 1000,
                animation: suggestionCount > 0 ? 'pulse 2s infinite' : 'glow 3s ease-in-out infinite',
            }}
            aria-label="Assistente IA"
            title="Assistente IA - Clique para abrir"
        >
            <Sparkles
                size={28}
                color="white"
                style={{
                    filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))',
                }}
            />

            {suggestionCount > 0 && (
                <div
                    style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.6)',
                        animation: 'bounce 1s infinite',
                    }}
                >
                    {suggestionCount > 9 ? '9+' : suggestionCount}
                </div>
            )}

            {/* Ripple effect on hover */}
            {isHovered && (
                <div
                    style={{
                        position: 'absolute',
                        inset: '-8px',
                        borderRadius: '50%',
                        border: '2px solid rgba(102, 126, 234, 0.3)',
                        animation: 'ripple 1.5s ease-out infinite',
                    }}
                />
            )}
        </button>
    );
};

export default FloatingAIButton;

// Adicionar ao CSS global
const styles = `
@keyframes glow {
  0%, 100% { box-shadow: 0 4px 24px rgba(102, 126, 234, 0.4); }
  50% { box-shadow: 0 4px 32px rgba(102, 126, 234, 0.6); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.floating-ai-button:active {
  transform: scale(0.95) !important;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
