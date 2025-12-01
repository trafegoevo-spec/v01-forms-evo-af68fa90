-- Add whatsapp_enabled field to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN whatsapp_enabled boolean NOT NULL DEFAULT true;