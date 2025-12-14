-- Add cover_topics JSONB column for storing topics with icons
ALTER TABLE public.app_settings 
ADD COLUMN cover_topics jsonb DEFAULT '[{"icon": "CheckCircle", "text": "Tópico 1"}, {"icon": "CheckCircle", "text": "Tópico 2"}, {"icon": "CheckCircle", "text": "Tópico 3"}]'::jsonb;