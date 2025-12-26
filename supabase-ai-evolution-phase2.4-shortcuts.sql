-- Phase 2.4: Dynamic Shortcuts - User Action Tracking
-- This script creates tables and functions to track user actions and generate smart shortcuts

-- Drop existing objects if they exist (for safe re-execution)
DROP VIEW IF EXISTS top_user_actions CASCADE;
DROP TABLE IF EXISTS user_action_stats CASCADE;

-- Create user_action_stats table
CREATE TABLE user_action_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_type TEXT NOT NULL,
    action_label TEXT NOT NULL,
    action_data JSONB DEFAULT '{}'::jsonb,
    count INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_action_stats_user_id ON user_action_stats(user_id);
CREATE INDEX idx_user_action_stats_count ON user_action_stats(count DESC);
CREATE INDEX idx_user_action_stats_last_used ON user_action_stats(last_used DESC);
CREATE INDEX idx_user_action_stats_action_type ON user_action_stats(action_type);

-- Create view for top user actions
CREATE VIEW top_user_actions AS
SELECT 
    user_id,
    action_type,
    action_label,
    action_data,
    count,
    last_used,
    created_at
FROM user_action_stats
ORDER BY count DESC, last_used DESC;

-- Function to track or increment action usage
CREATE OR REPLACE FUNCTION track_user_action(
    p_user_id UUID,
    p_action_type TEXT,
    p_action_label TEXT,
    p_action_data JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_stat_id UUID;
BEGIN
    -- Try to find existing action
    SELECT id INTO v_stat_id
    FROM user_action_stats
    WHERE user_id = p_user_id
      AND action_type = p_action_type
      AND action_label = p_action_label;
    
    IF FOUND THEN
        -- Increment existing action
        UPDATE user_action_stats
        SET count = count + 1,
            last_used = NOW(),
            action_data = p_action_data
        WHERE id = v_stat_id;
    ELSE
        -- Insert new action
        INSERT INTO user_action_stats (
            user_id,
            action_type,
            action_label,
            action_data
        ) VALUES (
            p_user_id,
            p_action_type,
            p_action_label,
            p_action_data
        ) RETURNING id INTO v_stat_id;
    END IF;
    
    RETURN v_stat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top actions for a user
CREATE OR REPLACE FUNCTION get_top_user_actions(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 5
) RETURNS TABLE (
    id UUID,
    action_type TEXT,
    action_label TEXT,
    action_data JSONB,
    count INTEGER,
    last_used TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uas.id,
        uas.action_type,
        uas.action_label,
        uas.action_data,
        uas.count,
        uas.last_used
    FROM user_action_stats uas
    WHERE uas.user_id = p_user_id
    ORDER BY uas.count DESC, uas.last_used DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE user_action_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own action stats"
    ON user_action_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own action stats"
    ON user_action_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own action stats"
    ON user_action_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON user_action_stats TO authenticated;
GRANT INSERT ON user_action_stats TO authenticated;
GRANT UPDATE ON user_action_stats TO authenticated;
GRANT SELECT ON top_user_actions TO authenticated;

-- Comments
COMMENT ON TABLE user_action_stats IS 'Tracks user actions for generating smart shortcuts';
COMMENT ON FUNCTION track_user_action IS 'Tracks or increments usage count for a user action';
COMMENT ON FUNCTION get_top_user_actions IS 'Returns the most frequently used actions for a user';

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE 'Phase 2.4 - Dynamic Shortcuts tables created successfully!';
END $$;
