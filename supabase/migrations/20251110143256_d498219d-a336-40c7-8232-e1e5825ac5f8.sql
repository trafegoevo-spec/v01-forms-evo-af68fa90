-- Remove a constraint antiga do input_type
ALTER TABLE public.form_questions 
DROP CONSTRAINT IF EXISTS form_questions_input_type_check;

-- Adiciona nova constraint permitindo 'password'
ALTER TABLE public.form_questions 
ADD CONSTRAINT form_questions_input_type_check 
CHECK (input_type IN ('text', 'select', 'password'));