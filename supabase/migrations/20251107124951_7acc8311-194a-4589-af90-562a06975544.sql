-- Alterar tabela leads para suportar campos dinâmicos
-- Adicionar coluna JSONB para armazenar todos os dados do formulário
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS form_data JSONB DEFAULT '{}'::jsonb;

-- Criar índice para melhor performance em buscas no JSONB
CREATE INDEX IF NOT EXISTS idx_leads_form_data ON public.leads USING gin(form_data);

-- Migrar dados existentes para o formato JSONB
UPDATE public.leads
SET form_data = jsonb_build_object(
  'nome', nome,
  'whatsapp', whatsapp,
  'email', email,
  'escolaridade', escolaridade,
  'modalidade', modalidade
)
WHERE form_data = '{}'::jsonb;

-- Atualizar input_type para ter valor padrão em perguntas existentes
UPDATE public.form_questions
SET input_type = 'text'
WHERE input_type IS NULL;

-- Garantir que input_type sempre tenha valor
ALTER TABLE public.form_questions
ALTER COLUMN input_type SET DEFAULT 'text',
ALTER COLUMN input_type SET NOT NULL;