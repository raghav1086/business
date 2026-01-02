-- Migration: Fix Production Database Permissions - Grant Full Access to ALL Users
-- This script grants full permissions to ALL existing users in production
-- Safe to run multiple times (idempotent)
-- Run this on: business_db

-- ============================================
-- 1. Ensure ALL business owners have business_users records with NULL permissions
-- ============================================
INSERT INTO business_users (business_id, user_id, role, permissions, status, joined_at, created_at, updated_at)
SELECT 
    b.id AS business_id,
    b.owner_id AS user_id,
    'owner' AS role,
    NULL AS permissions, -- NULL = full access
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
-- 2. Set ALL business_users permissions to NULL (full access)
-- ============================================
-- This is the critical fix - sets all permissions to NULL for seamless experience
UPDATE business_users
SET permissions = NULL
WHERE permissions IS NOT NULL
  AND permissions != 'null'::jsonb
  AND status = 'active';

-- Also set empty JSONB objects to NULL
UPDATE business_users
SET permissions = NULL
WHERE permissions = '{}'::jsonb
  AND status = 'active';

-- ============================================
-- 3. Ensure all owners have NULL permissions
-- ============================================
UPDATE business_users bu
SET permissions = NULL
FROM businesses b
WHERE bu.business_id = b.id
  AND bu.user_id = b.owner_id
  AND bu.role = 'owner'
  AND bu.status = 'active'
  AND b.status = 'active'
  AND (bu.permissions IS NOT NULL AND bu.permissions != 'null'::jsonb);

-- ============================================
-- 4. Verify and report
-- ============================================
DO $$
DECLARE
    total_users INTEGER;
    null_permissions_count INTEGER;
    non_null_permissions_count INTEGER;
    owner_count INTEGER;
    business_count INTEGER;
BEGIN
    -- Count total business_users
    SELECT COUNT(*) INTO total_users FROM business_users WHERE status = 'active';
    
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
    
    -- Report
    RAISE NOTICE '=== Production Permissions Fix Report ===';
    RAISE NOTICE 'Total active business_users: %', total_users;
    RAISE NOTICE 'Users with full access (NULL permissions): %', null_permissions_count;
    RAISE NOTICE 'Users with restricted permissions: %', non_null_permissions_count;
    RAISE NOTICE 'Owner records: %', owner_count;
    RAISE NOTICE 'Active businesses: %', business_count;
    
    IF non_null_permissions_count > 0 THEN
        RAISE WARNING 'Some users still have non-NULL permissions: %', non_null_permissions_count;
    ELSE
        RAISE NOTICE '✓ All users have full access (NULL permissions)';
    END IF;
    
    IF business_count > owner_count THEN
        RAISE WARNING 'Some businesses may be missing owner records. Expected: %, Found: %', 
            business_count, owner_count;
    ELSE
        RAISE NOTICE '✓ All businesses have owner records';
    END IF;
    
    RAISE NOTICE '=== Production Permissions Fix Complete ===';
    RAISE NOTICE 'All existing users now have full permissions for seamless experience';
END $$;

