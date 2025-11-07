-- Create form_questions table for admin to edit
CREATE TABLE IF NOT EXISTS public.form_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step INTEGER NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  field_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read, only admins can write
CREATE POLICY "Anyone can view form questions"
  ON public.form_questions FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert form questions"
  ON public.form_questions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update form questions"
  ON public.form_questions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete form questions"
  ON public.form_questions FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_form_questions_updated_at ON public.form_questions;
CREATE TRIGGER update_form_questions_updated_at
  BEFORE UPDATE ON public.form_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default questions
INSERT INTO public.form_questions (step, question, options, field_name) VALUES
  (1, 'Qual é o seu nome completo?', '[]'::jsonb, 'nome'),
  (2, 'Qual é o melhor número de WhatsApp para contato?', '[]'::jsonb, 'whatsapp'),
  (3, 'Qual é o seu e-mail?', '[]'::jsonb, 'email'),
  (4, 'Qual modalidade de ensino você tem interesse?', '["Presencial", "EAD", "Semipresencial"]'::jsonb, 'modalidade'),
  (5, 'Qual é o seu nível de escolaridade atual?', '["Ensino Fundamental Incompleto", "Ensino Fundamental Completo", "Ensino Médio Incompleto", "Ensino Médio Completo", "Ensino Superior Incompleto", "Ensino Superior Completo", "Pós-Graduação"]'::jsonb, 'escolaridade')
ON CONFLICT (field_name) DO NOTHING;