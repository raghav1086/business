-- Cleanup Script: Remove Old Mock Data
-- This removes all data created with the mock business ID
-- Run this script on each database
-- 
-- Usage:
--   psql -U postgres -d party_db -f cleanup-mock-data.sql
--   psql -U postgres -d inventory_db -f cleanup-mock-data.sql
--   psql -U postgres -d invoice_db -f cleanup-mock-data.sql
--   psql -U postgres -d payment_db -f cleanup-mock-data.sql

-- Mock Business ID that was used before proper authentication
\set MOCK_BUSINESS_ID '00000000-0000-0000-0000-000000000001'

-- Party Database
\c party_db;
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM parties WHERE business_id = :'MOCK_BUSINESS_ID';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % parties from party_db', deleted_count;
END $$;

-- Inventory Database
\c inventory_db;
DO $$
DECLARE
    deleted_items INTEGER;
    deleted_adjustments INTEGER;
BEGIN
    DELETE FROM stock_adjustments WHERE business_id = :'MOCK_BUSINESS_ID';
    GET DIAGNOSTICS deleted_adjustments = ROW_COUNT;
    
    DELETE FROM items WHERE business_id = :'MOCK_BUSINESS_ID';
    GET DIAGNOSTICS deleted_items = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % items and % stock adjustments from inventory_db', deleted_items, deleted_adjustments;
END $$;

-- Invoice Database
\c invoice_db;
DO $$
DECLARE
    deleted_invoices INTEGER;
    deleted_items INTEGER;
BEGIN
    -- Delete invoice items first (foreign key constraint)
    DELETE FROM invoice_items 
    WHERE invoice_id IN (
        SELECT id FROM invoices WHERE business_id = :'MOCK_BUSINESS_ID'
    );
    GET DIAGNOSTICS deleted_items = ROW_COUNT;
    
    -- Then delete invoices
    DELETE FROM invoices WHERE business_id = :'MOCK_BUSINESS_ID';
    GET DIAGNOSTICS deleted_invoices = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % invoices and % invoice items from invoice_db', deleted_invoices, deleted_items;
END $$;

-- Payment Database
\c payment_db;
DO $$
DECLARE
    deleted_transactions INTEGER;
BEGIN
    DELETE FROM transactions WHERE business_id = :'MOCK_BUSINESS_ID';
    GET DIAGNOSTICS deleted_transactions = ROW_COUNT;
    RAISE NOTICE 'Deleted % transactions from payment_db', deleted_transactions;
END $$;

-- Summary
\c postgres;
SELECT 'Cleanup complete! All mock data has been removed.' AS message;

