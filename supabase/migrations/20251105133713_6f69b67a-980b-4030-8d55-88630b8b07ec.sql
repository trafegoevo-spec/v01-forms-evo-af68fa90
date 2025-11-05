-- Criar tabela para armazenar leads do formulário
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT NOT NULL,
  escolaridade TEXT NOT NULL,
  modalidade TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção pública (formulário de contato)
CREATE POLICY "Permitir inserção pública de leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

-- Política para leitura apenas autenticada (caso você adicione autenticação no futuro)
CREATE POLICY "Apenas usuários autenticados podem ver leads"
ON public.leads
FOR SELECT
TO authenticated
USING (true);

-- Criar índices para melhor performance
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_email ON public.leads(email);