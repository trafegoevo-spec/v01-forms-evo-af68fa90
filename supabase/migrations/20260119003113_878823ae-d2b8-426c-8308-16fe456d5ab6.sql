-- Add new columns to crm_integrations for exclusive mode
ALTER TABLE crm_integrations
ADD COLUMN IF NOT EXISTS exclusive_mode boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS origem text DEFAULT 'formulario-lovable',
ADD COLUMN IF NOT EXISTS campanha text,
ADD COLUMN IF NOT EXISTS include_utm_params boolean DEFAULT true;