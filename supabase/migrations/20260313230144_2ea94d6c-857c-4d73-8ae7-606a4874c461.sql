CREATE TABLE notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain text NOT NULL UNIQUE,
  
  -- Email SMTP
  email_enabled boolean DEFAULT false,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_user text,
  smtp_pass text,
  smtp_from text,
  email_recipients text,
  
  -- WhatsApp Evolution API
  whatsapp_notify_enabled boolean DEFAULT false,
  evolution_api_url text,
  evolution_api_key text,
  evolution_instance text,
  whatsapp_notify_numbers text,
  
  -- Slack
  slack_enabled boolean DEFAULT false,
  slack_webhook_url text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select notification_settings" ON notification_settings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert notification_settings" ON notification_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update notification_settings" ON notification_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete notification_settings" ON notification_settings FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));