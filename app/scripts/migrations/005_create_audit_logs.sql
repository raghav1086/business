-- Migration: Create audit_logs table
-- This table tracks all permission and role changes for audit purposes

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    user_id UUID, -- User who performed the action
    target_user_id UUID, -- User whose permissions were changed
    action VARCHAR(100) NOT NULL, -- 'user:assign', 'user:remove', 'permission:update', 'role:update'
    resource VARCHAR(100), -- 'business_user', 'permission', etc.
    resource_id UUID, -- ID of the resource
    old_value JSONB, -- Previous state
    new_value JSONB, -- New state
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON audit_logs(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON audit_logs(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Add comment
COMMENT ON TABLE audit_logs IS 'Audit trail for all permission and role changes';
COMMENT ON COLUMN audit_logs.action IS 'Action performed: user:assign, user:remove, permission:update, role:update';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN audit_logs.target_user_id IS 'User whose permissions/role were changed';

