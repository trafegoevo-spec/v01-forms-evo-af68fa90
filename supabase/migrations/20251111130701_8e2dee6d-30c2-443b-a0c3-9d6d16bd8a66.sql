-- Adiciona coluna para placeholder customizado
ALTER TABLE public.form_questions
ADD COLUMN input_placeholder TEXT;

-- Remove a coluna de valor padrão que não será mais usada
ALTER TABLE public.form_questions
DROP COLUMN IF EXISTS default_value;