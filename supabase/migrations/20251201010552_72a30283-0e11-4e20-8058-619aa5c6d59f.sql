-- Add GTM ID field to app_settings
ALTER TABLE public.app_settings
ADD COLUMN gtm_id TEXT DEFAULT 'GTM-PRW9TPH';