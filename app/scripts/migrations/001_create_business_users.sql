-- Migration: Create business_users table
-- This table manages the many-to-many relationship between users and businesses
-- with role-based access control

-- Create business_users table
CREATE TABLE IF NOT EXISTS business_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Reference to users table (cross-service)
    
    -- Role and Permissions
    role VARCHAR(50) NOT NULL, -- 'owner', 'admin', 'employee', 'accountant', 'salesman', 'viewer'
    permissions JSONB DEFAULT NULL, -- NULL = use all role permissions, {"permission": false} = deny
    
    -- Status and Lifecycle
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'invited', 'suspended', 'removed'
    invited_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID, -- User who invited (reference to users.id)
    removed_at TIMESTAMP WITH TIME ZONE,
    removed_by UUID, -- User who removed (reference to users.id)
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(business_id, user_id),
    CHECK (status IN ('active', 'invited', 'suspended', 'removed'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_users_business ON business_users(business_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_business_users_role ON business_users(role);
CREATE INDEX IF NOT EXISTS idx_business_users_status ON business_users(status);

-- Composite index for common query: Get user's active businesses
CREATE INDEX IF NOT EXISTS idx_business_users_user_status ON business_users(user_id, status) WHERE status = 'active';

-- GIN index for JSONB permissions queries
CREATE INDEX IF NOT EXISTS idx_business_users_permissions ON business_users USING GIN (permissions);

-- Add comment
COMMENT ON TABLE business_users IS 'Manages user assignments to businesses with roles and permissions';
COMMENT ON COLUMN business_users.permissions IS 'JSONB with denied permissions. NULL means use all role permissions (full access)';
COMMENT ON COLUMN business_users.status IS 'active: user can access, invited: pending, suspended: temporarily disabled, removed: permanently removed';

