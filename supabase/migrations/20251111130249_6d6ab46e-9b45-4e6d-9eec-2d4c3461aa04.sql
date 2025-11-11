-- Adiciona coluna para limite de caracteres
ALTER TABLE public.form_questions
ADD COLUMN max_length INTEGER;