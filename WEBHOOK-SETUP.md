# 📊 Configuração do Webhook para Planilha

Este site está configurado para enviar automaticamente os dados de conversão para uma planilha através de webhook.

## 🔧 Como Configurar

### Opção 1: Google Sheets + Zapier (Recomendado)

1. **Crie uma conta no Zapier**: https://zapier.com
2. **Crie um novo Zap**:
   - Trigger: "Webhooks by Zapier" → "Catch Hook"
   - Copie a URL do webhook fornecida
3. **Configure a Action**:
   - App: "Google Sheets"
   - Action: "Create Spreadsheet Row"
   - Mapeie os campos:
     - nome → Coluna A
     - email → Coluna B
     - telefone → Coluna C
     - curso → Coluna D
     - cidade → Coluna E
     - data_cadastro → Coluna F
     - origem → Coluna G

4. **Adicione o webhook no Lovable Cloud**:
   - Abra o Cloud no Lovable
   - Vá em "Secrets"
   - Adicione: `WEBHOOK_URL` = [URL do webhook do Zapier]

### Opção 2: Make.com (Integromat)

1. **Crie uma conta no Make**: https://make.com
2. **Crie um novo Scenario**:
   - Trigger: "Webhooks" → "Custom webhook"
   - Copie a URL do webhook
3. **Adicione módulo Google Sheets**:
   - Action: "Add a row"
   - Configure os campos

4. **Adicione o webhook no Lovable Cloud**:
   - Secrets → `WEBHOOK_URL` = [URL do webhook do Make]

### Opção 3: Google Sheets Script (Grátis)

1. **Abra sua planilha do Google Sheets**
2. **Vá em Extensions → Apps Script**
3. **Cole este código**:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    new Date(),
    data.nome,
    data.email,
    data.telefone,
    data.curso,
    data.cidade || '',
    data.origem
  ]);
  
  return ContentService.createTextOutput(
    JSON.stringify({ success: true })
  ).setMimeType(ContentService.MimeType.JSON);
}
```

4. **Deploy**:
   - Click em "Deploy" → "New deployment"
   - Type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Copie a URL gerada

5. **Adicione no Lovable Cloud**:
   - Secrets → `WEBHOOK_URL` = [URL do Google Script]

## ✅ Testar a Configuração

Após configurar o webhook:
1. Preencha o formulário no site
2. Envie os dados
3. Verifique se uma nova linha aparece na planilha

## 📋 Formato dos Dados Enviados

```json
{
  "nome": "Nome do aluno",
  "email": "email@exemplo.com",
  "telefone": "(00) 00000-0000",
  "curso": "Graduação",
  "cidade": "São Paulo",
  "data_cadastro": "2025-01-01T10:00:00.000Z",
  "origem": "Site EAD"
}
```

## 🔐 Segurança

- O webhook funciona sem autenticação JWT (público)
- Os dados são validados antes do envio
- Não exponha informações sensíveis no webhook

## 📞 Suporte

Se tiver dúvidas sobre a configuração, consulte:
- [Documentação Zapier](https://zapier.com/help)
- [Documentação Make](https://www.make.com/en/help)
- [Apps Script Google](https://developers.google.com/apps-script)
