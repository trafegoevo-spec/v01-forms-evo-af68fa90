# Notificações de Novos Leads: Email (SMTP), WhatsApp (Evolution API) e Slack

## Resumo

Criar um sistema de notificações multi-canal que dispara automaticamente a cada novo lead, com configuração de destinatários no painel admin. Os 3 canais: email via SMTP genérico, WhatsApp via Evolution API, e Slack via webhook.

## 1. Banco de Dados

Nova tabela `notification_settings` para armazenar configurações por subdomain:

```sql
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
  email_recipients text, -- emails separados por vírgula
  
  -- WhatsApp Evolution API
  whatsapp_notify_enabled boolean DEFAULT false,
  evolution_api_url text,
  evolution_api_key text,
  evolution_instance text,
  whatsapp_notify_numbers text, -- números separados por vírgula
  
  -- Slack
  slack_enabled boolean DEFAULT false,
  slack_webhook_url text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS: apenas admins
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage notification_settings" ON notification_settings FOR ALL USING (has_role(auth.uid(), 'admin'));
```

## 2. Edge Function: `notificar-lead`

Nova edge function chamada pelas funções de conversão existentes após salvar o lead. Recebe os dados do lead e o subdomain, busca as configurações de notificação e dispara nos canais ativos:

**Email (SMTP)**: Conexão SMTP direta via Deno `smtp` library. Envia email formatado com dados do lead (nome, telefone, email, curso, etc).

**WhatsApp (Evolution API)**: POST para `{evolution_api_url}/message/sendText/{instance}` com apikey no header. Mensagem formatada com dados do lead.

**Slack (Webhook)**: POST para o Slack Incoming Webhook URL com payload de blocks formatados (nome, telefone, email do lead).

## 3. Integração nas Edge Functions Existentes

Nas 3 funções de conversão (`enviar-conversao`, `enviar-conversao-autoprotecta`, `enviar-conversao-educa`), após o salvamento bem-sucedido do lead, adicionar chamada assíncrona (fire-and-forget) para `notificar-lead`:

```typescript
// Após salvar o lead com sucesso
fetch(`${supabaseUrl}/functions/v1/notificar-lead`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
  body: JSON.stringify({ subdomain, lead: flattened }),
}).catch(err => console.error("Erro notificação:", err));
```

Isso garante que falhas de notificação não bloqueiam o fluxo principal.

## 4. Painel Admin: Aba "Notificações"

Novo componente `AdminNotifications.tsx` com 3 seções expansíveis (accordion):

**Email SMTP**: Campos para host, porta, usuário, senha, remetente e destinatários. Toggle de ativação. Botão "Enviar teste".

**WhatsApp Evolution API**: Campos para URL da API, API Key, nome da instância e números de destino. Toggle de ativação. Botão "Enviar teste".

**Slack**: Campo para Webhook URL. Toggle de ativação. Botão "Enviar teste".

Nova aba "Notificações" adicionada ao `Admin.tsx` junto às abas existentes.

## 5. Secrets Necessários

Nenhum secret global necessário — todas as credenciais ficam na tabela `notification_settings` por subdomain, configuráveis pelo admin. Isso permite que diferentes formulários usem diferentes configurações.

## 6. Arquivos a Criar/Modificar


| Arquivo                                              | Ação                                   |
| ---------------------------------------------------- | -------------------------------------- |
| `supabase/migrations/xxx.sql`                        | Criar tabela `notification_settings`   |
| `supabase/functions/notificar-lead/index.ts`         | Nova edge function                     |
| `supabase/config.toml`                               | Adicionar `[functions.notificar-lead]` |
| `src/components/admin/AdminNotifications.tsx`        | Novo componente admin                  |
| `src/pages/Admin.tsx`                                | Adicionar aba "Notificações"           |
| `supabase/functions/enviar-conversao/index.ts`       | Chamar notificar-lead                  |
| &nbsp;                                               | &nbsp;                                 |
| `supabase/functions/enviar-conversao-educa/index.ts` | Chamar notificar-lead                  |
