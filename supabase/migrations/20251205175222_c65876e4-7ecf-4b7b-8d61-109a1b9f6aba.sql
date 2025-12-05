-- Adicionar campos condicionais na tabela form_questions
ALTER TABLE public.form_questions
ADD COLUMN IF NOT EXISTS conditional_logic jsonb DEFAULT NULL;

-- Criar tabela para páginas de sucesso personalizadas
CREATE TABLE IF NOT EXISTS public.success_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain text NOT NULL DEFAULT 'default',
  page_key text NOT NULL,
  title text NOT NULL DEFAULT 'Obrigado',
  subtitle text NOT NULL DEFAULT 'Em breve entraremos em contato.',
  description text NOT NULL DEFAULT 'Recebemos suas informações com sucesso!',
  whatsapp_enabled boolean NOT NULL DEFAULT true,
  whatsapp_number text NOT NULL DEFAULT '5531989236061',
  whatsapp_message text NOT NULL DEFAULT 'Olá! Acabei de enviar meus dados no formulário.',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(subdomain, page_key)
);

-- Enable RLS
ALTER TABLE public.success_pages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view success pages"
ON public.success_pages FOR SELECT
USING (true);

CREATE POLICY "Admins can insert success pages"
ON public.success_pages FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update success pages"
ON public.success_pages FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete success pages"
ON public.success_pages FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para updated_at
CREATE TRIGGER update_success_pages_updated_at
BEFORE UPDATE ON public.success_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentário explicando a estrutura do conditional_logic:
-- {
--   "conditions": [
--     {
--       "value": "Sim",
--       "action": "skip_to_step",
--       "target_step": 5
--     },
--     {
--       "value": "Não", 
--       "action": "success_page",
--       "target_page": "negativa"
--     }
--   ]
-- }