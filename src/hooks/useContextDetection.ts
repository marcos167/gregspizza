import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { contextEngine } from '../services/ai/contextEngine';
import type { PageContext, Suggestion } from '../services/ai/contextEngine';

interface UseContextDetectionReturn {
    context: PageContext;
    suggestions: Suggestion[];
    isLoading: boolean;
}

export const useContextDetection = (
    data?: any,
    user?: any,
    stock?: any
): UseContextDetectionReturn => {
    const location = useLocation();
    const [context, setContext] = useState<PageContext>({
        page: 'unknown',
        route: location.pathname
    });
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const detectAndSuggest = () => {
            setIsLoading(true);

            // Detect current page
            const page = contextEngine.getPageFromRoute(location.pathname);

            // Build context
            const newContext: PageContext = {
                page,
                route: location.pathname,
                data,
                user,
                stock
            };

            setContext(newContext);

            // Generate suggestions
            const newSuggestions = contextEngine.generateSuggestions(newContext);
            setSuggestions(newSuggestions);

            setIsLoading(false);
        };

        // Debounce to avoid too many calls
        const timer = setTimeout(detectAndSuggest, 300);

        return () => clearTimeout(timer);
    }, [location.pathname, data, user, stock]);

    return {
        context,
        suggestions,
        isLoading
    };
};

export default useContextDetection;
