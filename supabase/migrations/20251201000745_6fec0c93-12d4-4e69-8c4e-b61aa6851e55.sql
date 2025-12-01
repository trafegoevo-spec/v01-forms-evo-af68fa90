-- Add form_name and webhook_url fields to app_settings table
ALTER TABLE public.app_settings 
ADD COLUMN IF NOT EXISTS form_name TEXT NOT NULL DEFAULT 'default',
ADD COLUMN IF NOT EXISTS webhook_url TEXT;