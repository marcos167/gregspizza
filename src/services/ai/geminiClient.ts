import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIActionExecutor } from './aiActionExecutor';

// Import types from correct path
export interface AIResponse {
    message: string;
    intent?: any;
    command?: any;
    actions?: Array<{
        label: string;
        command: string;
        type: 'primary' | 'secondary' | 'danger';
    }>;
    data?: any;
}

export interface SystemContext {
    stock: {
        total_ingredients: number;
        low_stock_count: number;
        out_of_stock_count: number;
        critical_items: Array<{ name: string; stock: number; unit: string }>;
    };
    recipes: {
        total: number;
        with_ingredients: number;
        without_stock: number;
        recent: Array<{ id: string; name: string; type: string }>;
    };
    recent_activity: Array<{
        action_type: string;
        entity_type: string;
        entity_name: string;
        created_at: string;
    }>;
    user: {
        id: string;
        email: string;
        role: string;
    };
}

// API Keys
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

// Initialize clients
const geminiAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true }) : null;

export class AIClient {
    private geminiModel: any;
    private openaiClient: OpenAI | null;
    public actionExecutor: AIActionExecutor | null;

    constructor() {
        console.log('🔧 Initializing Dual AI Client...');

        // Initialize Gemini
        if (geminiAI) {
            this.geminiModel = geminiAI.getGenerativeModel({ model: 'gemini-pro' });
            console.log('✅ Gemini API initialized (Primary)');

            // Initialize action executor with Gemini model
            this.actionExecutor = new AIActionExecutor(this.geminiModel);
            console.log('✅ AI Action Executor initialized');
        } else {
            console.warn('⚠️ Gemini API key not found');
            this.geminiModel = null;
            this.actionExecutor = null;
        }

        // Initialize OpenAI
        this.openaiClient = openai;
        if (this.openaiClient) {
            console.log('✅ OpenAI API initialized (Fallback)');
        } else {
            console.warn('⚠️ OpenAI API key not found');
        }

        if (!this.geminiModel && !this.openaiClient) {
            console.error('❌ No AI provider available!');
        }
    }

