-- Add input_type column to form_questions table
ALTER TABLE public.form_questions 
ADD COLUMN IF NOT EXISTS input_type text DEFAULT 'text' CHECK (input_type IN ('text', 'select'));