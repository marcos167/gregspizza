import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Apenas para desenvolvimento - mover para backend em produção
});

export interface AIInsight {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    category: 'inventory' | 'sales' | 'optimization' | 'alert';
}

/**
 * Analisa dados de vendas e estoque para gerar insights com IA
 */
export async function generateInventoryInsights(data: {
    ingredients: any[];
    sales: any[];
    recipes: any[];
}): Promise<AIInsight[]> {
    try {
        const prompt = `Você é um assistente especializado em gestão de estoque para pizzarias.

Analise os seguintes dados e gere 3-5 insights acionáveis em português:

INGREDIENTES EM ESTOQUE:
${JSON.stringify(data.ingredients, null, 2)}

VENDAS RECENTES:
${JSON.stringify(data.sales.slice(0, 20), null, 2)}

RECEITAS:
${JSON.stringify(data.recipes, null, 2)}

Gere insights no seguinte formato JSON:
{
  "insights": [
    {
      "title": "Título curto e direto",
      "description": "Descrição detalhada com números específicos e ação recomendada",
      "priority": "high|medium|low",
      "category": "inventory|sales|optimization|alert"
    }
  ]
}

Foque em:
1. Alertas de estoque baixo ou em excesso
2. Padrões de venda (dias, horários, produtos)
3. Oportunidades de otimização de compras
4. Previsão de demanda
5. Redução de desperdício`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'Você é um consultor especialista em gestão de pizzarias, focado em análise de dados e otimização operacional.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
            max_tokens: 1000
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result.insights || [];
    } catch (error) {
        console.error('Erro ao gerar insights com IA:', error);
        // Retorna insights de fallback em caso de erro
        return getFallbackInsights(data);
    }
}

/**
 * Gera recomendações de compra baseadas em análise de IA
 */
export async function generatePurchaseRecommendations(data: {
    ingredients: any[];
    salesHistory: any[];
    currentWeek: number;
}): Promise<string[]> {
    try {
        const prompt = `Com base nos dados de estoque e vendas, sugira quais ingredientes comprar esta semana e em que quantidade.

ESTOQUE ATUAL:
${JSON.stringify(data.ingredients, null, 2)}

HISTÓRICO DE VENDAS (últimas 4 semanas):
${JSON.stringify(data.salesHistory, null, 2)}

Retorne recomendações em formato JSON:
{
  "recommendations": [
    "Produto X: quantidade Y (motivo)"
  ]
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.5,
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return result.recommendations || [];
    } catch (error) {
        console.error('Erro ao gerar recomendações:', error);
        return ['Configure a chave da API OpenAI para ver recomendações personalizadas'];
    }
}

/**
 * Insights de fallback caso a API falhe
 */
function getFallbackInsights(data: { ingredients: any[]; sales: any[] }): AIInsight[] {
    const insights: AIInsight[] = [];

    // Verifica estoque baixo
    const lowStock = data.ingredients.filter(i => i.current_quantity < i.min_stock);
    if (lowStock.length > 0) {
        insights.push({
            title: `${lowStock.length} ingrediente(s) com estoque baixo`,
            description: `Os seguintes itens estão abaixo do mínimo: ${lowStock.map(i => i.name).join(', ')}. Reponha o quanto antes.`,
            priority: 'high',
            category: 'alert'
        });
    }

    // Análise básica de vendas
    if (data.sales.length > 0) {
        const totalRevenue = data.sales.reduce((sum, sale) => sum + sale.revenue, 0);
        insights.push({
            title: 'Vendas em andamento',
            description: `Registradas ${data.sales.length} vendas totalizando R$ ${totalRevenue.toFixed(2)}. Continue monitorando o desempenho.`,
            priority: 'medium',
            category: 'sales'
        });
    }

    // Sugestão genérica
    insights.push({
        title: 'Otimize suas compras',
        description: 'Analise o histórico de vendas para identificar padrões e comprar apenas o necessário, reduzindo desperdícios.',
        priority: 'low',
        category: 'optimization'
    });

    return insights;
}

/**
 * Analisa padrão de vendas semanal
 */
export async function analyzeSalesPattern(sales: any[]): Promise<{
    bestDay: string;
    worstDay: string;
    topProduct: string;
    recommendation: string;
}> {
    try {
        const prompt = `Analise este histórico de vendas e identifique padrões:

${JSON.stringify(sales, null, 2)}

Retorne em JSON:
{
  "bestDay": "dia da semana com mais vendas",
  "worstDay": "dia da semana com menos vendas",  
  "topProduct": "produto mais vendido",
  "recommendation": "recomendação estratégica baseada nos padrões"
}`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.5,
        });

        return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
        console.error('Erro ao analisar padrões:', error);
        return {
            bestDay: 'Sábado',
            worstDay: 'Segunda',
            topProduct: 'Pizza Margherita',
            recommendation: 'Configure a chave da OpenAI para análises personalizadas'
        };
    }
}
