-- Drop the old check constraint
ALTER TABLE public.form_questions DROP CONSTRAINT IF EXISTS form_questions_input_type_check;

-- Add new check constraint that includes 'buttons'
ALTER TABLE public.form_questions ADD CONSTRAINT form_questions_input_type_check 
CHECK (input_type IN ('text', 'select', 'password', 'buttons'));