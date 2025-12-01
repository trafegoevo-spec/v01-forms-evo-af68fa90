-- Add subdomain column to app_settings
ALTER TABLE public.app_settings 
ADD COLUMN subdomain TEXT NOT NULL DEFAULT 'default';

-- Create unique index on subdomain
CREATE UNIQUE INDEX app_settings_subdomain_idx ON public.app_settings(subdomain);

-- Add subdomain column to form_questions
ALTER TABLE public.form_questions 
ADD COLUMN subdomain TEXT NOT NULL DEFAULT 'default';

-- Create index on subdomain for better query performance
CREATE INDEX form_questions_subdomain_idx ON public.form_questions(subdomain);

-- Update existing data to use 'default' subdomain
UPDATE public.app_settings SET subdomain = 'default' WHERE subdomain IS NULL;
UPDATE public.form_questions SET subdomain = 'default' WHERE subdomain IS NULL;