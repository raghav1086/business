-- Migration: Add is_superadmin column to users table
-- This column identifies superadmin users who have system-wide access
-- This migration is safe for existing users - all existing users get is_superadmin = FALSE

-- Add is_superadmin column to users table with default FALSE
-- This ensures all existing users automatically get FALSE (not superadmin)
-- Note: This migration should run on auth_db (where users table exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_superadmin BOOLEAN DEFAULT FALSE;

-- Update any NULL values to FALSE (safety check)
UPDATE users SET is_superadmin = FALSE WHERE is_superadmin IS NULL;

-- Ensure column is NOT NULL with default (for new rows)
DO $$
BEGIN
    -- Check if column exists and is nullable
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'is_superadmin'
        AND is_nullable = 'YES'
    ) THEN
        -- Set default for any remaining NULLs
        UPDATE users SET is_superadmin = FALSE WHERE is_superadmin IS NULL;
        
        -- Make column NOT NULL with default
        ALTER TABLE users 
        ALTER COLUMN is_superadmin SET NOT NULL,
        ALTER COLUMN is_superadmin SET DEFAULT FALSE;
        
        RAISE NOTICE 'Updated is_superadmin column to NOT NULL with DEFAULT FALSE';
    ELSE
        RAISE NOTICE 'is_superadmin column already has NOT NULL constraint';
    END IF;
END $$;

-- Create index for superadmin queries
CREATE INDEX IF NOT EXISTS idx_users_superadmin ON users(is_superadmin) WHERE is_superadmin = TRUE;

-- Add comment
COMMENT ON COLUMN users.is_superadmin IS 'Indicates if user is superadmin with system-wide access. Default: FALSE. All existing users default to FALSE.';
