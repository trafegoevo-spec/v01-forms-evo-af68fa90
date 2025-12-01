-- Remove the old unique constraint on field_name alone
ALTER TABLE public.form_questions 
DROP CONSTRAINT IF EXISTS form_questions_field_name_key;

-- Add a new composite unique constraint on (field_name, subdomain)
-- This allows different subdomains to have questions with the same field_name
ALTER TABLE public.form_questions 
ADD CONSTRAINT form_questions_field_name_subdomain_key 
UNIQUE (field_name, subdomain);