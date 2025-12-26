import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { aiClient } from '../services/ai/geminiClient';
import { buildSystemContext } from '../services/ai/contextBuilder';
import { parseCommand } from '../services/ai/commandParser';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actions?: Array<{ label: string; onClick: () => void }>;
}

interface UseAIChatReturn {
    messages: Message[];
    isOpen: boolean;
    isTyping: boolean;
    suggestionCount: number;
    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
    sendMessage: (content: string) => Promise<void>;
    clearHistory: () => void;
}

export const useAIChat = (): UseAIChatReturn => {
    const [isOpen, setIsOpen] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [suggestionCount, setSuggestionCount] = useState(0);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: '👋 Olá! Sou seu assistente operacional. Posso ajudar você a:\n\n• Criar e editar receitas\n• Gerenciar ingredientes\n• Importar/exportar dados\n• Ver alertas de estoque\n• Acessar a lixeira\n\nDigite "/help" para ver todos os comandos ou simplesmente me diga o que precisa!',
            timestamp: new Date(),
        },
    ]);

    const openChat = useCallback(() => {
        setIsOpen(true);
        setSuggestionCount(0);
    }, []);

    const closeChat = useCallback(() => {
        setIsOpen(false);
    }, []);

    const toggleChat = useCallback(() => {
        setIsOpen((prev) => !prev);
        if (!isOpen) {
            setSuggestionCount(0);
        }
    }, [isOpen]);

    const sendMessage = useCallback(async (content: string) => {
        console.log('[useAIChat] sendMessage called with:', content);

        if (!content.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setIsTyping(true);

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Always try to use AI for better understanding
            let aiResponse;

            try {
                const context = await buildSystemContext(user.id);
                console.log('🤖 Calling OpenAI with context:', { user: context.user, message: content });
                aiResponse = await aiClient.chat(content, context);
                console.log('✅ OpenAI response:', aiResponse);
            } catch (aiError) {
                console.error('❌ OpenAI error, falling back to command parser:', aiError);

                // Fallback to command parser
                const command = parseCommand(content);
                if (command) {
                    aiResponse = await handleCommand(command);
                } else {
                    // Ultimate fallback
                    aiResponse = {
                        message: '❌ Desculpe, não consegui processar sua mensagem. Tente reformular ou use "/help" para ver os comandos disponíveis.',
                    };
                }
            }

            // Add assistant message
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponse.message,
                timestamp: new Date(),
                actions: aiResponse.actions?.map((action: any) => ({
                    label: action.label,
                    onClick: () => handleAction(action.command),
                })),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            // Log to chat history (optional - only if tables exist)
            try {
                await supabase.from('chat_history').insert([
                    {
                        user_id: user.id,
                        user_email: user.email,
                        message: content,
                        role: 'user',
                        intent: aiResponse.intent || null,
                    },
                    {
                        user_id: user.id,
                        user_email: user.email,
                        message: aiResponse.message,
                        role: 'assistant',
                    },
                ]);
            } catch (logError) {
                console.warn('Failed to log chat history:', logError);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: '❌ Desculpe, ocorreu um erro. Tente novamente ou use um comando estruturado como "/help".',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    }, []);

    const handleCommand = async (intent: any) => {
        // Simple command responses
        if (intent.action === 'query' && intent.params.type === 'help') {
            return {
                message: `🤖 **Comandos disponíveis:**

**Receitas**
• /create recipe <nome>
• /list recipes
• /delete recipe <nome>

**Ingredientes**
• /create ingredient <nome>
• /list ingredients

**Lixeira**
• /trash show
• /restore <tipo> <id>

**Dados**
• /import
• /export recipes

Ou simplesmente me diga o que precisa em linguagem natural! 😊`,
            };
        }

        if (intent.action === 'create') {
            return {
                message: `📝 Você quer criar um(a) ${intent.entity === 'recipe' ? 'receita' : 'ingrediente'} chamado(a) "${intent.params.name}".\n\nVou precisar de mais informações. Que tal usar a interface normal ou me dizer todos os detalhes?`,
                intent,
            };
        }

        if (intent.action === 'list') {
            if (intent.entity === 'trash') {
                return {
                    message: '🗑️ Para ver a lixeira, clique no botão abaixo:',
                    actions: [
                        {
                            label: '🗑️ Abrir Lixeira',
                            command: 'navigate:/trash',
                            type: 'primary' as const,
                        },
                    ],
                };
            }

            return {
                message: `📊 Para ver a lista de ${intent.entity}, use a navegação do sistema ou me diga se quer procurar algo específico!`,
            };
        }

        return {
            message: `✅ Comando reconhecido: ${intent.action} ${intent.entity}\n\nEm breve esta ação estará automatizada!`,
            intent,
        };
    };

    const handleAction = (command: string) => {
        if (command === 'execute') {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: '⚙️ Executando comando... (Em breve funcional)',
                    timestamp: new Date(),
                },
            ]);
        } else if (command === 'cancel') {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: '❌ Comando cancelado.',
                    timestamp: new Date(),
                },
            ]);
        }
    };

    const clearHistory = useCallback(() => {
        setMessages([
            {
                id: '1',
                role: 'assistant',
                content: '👋 Histórico limpo! Como posso ajudar?',
                timestamp: new Date(),
            },
        ]);
    }, []);

    return {
        messages,
        isOpen,
        isTyping,
        suggestionCount,
        openChat,
        closeChat,
        toggleChat,
        sendMessage,
        clearHistory,
    };
};
