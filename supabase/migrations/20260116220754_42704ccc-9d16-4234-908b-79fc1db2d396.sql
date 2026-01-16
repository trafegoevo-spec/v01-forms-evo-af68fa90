-- =====================================================
-- CORREÇÃO DE SEGURANÇA: app_settings
-- Remover acesso público, permitir apenas admins
-- =====================================================

-- 1. Remover policy pública perigosa
DROP POLICY IF EXISTS "Anyone can view app settings" ON public.app_settings;

-- 2. Criar policy segura: apenas admins podem ler
CREATE POLICY "Only admins can view app settings"
ON public.app_settings
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Também aplicar mesma correção para whatsapp_queue (dados sensíveis)
DROP POLICY IF EXISTS "Anyone can view whatsapp_queue" ON public.whatsapp_queue;

CREATE POLICY "Only admins can view whatsapp_queue"
ON public.whatsapp_queue
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Também corrigir crm_integrations (contém webhook_url e bearer_token!)
DROP POLICY IF EXISTS "Anyone can view crm_integrations" ON public.crm_integrations;

CREATE POLICY "Only admins can view crm_integrations"
ON public.crm_integrations
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));