-- ========================================================
-- FUNÇÃO PARA UPDATED_AT AUTOMÁTICO
-- ========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ========================================================
-- TABELA 1: ENTIDADES (Principal)
-- ========================================================
CREATE TABLE public.entidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT,
  email TEXT,
  telefone TEXT,
  cpf TEXT,
  subdomain TEXT NOT NULL DEFAULT 'default',
  dados_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_entidades_email ON public.entidades(email);
CREATE INDEX idx_entidades_telefone ON public.entidades(telefone);
CREATE INDEX idx_entidades_cpf ON public.entidades(cpf);
CREATE INDEX idx_entidades_subdomain ON public.entidades(subdomain);
CREATE INDEX idx_entidades_dados_json ON public.entidades USING GIN(dados_json);

CREATE TRIGGER update_entidades_updated_at
  BEFORE UPDATE ON public.entidades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.entidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert entidades"
  ON public.entidades FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view entidades"
  ON public.entidades FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update entidades"
  ON public.entidades FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete entidades"
  ON public.entidades FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ========================================================
-- TABELA 2: FORM_A_RESPOSTAS
-- ========================================================
CREATE TABLE public.form_a_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_id UUID NOT NULL REFERENCES public.entidades(id) ON DELETE CASCADE,
  form_name TEXT NOT NULL DEFAULT 'formA',
  dados_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_a_entidade ON public.form_a_respostas(entidade_id);
CREATE INDEX idx_form_a_form_name ON public.form_a_respostas(form_name);
CREATE INDEX idx_form_a_dados_json ON public.form_a_respostas USING GIN(dados_json);

CREATE TRIGGER update_form_a_respostas_updated_at
  BEFORE UPDATE ON public.form_a_respostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.form_a_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert form_a_respostas"
  ON public.form_a_respostas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view form_a_respostas"
  ON public.form_a_respostas FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update form_a_respostas"
  ON public.form_a_respostas FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete form_a_respostas"
  ON public.form_a_respostas FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ========================================================
-- TABELA 3: FORM_B_RESPOSTAS
-- ========================================================
CREATE TABLE public.form_b_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_id UUID NOT NULL REFERENCES public.entidades(id) ON DELETE CASCADE,
  form_name TEXT NOT NULL DEFAULT 'formB',
  dados_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_b_entidade ON public.form_b_respostas(entidade_id);
CREATE INDEX idx_form_b_form_name ON public.form_b_respostas(form_name);
CREATE INDEX idx_form_b_dados_json ON public.form_b_respostas USING GIN(dados_json);

CREATE TRIGGER update_form_b_respostas_updated_at
  BEFORE UPDATE ON public.form_b_respostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.form_b_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert form_b_respostas"
  ON public.form_b_respostas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view form_b_respostas"
  ON public.form_b_respostas FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update form_b_respostas"
  ON public.form_b_respostas FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete form_b_respostas"
  ON public.form_b_respostas FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ========================================================
-- TABELA 4: FORM_C_RESPOSTAS
-- ========================================================
CREATE TABLE public.form_c_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_id UUID NOT NULL REFERENCES public.entidades(id) ON DELETE CASCADE,
  form_name TEXT NOT NULL DEFAULT 'formC',
  dados_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_c_entidade ON public.form_c_respostas(entidade_id);
CREATE INDEX idx_form_c_form_name ON public.form_c_respostas(form_name);
CREATE INDEX idx_form_c_dados_json ON public.form_c_respostas USING GIN(dados_json);

CREATE TRIGGER update_form_c_respostas_updated_at
  BEFORE UPDATE ON public.form_c_respostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.form_c_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert form_c_respostas"
  ON public.form_c_respostas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view form_c_respostas"
  ON public.form_c_respostas FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update form_c_respostas"
  ON public.form_c_respostas FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete form_c_respostas"
  ON public.form_c_respostas FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ========================================================
-- TABELA 5: FORM_D_RESPOSTAS
-- ========================================================
CREATE TABLE public.form_d_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entidade_id UUID NOT NULL REFERENCES public.entidades(id) ON DELETE CASCADE,
  form_name TEXT NOT NULL DEFAULT 'formD',
  dados_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_form_d_entidade ON public.form_d_respostas(entidade_id);
CREATE INDEX idx_form_d_form_name ON public.form_d_respostas(form_name);
CREATE INDEX idx_form_d_dados_json ON public.form_d_respostas USING GIN(dados_json);

CREATE TRIGGER update_form_d_respostas_updated_at
  BEFORE UPDATE ON public.form_d_respostas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.form_d_respostas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert form_d_respostas"
  ON public.form_d_respostas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view form_d_respostas"
  ON public.form_d_respostas FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update form_d_respostas"
  ON public.form_d_respostas FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete form_d_respostas"
  ON public.form_d_respostas FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));