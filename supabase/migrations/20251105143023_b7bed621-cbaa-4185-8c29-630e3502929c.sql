-- Make storage buckets private for security
-- This ensures files are only accessible via signed URLs with proper authentication

-- Update videos bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'videos';

-- Update group-media bucket to private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'group-media';