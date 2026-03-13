# Substituir `manager_id` por `client_slug` na Integracao CRM

## Contexto

O codigo de integracao enviado mostra que o CRM agora espera `client_slug` em vez de `manager_id`. Atualmente, as 3 edge functions enviam `manager_id` no payload do CRM. Precisamos alinhar o sistema com esse novo padrao.

## Mudancas Necessarias

### 1. Banco de Dados

Adicionar coluna `client_slug` na tabela `crm_integrations` para substituir `manager_id`:

```text
ALTER TABLE crm_integrations ADD COLUMN client_slug text;
```

A coluna `manager_id` sera mantida temporariamente para nao quebrar dados existentes.

### 2. Edge Functions (3 arquivos)

Substituir `manager_id` por `client_slug` no payload enviado ao CRM em:

- `supabase/functions/enviar-conversao/index.ts`
- `supabase/functions/enviar-conversao-autoprotecta/index.ts`
- `supabase/functions/enviar-conversao-educa/index.ts`

Em cada arquivo, as duas ocorrencias de:

```typescript
manager_id: crmConfig.manager_id || "",
```

serao substituidas por:

```typescript
client_slug: crmConfig.client_slug || "",
```

### 3. Pagina de Integracao CRM (`src/pages/CrmIntegration.tsx`)

- Adicionar `client_slug` na interface `CrmIntegration`
- Corrigir os dois campos "Slug" duplicados (bug atual) para serem `client_slug` e `slug` separadamente
- Atualizar o payload de exemplo para mostrar `client_slug` em vez de `manager_id`
- Atualizar os metodos de save/insert para incluir `client_slug`
- Atualizar o payload de teste para enviar `client_slug`

O formulario ficara com:


| Campo           | Descricao                                              |
| --------------- | ------------------------------------------------------ |
| **Client Slug** | Identificador unico do cliente no CRM (ex: `educacao`) |
| **Slug**        | Identificador do time/campanha (ex: `educacao-1`)      |


### Resultado

O payload enviado ao CRM passara a ser, mas pode ser editado nas configurações de integração

```json
{
  "client_slug": "educacao",
  "slug": "educacao-1",
  "nome": "Maria Santos",
  "telefone": "31999887766",
  ...
}
```

Alinhado com o script de integracao fornecido.