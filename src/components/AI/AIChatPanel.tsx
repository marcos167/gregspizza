import { useState, useRef, useEffect } from 'react';
import { Send, X, Sparkles } from 'lucide-react';
import './AIChatPanel.css';
import ModeSelector from './ModeSelector';
import type { AIMode } from './ModeSelector';
import ContextualSuggestions from './ContextualSuggestions';
import { useContextDetection } from '../../hooks/useContextDetection';
import type { Suggestion } from '../../services/ai/contextEngine';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: Array<{ label: string; onClick: () => void }>;
}

interface AIChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    messages: Message[];
    isTyping: boolean;
    onSendMessage: (message: string, mode?: AIMode) => void;
}

const AIChatPanel = ({ isOpen, onClose, messages, isTyping, onSendMessage }: AIChatPanelProps) => {
    const [inputValue, setInputValue] = useState('');
    const [mode, setMode] = useState<AIMode>('conversation');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Context detection for suggestions
    const { suggestions } = useContextDetection();

    // Handle suggestion clicks
    const handleSuggestionClick = (suggestion: Suggestion) => {
        console.log('[AIChatPanel] Suggestion clicked:', suggestion);

        // If in action mode and has action, send the action command
        if (mode === 'action' && suggestion.action) {
            onSendMessage(`/${suggestion.action}`, mode);
        } else {
            // In conversation mode, just explain what it would do
            onSendMessage(suggestion.text, mode);
        }
    };

    // Placeholder for quickActions and handleQuickAction
    // These were used in the JSX but not defined in the original snippet.
    const quickActions = [
        { command: 'summarize', icon: '📝', text: 'Summarize' },
        { command: 'explain', icon: '💡', text: 'Explain' },
    ];

    const handleQuickAction = (command: string) => {
        console.log(`Quick action: ${command}`);
        // Implement logic for quick actions, e.g., send a predefined message
        onSendMessage(`/${command}`, mode);
    };

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        console.log('[AIChatPanel] handleSend called');
        console.log('[AIChatPanel] inputValue:', inputValue);
        console.log('[AIChatPanel] mode:', mode);

        if (!inputValue.trim() || isTyping) {
            console.log('[AIChatPanel] Blocked: empty input or loading');
            return;
        }

        console.log('[AIChatPanel] Calling onSendMessage...');
        onSendMessage(inputValue.trim(), mode);
        setInputValue('');
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 999,
                    animation: 'fadeIn 0.2s',
                }}
            />

            {/* Panel */}
            <div
                style={{
                    position: 'fixed',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '450px',
                    maxWidth: '100vw',
                    background: 'var(--bg-darker)',
                    borderLeft: '1px solid var(--border)',
                    boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.3)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: 'var(--space-lg)',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <Sparkles size={24} color="white" />
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.125rem' }}>
                                Assistente Operacional
                            </h3>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
                                Powered by IA
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'white',
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Mode Selector */}
                <ModeSelector mode={mode} onModeChange={setMode} />

                {/* Contextual Suggestions */}
                {mode === 'action' && suggestions.length > 0 && (
                    <ContextualSuggestions
                        suggestions={suggestions}
                        onSuggestionClick={handleSuggestionClick}
                    />
                )}

                {/* Quick Actions */}
                <div
                    style={{
                        padding: 'var(--space-md)',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        gap: 'var(--space-sm)',
                        overflowX: 'auto',
                        flexWrap: 'wrap',
                    }}
                >
                    {quickActions.map((action) => (
                        <button
                            key={action.command}
                            onClick={() => handleQuickAction(action.command)}
                            className="btn btn-outline"
                            style={{
                                padding: '6px 12px',
                                fontSize: '0.875rem',
                                whiteSpace: 'nowrap',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}
                        >
                            <span>{action.icon}</span>
                            {action.text}
                        </button>
                    ))}
                </div>

                {/* Messages */}
                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: 'var(--space-lg)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-md)',
                    }}
                >
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
                                animation: 'fadeIn 0.3s',
                            }}
                        >
                            <div
                                style={{
                                    maxWidth: '85%',
                                    padding: 'var(--space-md)',
                                    borderRadius: 'var(--radius-lg)',
                                    background:
                                        message.role === 'user'
                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            : 'var(--bg-dark)',
                                    color: message.role === 'user' ? 'white' : 'var(--text-primary)',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {message.content}
                            </div>
                            <span
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    marginTop: '4px',
                                    padding: '0 var(--space-sm)',
                                }}
                            >
                                {message.timestamp.toLocaleTimeString('pt-BR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>

                            {message.actions && message.actions.length > 0 && (
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 'var(--space-sm)',
                                        marginTop: 'var(--space-sm)',
                                    }}
                                >
                                    {message.actions.map((action, idx) => (
                                        <button
                                            key={idx}
                                            onClick={action.onClick}
                                            className="btn btn-sm btn-primary"
                                        >
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <div
                                style={{
                                    padding: 'var(--space-md)',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'var(--bg-dark)',
                                    display: 'flex',
                                    gap: '4px',
                                }}
                            >
                                <div className="typing-dot" style={{ animationDelay: '0s' }} />
                                <div className="typing-dot" style={{ animationDelay: '0.2s' }} />
                                <div className="typing-dot" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div
                    style={{
                        padding: 'var(--space-lg)',
                        borderTop: '1px solid var(--border)',
                        background: 'var(--bg-dark)',
                    }}
                >
                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                        <input
                            ref={inputRef}
                            type="text"
                            className="input"
                            placeholder="Digite sua mensagem..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            style={{ flex: 1 }}
                        />
                        <button
                            onClick={handleSend}
                            className="btn btn-primary"
                            disabled={!inputValue.trim()}
                            style={{ padding: '10px' }}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                .typing-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: var(--text-muted);
                    animation: typing 1.4s infinite;
                }

                @keyframes typing {
                    0%, 60%, 100% {
                        transform: translateY(0);
                        opacity: 0.4;
                    }
                    30% {
                        transform: translateY(-10px);
                        opacity: 1;
                    }
                }
            `}</style>
        </>
    );
};

export default AIChatPanel;
