-- Add required field to form_questions
ALTER TABLE public.form_questions 
ADD COLUMN required BOOLEAN NOT NULL DEFAULT true;