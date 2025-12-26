import './ModeSelector.css';

export type AIMode = 'conversation' | 'action';

interface ModeSelectorProps {
    mode: AIMode;
    onModeChange: (mode: AIMode) => void;
}

const ModeSelector = ({ mode, onModeChange }: ModeSelectorProps) => {
    const modes = [
        {
            type: 'conversation' as AIMode,
            icon: '💬',
            label: 'Conversar',
            description: 'Explicações, dúvidas e sugestões'
        },
        {
            type: 'action' as AIMode,
            icon: '⚡',
            label: 'Executar',
            description: 'Ações diretas com confirmação'
        }
    ];

    return (
        <div className="mode-selector">
            {modes.map((m) => (
                <button
                    key={m.type}
                    className={`mode-button ${mode === m.type ? 'active' : ''}`}
                    onClick={() => onModeChange(m.type)}
                    title={m.description}
                >
                    <span className="mode-icon">{m.icon}</span>
                    <span className="mode-label">{m.label}</span>
                </button>
            ))}
        </div>
    );
};

export default ModeSelector;
