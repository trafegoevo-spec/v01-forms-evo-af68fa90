-- Adiciona coluna para valor padrão de campos ocultos
ALTER TABLE public.form_questions
ADD COLUMN default_value TEXT;