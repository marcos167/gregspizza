import type { Suggestion } from '../../services/ai/contextEngine';
import './ContextualSuggestions.css';

interface ContextualSuggestionsProps {
    suggestions: Suggestion[];
    onSuggestionClick: (suggestion: Suggestion) => void;
    isLoading?: boolean;
}

const ContextualSuggestions = ({
    suggestions,
    onSuggestionClick,
    isLoading = false
}: ContextualSuggestionsProps) => {
    if (isLoading) {
        return (
            <div className="contextual-suggestions loading">
                <div className="suggestions-skeleton"></div>
            </div>
        );
    }

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <div className="contextual-suggestions">
            <h4 className="suggestions-title">💡 Sugestões Inteligentes</h4>
            <div className="suggestions-list">
                {suggestions.map((suggestion) => (
                    <div
                        key={suggestion.id}
                        className={`suggestion-card priority-${suggestion.priority}`}
                        onClick={() => onSuggestionClick(suggestion)}
                    >
                        <span className="suggestion-icon">{suggestion.icon}</span>
                        <div className="suggestion-content">
                            <p className="suggestion-text">{suggestion.text}</p>
                            {suggestion.actionLabel && (
                                <button className="suggestion-action-btn">
                                    {suggestion.actionLabel}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContextualSuggestions;
