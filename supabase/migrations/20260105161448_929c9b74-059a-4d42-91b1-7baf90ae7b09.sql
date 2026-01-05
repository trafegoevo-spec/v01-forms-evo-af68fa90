-- Add background gradient customization fields to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS bg_gradient_from TEXT DEFAULT '#f0f9ff',
ADD COLUMN IF NOT EXISTS bg_gradient_via TEXT DEFAULT '#ffffff',
ADD COLUMN IF NOT EXISTS bg_gradient_to TEXT DEFAULT '#faf5ff',
ADD COLUMN IF NOT EXISTS bg_gradient_direction TEXT DEFAULT 'to-br';