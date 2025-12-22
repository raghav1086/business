-- Database initialization script for Business Management System
-- This script runs automatically when PostgreSQL container starts

-- Create databases for each microservice
CREATE DATABASE auth_db;
CREATE DATABASE business_db;
CREATE DATABASE party_db;
CREATE DATABASE inventory_db;
CREATE DATABASE invoice_db;
CREATE DATABASE payment_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE auth_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE business_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE party_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE inventory_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE invoice_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE payment_db TO postgres;

-- Create extensions (optional, for UUID support)
\c auth_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c business_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c party_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c inventory_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c invoice_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\c payment_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
