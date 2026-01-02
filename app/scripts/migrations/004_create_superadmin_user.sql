-- Migration: Create superadmin user
-- Superadmin phone: 9175760649, OTP: 760649 (last 6 digits)

-- Insert superadmin user if doesn't exist
INSERT INTO users (
    phone,
    is_superadmin,
    user_type,
    phone_verified,
    status,
    language_preference,
    created_at,
    updated_at
)
VALUES (
    '9175760649',
    TRUE,
    'superadmin',
    TRUE,
    'active',
    'en',
    NOW(),
    NOW()
)
ON CONFLICT (phone) DO UPDATE 
SET 
    is_superadmin = TRUE,
    user_type = 'superadmin',
    phone_verified = TRUE,
    status = 'active',
    updated_at = NOW();

-- Verify superadmin creation
DO $$
DECLARE
    superadmin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO superadmin_count FROM users WHERE is_superadmin = TRUE AND phone = '9175760649';
    
    IF superadmin_count = 0 THEN
        RAISE WARNING 'Superadmin user not created';
    ELSE
        RAISE NOTICE 'Superadmin user created/verified: phone 9175760649';
    END IF;
END $$;

