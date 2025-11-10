-- Remover colunas fixas da tabela leads para torná-la responsiva às mudanças no formulário
ALTER TABLE public.leads 
DROP COLUMN IF EXISTS nome,
DROP COLUMN IF EXISTS whatsapp,
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS escolaridade,
DROP COLUMN IF EXISTS modalidade;

-- Garantir que form_data não seja nulo
ALTER TABLE public.leads 
ALTER COLUMN form_data SET NOT NULL,
ALTER COLUMN form_data SET DEFAULT '{}'::jsonb;

-- Adicionar índice para melhorar performance em buscas no JSON
CREATE INDEX IF NOT EXISTS idx_leads_form_data ON public.leads USING gin (form_data);