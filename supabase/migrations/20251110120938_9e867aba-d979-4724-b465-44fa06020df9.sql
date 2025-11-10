-- Fix leads table RLS policy to restrict access to admins only
DROP POLICY IF EXISTS "Apenas usuários autenticados podem ver leads" ON public.leads;

CREATE POLICY "Only admins can view leads"
ON public.leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));