-- Migration: Ensure ALL existing users have full permissions
-- This migration ensures backward compatibility - all existing users get full access
-- This is idempotent and safe to run multiple times

-- ============================================
-- 1. Ensure ALL business owners have business_users records with NULL permissions (full access)
-- ============================================
INSERT INTO business_users (business_id, user_id, role, permissions, status, joined_at, created_at, updated_at)
SELECT 
    b.id AS business_id,
    b.owner_id AS user_id,
    'owner' AS role,
    NULL AS permissions, -- NULL = full access (permissive by default)
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
-- 2. Reset ALL existing business_users permissions to NULL (full access)
-- ============================================
-- This ensures all existing users have full permissions for seamless experience
-- Only reset if permissions are NOT NULL (meaning they were explicitly set)
-- This preserves the permissive-by-default philosophy
-- IMPORTANT: This fixes the issue where existing users get permission errors
UPDATE business_users
SET permissions = NULL
WHERE permissions IS NOT NULL
  AND permissions != 'null'::jsonb
  AND status = 'active';

-- Also ensure any users with empty JSONB objects get NULL (full access)
UPDATE business_users
SET permissions = NULL
WHERE permissions = '{}'::jsonb
  AND status = 'active';

-- ============================================
-- 3. Ensure all business_users have proper status
-- ============================================
UPDATE business_users
SET status = 'active'
WHERE status IS NULL
  AND role = 'owner';

-- ============================================
-- 4. Verify migration
-- ============================================
DO $$
DECLARE
    total_business_users INTEGER;
    null_permissions_count INTEGER;
    non_null_permissions_count INTEGER;
    owner_count INTEGER;
    business_count INTEGER;
BEGIN
    -- Count total business_users
    SELECT COUNT(*) INTO total_business_users FROM business_users WHERE status = 'active';
    
    -- Count with NULL permissions (full access)
    SELECT COUNT(*) INTO null_permissions_count 
    FROM business_users 
    WHERE permissions IS NULL AND status = 'active';
    
    -- Count with non-NULL permissions (restricted)
    SELECT COUNT(*) INTO non_null_permissions_count 
    FROM business_users 
    WHERE permissions IS NOT NULL 
      AND permissions != 'null'::jsonb
      AND status = 'active';
    
    -- Count owners
    SELECT COUNT(*) INTO owner_count 
    FROM business_users 
    WHERE role = 'owner' AND status = 'active';
    
    -- Count businesses
    SELECT COUNT(*) INTO business_count 
    FROM businesses 
    WHERE status = 'active';
    
    -- Report status
    RAISE NOTICE '=== Full Permissions Migration Report ===';
    RAISE NOTICE 'Total active business_users: %', total_business_users;
    RAISE NOTICE 'Users with full access (NULL permissions): %', null_permissions_count;
    RAISE NOTICE 'Users with restricted permissions: %', non_null_permissions_count;
    RAISE NOTICE 'Owner records: %', owner_count;
    RAISE NOTICE 'Active businesses: %', business_count;
    
    -- Verify all owners have NULL permissions
    IF EXISTS (
        SELECT 1 FROM business_users 
        WHERE role = 'owner' 
          AND status = 'active'
          AND permissions IS NOT NULL
          AND permissions != 'null'::jsonb
    ) THEN
        RAISE WARNING 'Some owners still have non-NULL permissions. This should not happen.';
    ELSE
        RAISE NOTICE '✓ All owners have full access (NULL permissions)';
    END IF;
    
    -- Verify all businesses have owner records
    IF business_count > owner_count THEN
        RAISE WARNING 'Some businesses may be missing owner business_users records. Expected: %, Found: %', 
            business_count, owner_count;
    ELSE
        RAISE NOTICE '✓ All businesses have owner business_users records';
    END IF;
    
    RAISE NOTICE '=== Migration Complete ===';
    RAISE NOTICE 'All existing users now have full permissions for seamless experience';
END $$;

-- ============================================
-- 5. Add helpful comment
-- ============================================
COMMENT ON COLUMN business_users.permissions IS 
    'Custom permission overrides. NULL = full access (all role permissions). {"permission": false} = deny specific permission. All existing users default to NULL (full access) for seamless experience.';

