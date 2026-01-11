-- Migration: Add passcode_hash to users table
-- Description: Adds passcode_hash column to store hashed custom passcodes.
--              NULL means using default (last 6 digits of phone number).
-- Date: 2024-01-XX

-- Add passcode_hash column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS passcode_hash VARCHAR(255) NULL;

-- Add comment
COMMENT ON COLUMN users.passcode_hash IS 'Hashed custom passcode. NULL means using default (last 6 digits of phone)';

-- Verify the column was added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'passcode_hash'
    ) THEN
        RAISE EXCEPTION 'Column passcode_hash was not added successfully';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Migration 009 completed: passcode_hash column added to users table';
END $$;

