-- Drop the existing policy
DROP POLICY IF EXISTS "Permitir inserção pública de leads" ON public.leads;

-- Create new policy that allows both authenticated and anonymous users to insert
CREATE POLICY "Permitir inserção de leads para todos"
ON public.leads
FOR INSERT
TO public
WITH CHECK (true);