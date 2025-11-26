-- Criar tabela separada para leads do Autoprotecta
CREATE TABLE public.leads_autoprotecta (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.leads_autoprotecta ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (mesmo padrão da tabela leads)
CREATE POLICY "Permitir inserção de leads autoprotecta para todos" 
ON public.leads_autoprotecta 
FOR INSERT 
WITH CHECK (true);

-- Política para admins visualizarem
CREATE POLICY "Only admins can view leads autoprotecta" 
ON public.leads_autoprotecta 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));