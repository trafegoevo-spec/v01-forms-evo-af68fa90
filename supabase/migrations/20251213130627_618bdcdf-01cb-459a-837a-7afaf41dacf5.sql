-- Add cover_image_url column to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT NULL;