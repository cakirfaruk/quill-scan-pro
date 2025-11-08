-- Fix security warning: Move pg_net extension to extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop from public and create in extensions schema
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage on extensions schema
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;

-- Grant execute on pg_net functions to necessary roles
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extensions TO postgres, anon, authenticated, service_role;