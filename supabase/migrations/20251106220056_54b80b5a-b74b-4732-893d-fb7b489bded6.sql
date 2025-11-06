-- Add location fields to posts table
ALTER TABLE public.posts 
ADD COLUMN location_name text,
ADD COLUMN location_latitude double precision,
ADD COLUMN location_longitude double precision;

-- Add index for location queries
CREATE INDEX idx_posts_location ON public.posts(location_latitude, location_longitude) 
WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.posts.location_name IS 'Human-readable location name';
COMMENT ON COLUMN public.posts.location_latitude IS 'Location latitude coordinate';
COMMENT ON COLUMN public.posts.location_longitude IS 'Location longitude coordinate';