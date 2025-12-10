-- Add cover page settings to app_settings
ALTER TABLE public.app_settings
ADD COLUMN cover_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN cover_title TEXT NOT NULL DEFAULT 'Bem-vindo',
ADD COLUMN cover_subtitle TEXT NOT NULL DEFAULT 'Preencha o formulário e entre em contato conosco',
ADD COLUMN cover_cta_text TEXT NOT NULL DEFAULT 'Começar';