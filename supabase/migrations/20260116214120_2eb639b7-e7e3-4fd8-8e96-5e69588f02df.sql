-- Add column for WhatsApp on submit option
ALTER TABLE app_settings 
ADD COLUMN IF NOT EXISTS whatsapp_on_submit BOOLEAN DEFAULT false;