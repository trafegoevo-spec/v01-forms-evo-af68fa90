-- Create table for app settings
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  whatsapp_number text NOT NULL DEFAULT '5531989236061',
  whatsapp_message text NOT NULL DEFAULT 'Olá! Acabei de enviar meus dados no formulário.',
  success_title text NOT NULL DEFAULT 'Obrigado',
  success_description text NOT NULL DEFAULT 'Recebemos suas informações com sucesso!',
  success_subtitle text NOT NULL DEFAULT 'Em breve entraremos em contato.',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view app settings" 
ON public.app_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can update app settings" 
ON public.app_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert app settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings (only one row)
INSERT INTO public.app_settings (whatsapp_number, whatsapp_message, success_title, success_description, success_subtitle)
VALUES ('5531989236061', 'Olá! Acabei de enviar meus dados no formulário.', 'Obrigado', 'Recebemos suas informações com sucesso!', 'Em breve entraremos em contato.');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();