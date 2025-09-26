-- Initialize Book Management Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create database if it doesn't exist (handled by POSTGRES_DB env var)
-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'UTC';

-- Create a read-only user for monitoring (optional)
-- CREATE USER book_management_readonly WITH PASSWORD 'readonly_password';
-- GRANT CONNECT ON DATABASE book_management TO book_management_readonly;
-- GRANT USAGE ON SCHEMA public TO book_management_readonly;
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO book_management_readonly;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO book_management_readonly;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'Book Management Database initialized successfully!';
    RAISE NOTICE 'Database: %', current_database();
    RAISE NOTICE 'User: %', current_user;
    RAISE NOTICE 'Timezone: %', current_setting('timezone');
END $$;
