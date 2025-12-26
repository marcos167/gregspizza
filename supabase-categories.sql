-- ============================================
-- CATEGORIES TABLE - Para gerenciar categorias de ingredientes
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    color TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW ()
);

-- Inserir categorias padrão
INSERT INTO
    categories (name, icon, color)
VALUES
    ('Massas', '🍞', '#FFB74D'),
    ('Queijos', '🧀', '#FDD835'),
    ('Carnes', '🥩', '#E57373'),
    ('Vegetais', '🥬', '#81C784'),
    ('Molhos', '🍅', '#FF7043'),
    ('Temperos', '🧂', '#A1887F') ON CONFLICT (name) DO NOTHING;

-- RLS para categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON categories FOR ALL TO authenticated USING (true)
WITH
    CHECK (true);

-- ============================================
-- ATUALIZAR TABELA INGREDIENTS
-- ============================================
-- Alterar coluna category para referenciar a tabela categories
-- (Executar apenas se category ainda for TEXT)
-- ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_category_fkey;
-- ALTER TABLE ingredients ALTER COLUMN category TYPE TEXT;
-- Manter como TEXT por compatibilidade, mas validar via app