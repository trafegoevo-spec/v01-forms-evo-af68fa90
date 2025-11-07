# 🏷️ Configuração do Google Tag Manager

Este guia explica como instalar e configurar o Google Tag Manager para rastrear conversões do formulário.

## 📋 Pré-requisitos

1. Conta no Google Tag Manager: https://tagmanager.google.com
2. Conta no Google Analytics (opcional, mas recomendado)

## 🔧 Passo 1: Criar Container no GTM

1. Acesse https://tagmanager.google.com
2. Clique em "Criar conta" (se for a primeira vez)
3. Preencha:
   - **Nome da conta**: Nome da sua empresa
   - **País**: Brasil
   - **Nome do contêiner**: Nome do site
   - **Plataforma de destino**: Web
4. Clique em "Criar"
5. **Copie o ID do Container** (formato: `GTM-XXXXXXX`)

## 🔨 Passo 2: Instalar o GTM no Site

### Opção A: Adicionar manualmente no código

1. Abra o arquivo `index.html`
2. Cole o código do GTM em **dois lugares**:

#### Código 1 - Cole no `<head>`:
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
<!-- End Google Tag Manager -->
```

#### Código 2 - Cole logo após `<body>`:
```html
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```

**IMPORTANTE**: Substitua `GTM-XXXXXXX` pelo seu ID real do container!

### Opção B: Usar Lovable (Automático)

O código já está configurado no projeto! Só precisa adicionar o ID do GTM:

1. No Lovable, abra o arquivo `index.html`
2. Localize as linhas com `GTM-XXXXXXX`
3. Substitua pelo seu ID real
4. Salve o arquivo

## 📊 Passo 3: Configurar Eventos no GTM

### Eventos Rastreados Automaticamente:

O site já envia os seguintes eventos para o GTM:

1. **`form_step_view`** - Quando o usuário visualiza uma etapa do formulário
   - `step_number`: Número da etapa (1, 2, 3...)
   - `step_name`: Nome do campo
   - `total_steps`: Total de etapas

2. **`form_submission`** - Quando o usuário clica em "Finalizar"
   - `form_name`: "lead_form"

3. **`form_conversion`** - Quando o formulário é enviado com sucesso
   - `form_name`: "lead_form"
   - `lead_name`: Nome do lead
   - `lead_email`: Email do lead
   - Todos os campos preenchidos

### Como Criar Tags no GTM:

#### 1. Tag de Conversão (Google Ads)

1. No GTM, vá em **Tags** → **Novo**
2. Nome: "Conversão Google Ads - Lead"
3. Tipo de tag: **Google Ads - Conversão**
4. Configuração:
   - ID de conversão: SEU_ID_AQUI
   - Rótulo de conversão: SEU_LABEL_AQUI
5. Acionamento:
   - Tipo: **Evento personalizado**
   - Nome do evento: `form_conversion`
6. Salvar

#### 2. Tag de Evento (Google Analytics 4)

1. No GTM, vá em **Tags** → **Novo**
2. Nome: "GA4 - Lead Conversion"
3. Tipo de tag: **Google Analytics: Evento GA4**
4. Configuração:
   - ID de medição: SEU_GA4_ID
   - Nome do evento: `generate_lead`
5. Acionamento:
   - Tipo: **Evento personalizado**
   - Nome do evento: `form_conversion`
6. Salvar

#### 3. Tag de Evento (Meta Pixel)

1. No GTM, vá em **Tags** → **Novo**
2. Nome: "Meta Pixel - Lead"
3. Tipo de tag: **HTML personalizado**
4. Código:
```html
<script>
  fbq('track', 'Lead', {
    content_name: {{Event - lead_name}},
    content_category: 'lead_form'
  });
</script>
```
5. Acionamento:
   - Tipo: **Evento personalizado**
   - Nome do evento: `form_conversion`
6. Salvar

## ✅ Passo 4: Testar a Instalação

1. No GTM, clique em **Visualizar** (canto superior direito)
2. Digite a URL do seu site
3. O site abrirá com o GTM Debug ativo
4. Preencha o formulário
5. Verifique se os eventos aparecem no painel de debug:
   - ✅ `form_step_view` a cada etapa
   - ✅ `form_submission` ao clicar em Finalizar
   - ✅ `form_conversion` após envio com sucesso

## 🚀 Passo 5: Publicar

Quando tudo estiver funcionando:

1. No GTM, clique em **Enviar** (canto superior direito)
2. Adicione um nome à versão (ex: "Instalação inicial")
3. Clique em **Publicar**

## 📈 Eventos Disponíveis para Rastreamento

Você pode criar tags para qualquer um destes eventos:

| Evento | Quando dispara | Dados enviados |
|--------|---------------|----------------|
| `form_step_view` | A cada etapa visualizada | step_number, step_name, total_steps |
| `form_submission` | Ao clicar em "Finalizar" | form_name |
| `form_conversion` | Após envio bem-sucedido | form_name, lead_name, lead_email, todos os campos |

## 🔍 Variáveis Disponíveis

Você pode usar estas variáveis nas suas tags:

- `{{Event - step_number}}` - Número da etapa
- `{{Event - step_name}}` - Nome do campo
- `{{Event - lead_name}}` - Nome do lead
- `{{Event - lead_email}}` - Email do lead
- `{{Event - form_name}}` - Nome do formulário

Para criar variáveis no GTM:
1. Vá em **Variáveis** → **Nova**
2. Tipo: **Variável da camada de dados**
3. Nome da variável: `step_number` (ou outro campo)

## 🎯 Integrações Recomendadas

### Google Ads
- Configure a conversão "Lead" no Google Ads
- Use o evento `form_conversion` como gatilho

### Meta Pixel
- Instale o Meta Pixel via GTM
- Use o evento `Lead` para rastrear conversões

### Google Analytics 4
- Configure o evento `generate_lead`
- Analise o funil com `form_step_view`

## 💡 Dicas

1. **Sempre use o modo Visualizar** antes de publicar
2. **Teste em diferentes dispositivos** (desktop, mobile)
3. **Configure metas no Google Analytics** para acompanhar conversões
4. **Use UTMs** nos seus anúncios para rastrear a origem dos leads

## 🆘 Resolução de Problemas

### Eventos não aparecem no GTM Debug
- Verifique se o GTM foi instalado corretamente
- Confirme que o ID do container está correto
- Limpe o cache do navegador

### Conversões não são contadas
- Teste o evento `form_conversion` no modo Visualizar
- Verifique se a tag está ativa e publicada
- Confirme que os IDs de conversão estão corretos

## 📞 Suporte

- [Documentação oficial do GTM](https://support.google.com/tagmanager)
- [Central de Ajuda Google Ads](https://support.google.com/google-ads)
- [Documentação Meta Pixel](https://www.facebook.com/business/help/952192354843755)
