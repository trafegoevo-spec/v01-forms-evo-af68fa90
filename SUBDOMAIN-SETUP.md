# Configuração Multi-Subdomínio com Variáveis de Ambiente

Este projeto suporta múltiplos subdomínios independentes usando a mesma base de código e tabela do Supabase, diferenciados por variáveis de ambiente.

## Arquitetura

Cada subdomínio (ex: `universoagv.evoleads.app`, `autoprotecta.evoleads.app`) roda o mesmo código, mas com configurações diferentes através de variáveis de ambiente:

- **VITE_FORM_NAME**: Identificador único do formulário (usado para filtrar dados no Supabase)
- **VITE_GTM_ID**: ID do Google Tag Manager específico para este subdomínio

## Configuração para Cada Subdomínio

### 1. Criar Entrada no Supabase

Antes de configurar um novo subdomínio, certifique-se de ter uma entrada na tabela `app_settings` com o mesmo valor de `subdomain` que você usará em `VITE_FORM_NAME`:

```sql
INSERT INTO app_settings (
  subdomain,
  whatsapp_number,
  whatsapp_message,
  success_title,
  success_description,
  success_subtitle,
  form_name,
  whatsapp_enabled,
  gtm_id
) VALUES (
  'universoagv',  -- Este valor deve corresponder ao VITE_FORM_NAME
  '5531989236061',
  'Olá! Acabei de enviar meus dados no formulário.',
  'Obrigado',
  'Recebemos suas informações com sucesso!',
  'Em breve entraremos em contato.',
  'universoagv',
  true,
  'GTM-XXXXXXX'
);
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` para cada build/subdomínio:

**Para universoagv.evoleads.app** (`.env.universoagv`):
```env
VITE_SUPABASE_PROJECT_ID="wosoaxqisrpwxekdanac"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://wosoaxqisrpwxekdanac.supabase.co"

VITE_FORM_NAME="universoagv"
VITE_GTM_ID="GTM-XXXXXXX"
```

**Para autoprotecta.evoleads.app** (`.env.autoprotecta`):
```env
VITE_SUPABASE_PROJECT_ID="wosoaxqisrpwxekdanac"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_URL="https://wosoaxqisrpwxekdanac.supabase.co"

VITE_FORM_NAME="autoprotecta"
VITE_GTM_ID="GTM-YYYYYYY"
```

### 3. Build para Cada Subdomínio

```bash
# Build para universoagv
cp .env.universoagv .env
npm run build
# Deploy dist/ para universoagv.evoleads.app

# Build para autoprotecta
cp .env.autoprotecta .env
npm run build
# Deploy dist/ para autoprotecta.evoleads.app
```

## Isolamento de Dados

### Perguntas do Formulário
Cada subdomínio carrega apenas as perguntas onde `subdomain = VITE_FORM_NAME`:

```sql
SELECT * FROM form_questions 
WHERE subdomain = 'universoagv'
ORDER BY step ASC;
```

### Configurações
Cada subdomínio carrega apenas suas configurações:

```sql
SELECT * FROM app_settings 
WHERE subdomain = 'universoagv';
```

### Leads
Os leads são salvos na tabela apropriada com o `form_data` em formato JSON:

```sql
-- Tabela padrão
INSERT INTO leads (form_data) VALUES ('{"nome": "João", ...}');

-- Ou tabela específica para autoprotecta
INSERT INTO leads_autoprotecta (form_data) VALUES ('{"nome": "Maria", ...}');
```

## Gerenciamento via Admin

1. Acesse `/admin` com credenciais de administrador
2. O admin panel mostrará:
   - **Form Name Atual**: Valor de `VITE_FORM_NAME`
   - **GTM ID Atual**: Valor de `VITE_GTM_ID`
3. Todas as perguntas criadas/editadas serão associadas ao `VITE_FORM_NAME` atual

## Google Tag Manager

O GTM é injetado automaticamente usando o valor de `VITE_GTM_ID`:

```javascript
// GTMScript.tsx
const gtmId = import.meta.env.VITE_GTM_ID || "GTM-PRW9TPH";
```

Eventos disparados:
- `pageview`: Quando o formulário carrega
- `gtm.formSubmit`: Quando o usuário submete o formulário

## Benefícios desta Abordagem

1. **Uma única base de código**: Manter apenas um repositório
2. **Uma única tabela**: Não precisa duplicar estruturas no Supabase
3. **Isolamento completo**: Cada subdomínio vê apenas seus dados
4. **Fácil manutenção**: Atualizações aplicam-se a todos os subdomínios
5. **Configuração flexível**: GTM e configurações independentes por subdomínio

## Exemplo Completo de Fluxo

```bash
# 1. No Supabase, criar configuração
INSERT INTO app_settings (subdomain, form_name, gtm_id, ...) 
VALUES ('novocliente', 'novocliente', 'GTM-ZZZZ', ...);

# 2. Criar arquivo .env.novocliente
echo "VITE_FORM_NAME=novocliente" > .env.novocliente
echo "VITE_GTM_ID=GTM-ZZZZ" >> .env.novocliente
# ... outras variáveis

# 3. Fazer build
cp .env.novocliente .env
npm run build

# 4. Deploy dist/ para novocliente.evoleads.app
```

Pronto! O novo subdomínio estará funcionando com isolamento completo.