    async chat(message: string, context: SystemContext): Promise<AIResponse> {
        console.log('📞 AIClient.chat() called');
        console.log('  Message:', message);
        console.log('  Context:', { user: context.user.email, ingredients: context.stock.total_ingredients });

        // Try Gemini first
        if (this.geminiModel) {
            try {
                console.log('🟣 Trying Gemini API...');
                const prompt = this.buildPrompt(message, context);

                const result = await this.geminiModel.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                console.log('✅ Gemini response received:', text.substring(0, 100) + '...');
                const parsed = this.parseResponse(text, message);
                console.log('✅ Parsed successfully');
                return parsed;
            } catch (geminiError: any) {
                console.warn('⚠️ Gemini failed, trying OpenAI...', geminiError.message);
            }
        } else {
            console.log('⏭️ Gemini not available, skipping to OpenAI');
        }

        // Fallback to OpenAI
        if (this.openaiClient) {
            try {
                console.log('🔵 Trying OpenAI API...');
                const prompt = this.buildPrompt(message, context);

                const completion = await this.openaiClient.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                    max_tokens: 500,
                });

                const text = completion.choices[0]?.message?.content || '';
                console.log('✅ OpenAI response received:', text.substring(0, 100) + '...');

                const parsed = this.parseResponse(text, message);
                console.log('✅ Parsed successfully');
                return parsed;
            } catch (openaiError: any) {
                console.error('❌ OpenAI also failed:', openaiError.message);
            }
        } else {
            console.log('⏭️ OpenAI not available');
        }

        // Ultimate fallback
        console.warn('⚠️ All AI providers failed, using pattern matching fallback');
        return this.getFallbackResponse(message);
    }

    private buildPrompt(message: string, context: SystemContext): string {
        return `Você é um assistente operacional para um sistema de gestão de pizzaria chamado "Greg's Pizza".

CONTEXTO DO SISTEMA:
📊 Estoque:
- ${context.stock.total_ingredients} ingredientes cadastrados
    - ${context.stock.low_stock_count} com estoque baixo
        - ${context.stock.out_of_stock_count} sem estoque

📖 Receitas:
- ${context.recipes.total} receitas cadastradas
    - ${context.recipes.without_stock} receitas impossíveis de produzir agora

👤 Usuário: ${context.user.email} (${context.user.role})

${context.recent_activity.length > 0 ? `
📝 Últimas ações:
${context.recent_activity.slice(0, 3).map((a: any) => `- ${a.action_type} ${a.entity_type}: ${a.entity_name}`).join('\n')}
` : ''
            }

MENSAGEM DO USUÁRIO:
"${message}"

INSTRUÇÕES:
1. Identifique o que o usuário quer fazer
2. Se for criar / editar / deletar dados, extraia os parâmetros em JSON
3. Se for uma consulta, responda com dados do contexto
4. Se precisar de mais informações, pergunte
5. Seja DIRETO e PROFISSIONAL
6. Use emojis para melhor UX

FORMATO DE RESPOSTA:
Se for um comando executável, retorne JSON:
    {
        "type": "command",
            "action": "create|edit|delete|restore|import|export|query|list",
                "entity": "recipe|ingredient|category|stock|sale|trash",
                    "params": {... },
        "confirmation_message": "Mensagem para confirmar a ação",
            "response": "Resposta amigável para o usuário"
    }

Se for apenas uma conversa / query, retorne JSON:
    {
        "type": "response",
            "response": "Sua resposta aqui"
    }

RESPONDA APENAS COM O JSON, SEM MARKDOWN.`;
    }

    private parseResponse(text: string, originalMessage: string): AIResponse {
        try {
            // Remove markdown code blocks if present
            const jsonText = text.replace(/```json\n ? /g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(jsonText);

            if (parsed.type === 'command') {
                return {
                    message: parsed.response || 'Comando identificado',
                    intent: {
                        action: parsed.action,
                        entity: parsed.entity,
                        params: parsed.params || {},
                        confidence: 0.9,
                        rawCommand: originalMessage,
                    },
                    actions: [
                        {
                            label: '✅ Confirmar',
                            command: 'execute',
                            type: 'primary',
                        },
                        {
                            label: '❌ Cancelar',
                            command: 'cancel',
                            type: 'secondary',
                        },
                    ],
                };
            }

            return {
                message: parsed.response || text,
            };
        } catch (error) {
            // If parsing fails, return the text as-is
            return {
                message: text || '🤖 Desculpe, não entendi. Pode reformular?',
            };
        }
    }

    private getFallbackResponse(message: string): AIResponse {
        // Simple pattern matching fallback
        const lowerMessage = message.toLowerCase();

        if (lowerMessage.includes('criar') || lowerMessage.includes('nova') || lowerMessage.includes('novo')) {
            return {
                message: '🆕 Para criar algo novo, você pode:\n\n• "/create recipe <nome>" - Criar receita\n• "/create ingredient <nome>" - Criar ingrediente\n\nOu me conte mais sobre o que quer criar!',
            };
        }

        if (lowerMessage.includes('lixeira') || lowerMessage.includes('deletado') || lowerMessage.includes('excluído')) {
            return {
                message: '🗑️ Para acessar a lixeira, use:\n\n"/trash show"\n\nVocê também pode restaurar itens com:\n"/restore <tipo> <id>"',
            };
        }

        if (lowerMessage.includes('importar') || lowerMessage.includes('import')) {
            return {
                message: '📁 Para importar dados, use:\n\n"/import"\n\nVocê poderá fazer upload de arquivos CSV, Excel ou JSON.',
            };
        }

        if (lowerMessage.includes('estoque') || lowerMessage.includes('stock')) {
            return {
                message: '📦 Para ver o status do estoque:\n\n"/stock status"\n\nPara ver alertas:\n"/alerts stock"',
            };
        }

        if (lowerMessage.includes('ajuda') || lowerMessage.includes('help')) {
            return {
                message: `🤖 ** Comandos disponíveis:**

** Receitas **
• /create recipe <nome>
• /list recipes
• /delete recipe <nome>

    ** Ingredientes **
• /create ingredient <nome>
• /list ingredients
• /stock status

    ** Lixeira **
• /trash show
• /restore <tipo> <id>

    ** Dados **
• /import
• /export recipes
• /export ingredients

Ou simplesmente me diga o que precisa! 😊`,
            };
        }

        return {
            message: '🤖 Entendi! Posso ajudar você com:\n\n• Criar receitas e ingredientes\n• Gerenciar estoque\n• Importar/exportar dados\n• Acessar a lixeira\n\nDigite "/help" para ver todos os comandos ou me diga o que precisa!',
        };
    }
}

export const aiClient = new AIClient();

