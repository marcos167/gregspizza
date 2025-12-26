-- Script para popular o banco de dados com dados de exemplo
-- Execute este script no SQL Editor do Supabase
-- 1. Limpar dados existentes (opcional)
-- DELETE FROM ai_insights;
-- DELETE FROM ingredients;
-- 2. Inserir ingredientes de exemplo
INSERT INTO
    ingredients (
        name,
        unit,
        category,
        min_stock,
        cost_per_unit,
        current_stock
    )
VALUES
    (
        'Queijo Mussarela',
        'kg',
        'queijo',
        5.0,
        35.00,
        12.5
    ),
    (
        'Molho de Tomate',
        'litros',
        'molhos',
        3.0,
        8.50,
        7.2
    ),
    (
        'Farinha de Trigo',
        'kg',
        'massa',
        10.0,
        4.20,
        25.0
    ),
    ('Calabresa', 'kg', 'carnes', 4.0, 28.00, 3.5),
    ('Tomate', 'kg', 'vegetais', 2.0, 6.00, 8.0),
    ('Cebola', 'kg', 'vegetais', 2.0, 4.50, 5.5),
    ('Azeitona', 'kg', 'vegetais', 1.0, 18.00, 2.3),
    ('Presunto', 'kg', 'carnes', 3.0, 22.00, 6.0),
    (
        'Fermento Biológico',
        'unidades',
        'massa',
        5.0,
        2.50,
        12.0
    ),
    (
        'Orégano',
        'gramas',
        'temperos',
        100.0,
        0.15,
        250.0
    );

-- 3. Inserir insights de IA de exemplo
INSERT INTO
    ai_insights (
        insight_type,
        title,
        description,
        priority,
        dismissed
    )
VALUES
    (
        'warning',
        'Estoque de Calabresa Crítico',
        'Você tem apenas 3.5kg de calabresa, abaixo do mínimo de 4kg. Sugerimos comprar pelo menos 10kg para atender a demanda semanal.',
        'high',
        false
    ),
    (
        'suggestion',
        'Otimize Compras de Queijo',
        'Seu estoque de queijo mussarela está 2.5x acima do mínimo. Você pode reduzir a próxima compra em 30% para evitar desperdício.',
        'medium',
        false
    ),
    (
        'optimization',
        'Promoção de Pizza de Tomate',
        'Você tem 4x mais tomate em estoque do que o normal. Considere criar uma promoção de pizzas com tomate para aproveitar o excesso.',
        'low',
        false
    );

-- 4. Verificar se os dados foram inseridos
SELECT
    'Ingredientes:',
    COUNT(*) as total
FROM
    ingredients;

SELECT
    'Insights:',
    COUNT(*) as total
FROM
    ai_insights;