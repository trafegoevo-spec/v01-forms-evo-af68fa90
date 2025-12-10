-- Criar tabela forma_respostas (estrutura do v0)
CREATE TABLE IF NOT EXISTS public.forma_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_id UUID REFERENCES public.entidades(id) ON DELETE SET NULL,
  pergunta_fixa_1 TEXT, -- Nome
  pergunta_fixa_2 BIGINT, -- Telefone (apenas números)
  pergunta_fixa_3 BOOLEAN DEFAULT false, -- Tem email?
  dados_json JSONB DEFAULT '{}'::jsonb,
  versao_formulario TEXT DEFAULT '1.0',
  subdomain TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forma_respostas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Anyone can insert forma_respostas" 
  ON public.forma_respostas 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Only admins can view forma_respostas" 
  ON public.forma_respostas 
  FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update forma_respostas" 
  ON public.forma_respostas 
  FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete forma_respostas" 
  ON public.forma_respostas 
  FOR DELETE 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_forma_respostas_updated_at
  BEFORE UPDATE ON public.forma_respostas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();