-- Create CRM integrations table
CREATE TABLE public.crm_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subdomain TEXT NOT NULL,
  crm_name TEXT DEFAULT 'CRM',
  webhook_url TEXT NOT NULL,
  bearer_token TEXT,
  manager_id TEXT,
  slug TEXT,
  is_active BOOLEAN DEFAULT true,
  include_dynamic_fields BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(subdomain)
);

-- Enable RLS
ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view crm_integrations"
ON public.crm_integrations FOR SELECT
USING (true);

CREATE POLICY "Admins can insert crm_integrations"
ON public.crm_integrations FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update crm_integrations"
ON public.crm_integrations FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete crm_integrations"
ON public.crm_integrations FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_crm_integrations_updated_at
BEFORE UPDATE ON public.crm_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();