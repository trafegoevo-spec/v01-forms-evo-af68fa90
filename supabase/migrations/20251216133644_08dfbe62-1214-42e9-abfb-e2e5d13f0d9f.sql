-- Create form_analytics table for tracking form events
CREATE TABLE public.form_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  subdomain TEXT NOT NULL DEFAULT 'default',
  event_type TEXT NOT NULL,
  step_reached INTEGER DEFAULT 1,
  partial_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_form_analytics_subdomain ON public.form_analytics(subdomain);
CREATE INDEX idx_form_analytics_event_type ON public.form_analytics(event_type);
CREATE INDEX idx_form_analytics_session_id ON public.form_analytics(session_id);
CREATE INDEX idx_form_analytics_created_at ON public.form_analytics(created_at DESC);

-- Enable RLS
ALTER TABLE public.form_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (for anonymous tracking)
CREATE POLICY "Anyone can insert form_analytics"
ON public.form_analytics
FOR INSERT
WITH CHECK (true);

-- Only admins can view analytics
CREATE POLICY "Only admins can view form_analytics"
ON public.form_analytics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can update their own session (for sendBeacon updates)
CREATE POLICY "Anyone can update form_analytics by session"
ON public.form_analytics
FOR UPDATE
USING (true);

-- Only admins can delete
CREATE POLICY "Only admins can delete form_analytics"
ON public.form_analytics
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));