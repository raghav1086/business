-- Migration: Verify and fix migrations for existing users
-- This migration ensures backward compatibility and smooth migration
-- It's idempotent and safe to run multiple times

-- ============================================
-- 1. Ensure all existing users have is_superadmin = FALSE if NULL
-- ============================================
UPDATE users 
SET is_superadmin = FALSE 
WHERE is_superadmin IS NULL;

-- Add NOT NULL constraint if column exists and is nullable
DO $$
BEGIN
    -- Check if column exists and is nullable
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
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

-- ============================================
-- 2. Ensure all existing business owners have business_users records
-- ============================================
-- This is a safety check - migration 003 should have handled this, but this ensures completeness
INSERT INTO business_users (business_id, user_id, role, status, joined_at, created_at, updated_at)
SELECT 
    b.id AS business_id,
    b.owner_id AS user_id,
    'owner' AS role,
    'active' AS status,
    COALESCE(b.created_at, NOW()) AS joined_at,
    COALESCE(b.created_at, NOW()) AS created_at,
    COALESCE(b.updated_at, NOW()) AS updated_at
FROM businesses b
WHERE b.owner_id IS NOT NULL
  AND b.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM business_users bu 
    WHERE bu.business_id = b.id 
      AND bu.user_id = b.owner_id
  )
ON CONFLICT (business_id, user_id) DO NOTHING;

-- ============================================
-- 3. Ensure all business_users have proper defaults
-- ============================================
-- Set permissions to NULL (full access) if not set for owners
UPDATE business_users
SET permissions = NULL
WHERE role = 'owner' 
  AND permissions IS NOT NULL
  AND permissions != 'null'::jsonb;

-- Ensure status is 'active' for existing owners
UPDATE business_users
SET status = 'active'
WHERE role = 'owner' 
  AND status IS NULL;

-- ============================================
-- 4. Verify migration integrity
-- ============================================
DO $$
DECLARE
    user_count INTEGER;
    superadmin_count INTEGER;
    business_count INTEGER;
    owner_business_user_count INTEGER;
    null_permissions_count INTEGER;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO user_count FROM users WHERE status = 'active';
    
    -- Count superadmins
    SELECT COUNT(*) INTO superadmin_count FROM users WHERE is_superadmin = TRUE;
    
    -- Count businesses
    SELECT COUNT(*) INTO business_count FROM businesses WHERE status = 'active';
    
    -- Count business_users with owner role
    SELECT COUNT(*) INTO owner_business_user_count 
    FROM business_users 
    WHERE role = 'owner' AND status = 'active';
    
    -- Count business_users with NULL permissions (full access)
    SELECT COUNT(*) INTO null_permissions_count 
    FROM business_users 
    WHERE permissions IS NULL;
    
    -- Report status
    RAISE NOTICE '=== Migration Verification Report ===';
    RAISE NOTICE 'Total active users: %', user_count;
    RAISE NOTICE 'Superadmin users: %', superadmin_count;
    RAISE NOTICE 'Active businesses: %', business_count;
    RAISE NOTICE 'Owner business_users records: %', owner_business_user_count;
    RAISE NOTICE 'Business_users with full access (NULL permissions): %', null_permissions_count;
    
    -- Verify all businesses have owner records
    IF business_count > owner_business_user_count THEN
        RAISE WARNING 'Some businesses may be missing owner business_users records. Expected: %, Found: %', 
            business_count, owner_business_user_count;
    ELSE
        RAISE NOTICE '✓ All businesses have owner business_users records';
    END IF;
    
    -- Verify all users have is_superadmin set
    IF EXISTS (SELECT 1 FROM users WHERE is_superadmin IS NULL) THEN
        RAISE WARNING 'Some users have NULL is_superadmin. This should not happen.';
    ELSE
        RAISE NOTICE '✓ All users have is_superadmin set';
    END IF;
    
    RAISE NOTICE '=== Migration Verification Complete ===';
END $$;

-- ============================================
-- 5. Add helpful comments
-- ============================================
COMMENT ON COLUMN users.is_superadmin IS 
    'Indicates if user is superadmin with system-wide access. Default: FALSE. All existing users default to FALSE.';

COMMENT ON TABLE business_users IS 
    'Manages user assignments to businesses with roles and permissions. Existing business owners are automatically migrated with full access (permissions = NULL).';

