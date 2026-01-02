-- Migration: Migrate existing business owners to business_users table
-- This ensures all existing businesses have their owners in the business_users table
-- This migration is idempotent and safe to run multiple times

-- Insert business_user records for existing business owners
-- Only insert if not already exists (idempotent)
-- permissions = NULL means full access (permissive by default)
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
    WHERE bu.business_id = b.id AND bu.user_id = b.owner_id
  )
ON CONFLICT (business_id, user_id) DO NOTHING;

-- Verify migration
DO $$
DECLARE
    owner_count INTEGER;
    business_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO business_count FROM businesses;
    SELECT COUNT(*) INTO owner_count FROM business_users WHERE role = 'owner';
    
    IF owner_count < business_count THEN
        RAISE WARNING 'Migration incomplete: % businesses but only % owners migrated', business_count, owner_count;
    ELSE
        RAISE NOTICE 'Migration complete: % businesses, % owners migrated', business_count, owner_count;
    END IF;
END $$;

