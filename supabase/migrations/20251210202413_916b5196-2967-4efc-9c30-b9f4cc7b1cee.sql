-- Tabela para armazenar os números da fila de WhatsApp
CREATE TABLE public.whatsapp_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT NOT NULL DEFAULT 'default',
  phone_number TEXT NOT NULL,
  display_name TEXT,
  position INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subdomain, position)
);

-- Tabela para rastrear a posição atual na fila
CREATE TABLE public.whatsapp_queue_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT NOT NULL UNIQUE,
  current_position INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_queue_state ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_queue
CREATE POLICY "Anyone can view whatsapp_queue" ON public.whatsapp_queue
FOR SELECT USING (true);

CREATE POLICY "Admins can insert whatsapp_queue" ON public.whatsapp_queue
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update whatsapp_queue" ON public.whatsapp_queue
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete whatsapp_queue" ON public.whatsapp_queue
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Policies para whatsapp_queue_state
CREATE POLICY "Anyone can view whatsapp_queue_state" ON public.whatsapp_queue_state
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert whatsapp_queue_state" ON public.whatsapp_queue_state
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update whatsapp_queue_state" ON public.whatsapp_queue_state
FOR UPDATE USING (true);