-- ============================================
-- AI EVOLUTION - PHASE 1: DATABASE SCHEMA (SAFE VERSION)
-- This version can be run multiple times safely
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. OPERATIONAL TIMELINE
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own timeline" ON operational_timeline;
DROP POLICY IF EXISTS "Users can insert to their timeline" ON operational_timeline;

-- Drop existing table to recreate (comment this if you want to keep data)
-- DROP TABLE IF EXISTS operational_timeline CASCADE;

CREATE TABLE IF NOT EXISTS operational_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'restore', 'ai_action')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('recipe', 'ingredient', 'stock', 'sale', 'category')),
    entity_id UUID,
    entity_name TEXT,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    impact_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    actor TEXT DEFAULT 'user' CHECK (actor IN ('user', 'ai', 'system'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_timeline_user ON operational_timeline(user_id);
CREATE INDEX IF NOT EXISTS idx_timeline_entity ON operational_timeline(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_timeline_created_at ON operational_timeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_action_type ON operational_timeline(action_type);

-- Enable RLS
ALTER TABLE operational_timeline ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own timeline"
    ON operational_timeline FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert to their timeline"
    ON operational_timeline FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. PENDING ACTIONS
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can manage their pending actions" ON pending_actions;

-- Drop table to recreate (comment this if you want to keep data)
-- DROP TABLE IF EXISTS pending_actions CASCADE;

CREATE TABLE IF NOT EXISTS pending_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users NOT NULL,
    action_type TEXT NOT NULL,
    action_label TEXT NOT NULL,
    preview_data JSONB NOT NULL,
    impact_summary JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    confirmed_at TIMESTAMPTZ,
    result JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pending_user ON pending_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_status ON pending_actions(status);
CREATE INDEX IF NOT EXISTS idx_pending_expires ON pending_actions(expires_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE pending_actions ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can manage their pending actions"
    ON pending_actions FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- 3. HELPER FUNCTIONS
-- ============================================

-- Drop existing functions
DROP FUNCTION IF EXISTS expire_old_pending_actions() CASCADE;
DROP FUNCTION IF EXISTS log_timeline_event(UUID, TEXT, TEXT, UUID, TEXT, TEXT, JSONB, TEXT, TEXT) CASCADE;

-- Function to expire old pending actions
CREATE OR REPLACE FUNCTION expire_old_pending_actions()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE pending_actions
    SET status = 'expired'
    WHERE status = 'pending'
      AND expires_at < NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_expire_pending_actions ON pending_actions;

-- Create trigger
CREATE TRIGGER trigger_expire_pending_actions
    AFTER INSERT ON pending_actions
    EXECUTE FUNCTION expire_old_pending_actions();

-- Function to log timeline events
CREATE OR REPLACE FUNCTION log_timeline_event(
    p_user_id UUID,
    p_action_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_entity_name TEXT,
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}',
    p_impact_summary TEXT DEFAULT NULL,
    p_actor TEXT DEFAULT 'user'
)
RETURNS UUID AS $$
DECLARE
    v_timeline_id UUID;
BEGIN
    INSERT INTO operational_timeline (
        user_id,
        action_type,
        entity_type,
        entity_id,
        entity_name,
        description,
        metadata,
        impact_summary,
        actor
    ) VALUES (
        p_user_id,
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_entity_name,
        p_description,
        p_metadata,
        p_impact_summary,
        p_actor
    ) RETURNING id INTO v_timeline_id;
    
    RETURN v_timeline_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. VIEWS
-- ============================================

-- Drop existing view
DROP VIEW IF EXISTS timeline_with_details;

-- Create view
CREATE OR REPLACE VIEW timeline_with_details AS
SELECT 
    t.*,
    CASE 
        WHEN t.entity_type = 'recipe' THEN (SELECT name FROM recipes WHERE id = t.entity_id)
        WHEN t.entity_type = 'ingredient' THEN (SELECT name FROM ingredients WHERE id = t.entity_id)
        ELSE t.entity_name
    END AS current_entity_name,
    EXTRACT(EPOCH FROM (NOW() - t.created_at)) AS seconds_ago
FROM operational_timeline t
ORDER BY t.created_at DESC;

-- Grant access
GRANT SELECT ON timeline_with_details TO authenticated;

-- ============================================
-- ✅ MIGRATION COMPLETE - SAFE TO RERUN
-- ============================================
