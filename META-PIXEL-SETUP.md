# 🎯 Configuração do Meta Pixel (Facebook Ads)

Este guia explica como instalar e configurar o Meta Pixel para rastrear conversões do formulário e otimizar suas campanhas no Facebook e Instagram.

## 📋 Pré-requisitos

1. Conta do Facebook Business Manager: https://business.facebook.com
2. Pixel criado no Gerenciador de Eventos do Facebook

## 🔧 Passo 1: Criar o Meta Pixel

1. Acesse https://business.facebook.com
2. Vá em **Gerenciador de Eventos**
3. Clique em **Conectar fontes de dados** → **Web**
4. Selecione **Meta Pixel** → **Conectar**
5. Digite um nome para o pixel (ex: "Site EAD Leads")
6. **Copie o ID do Pixel** (número com 15-16 dígitos)

## 🔨 Passo 2: Instalar o Pixel no Site

O código do Meta Pixel já está instalado no site! Você só precisa adicionar seu ID:

1. Abra o arquivo `index.html` no Lovable
2. Localize esta linha:
```javascript
fbq('init', 'YOUR_PIXEL_ID');
```

3. Substitua `YOUR_PIXEL_ID` pelo ID real do seu pixel
4. Localize também esta linha no `<noscript>`:
```html
src="https://www.facebook.com/tr?id=YOUR_PIXEL_ID&ev=PageView&noscript=1"
```

5. Substitua `YOUR_PIXEL_ID` novamente

**Exemplo:**
```javascript
// Antes
fbq('init', 'YOUR_PIXEL_ID');

// Depois (usando um ID de exemplo)
fbq('init', '123456789012345');
```

## 📊 Eventos Rastreados Automaticamente

O site envia os seguintes eventos para o Meta Pixel:

### 1. **PageView** (Visualização de Página)
- **Quando dispara**: Ao carregar a página
- **Uso**: Medir alcance e criar públicos de visitantes

### 2. **ViewContent** (Visualização de Conteúdo)
- **Quando dispara**: Ao visualizar o formulário
- **Dados enviados**:
  - `content_name`: "Lead Form"
  - `content_category`: "form"
- **Uso**: Criar público de pessoas que viram o formulário

### 3. **InitiateCheckout** (Início de Checkout)
- **Quando dispara**: Quando passa para a 2ª etapa do formulário
- **Dados enviados**:
  - `content_name`: "Lead Form Started"
  - `num_items`: Total de etapas
- **Uso**: Público de pessoas que começaram a preencher

### 4. **SubmitApplication** (Envio de Aplicação)
- **Quando dispara**: Ao clicar no botão "Finalizar"
- **Dados enviados**:
  - `content_name`: "Lead Form Submission"
- **Uso**: Rastrear tentativas de envio

### 5. **Lead** (Conversão de Lead) ⭐
- **Quando dispara**: Após envio bem-sucedido do formulário
- **Dados enviados**:
  - `content_name`: "Lead Form Completed"
  - `content_category`: "lead_generation"
  - `status`: "completed"
- **Uso**: Otimizar campanhas para conversões de lead

## ✅ Passo 3: Testar a Instalação

### Método 1: Meta Pixel Helper (Recomendado)

1. Instale a extensão: [Meta Pixel Helper para Chrome](https://chrome.google.com/webstore/detail/facebook-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc)
2. Acesse seu site
3. Clique no ícone da extensão
4. Verifique se o pixel está ativo (ícone verde)
5. Preencha o formulário e confirme os eventos:
   - ✅ PageView
   - ✅ ViewContent
   - ✅ InitiateCheckout (ao passar para etapa 2)
   - ✅ SubmitApplication (ao clicar em Finalizar)
   - ✅ Lead (após envio com sucesso)

### Método 2: Gerenciador de Eventos

1. Acesse o [Gerenciador de Eventos](https://business.facebook.com/events_manager2)
2. Selecione seu pixel
3. Vá em **Testar eventos**
4. Digite a URL do seu site
5. Preencha o formulário
6. Verifique se os eventos aparecem em tempo real

## 🎯 Passo 4: Criar Conversões Personalizadas

No Gerenciador de Eventos:

### 1. Conversão de Lead Qualificado

1. Vá em **Conversões personalizadas** → **Criar conversão personalizada**
2. Nome: "Lead - Formulário Completo"
3. Regra:
   - Evento: **Lead**
   - E: URL contém seu domínio
4. Categoria: **Lead**
5. Salvar

### 2. Conversão de Início de Formulário

1. Criar nova conversão
2. Nome: "Lead - Formulário Iniciado"
3. Regra:
   - Evento: **InitiateCheckout**
4. Categoria: **Lead**
5. Salvar

## 🚀 Passo 5: Otimizar Campanhas

### Criar Campanha Otimizada para Leads

1. No Gerenciador de Anúncios, crie uma nova campanha
2. Objetivo: **Leads** ou **Conversões**
3. No nível do conjunto de anúncios:
   - Evento de conversão: **Lead** (ou sua conversão personalizada)
   - Estratégia de lances: **Menor custo** ou **Custo limite**
4. Configure público, criativo e orçamento
5. Publique!

### Criar Públicos Personalizados

#### Público de Retargeting - Visualizou o Formulário
1. Vá em **Públicos** → **Criar público personalizado**
2. Fonte: **Seu site**
3. Eventos: **ViewContent** nos últimos 30 dias
4. Nome: "Visitantes do Formulário - 30 dias"

#### Público de Retargeting - Iniciou mas Não Completou
1. Criar público: **InitiateCheckout** nos últimos 7 dias
2. Excluir: **Lead** nos últimos 7 dias
3. Nome: "Abandonaram Formulário - 7 dias"

#### Público Lookalike de Conversões
1. Criar público: **Lead** nos últimos 90 dias
2. Criar **Público semelhante** (lookalike):
   - Base: Público de conversões
   - Localização: Brasil
   - Tamanho: 1% (mais similar)

## 📈 Métricas para Acompanhar

No Gerenciador de Anúncios, monitore:

- **CPL (Custo por Lead)**: Custo total ÷ Leads
- **Taxa de conversão**: Leads ÷ ViewContent × 100
- **Taxa de abandono**: InitiateCheckout ÷ Lead × 100
- **ROAS**: Retorno sobre investimento em anúncios

## 🔍 Passo 6: API de Conversões (Avançado)

Para rastreamento mais preciso (sem depender de cookies):

1. No Gerenciador de Eventos, vá em **Configurações** do pixel
2. Clique em **Gerar token de acesso**
3. Copie o token
4. Configure o envio server-side na edge function `enviar-conversao`

```typescript
// Exemplo de envio via API de Conversões
const pixelData = {
  data: [{
    event_name: 'Lead',
    event_time: Math.floor(Date.now() / 1000),
    user_data: {
      em: hashEmail(email), // Email com hash SHA256
      ph: hashPhone(phone), // Telefone com hash SHA256
    },
    custom_data: {
      content_name: 'Lead Form Completed'
    }
  }],
  access_token: 'SEU_TOKEN_AQUI'
};

await fetch(`https://graph.facebook.com/v18.0/YOUR_PIXEL_ID/events`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(pixelData)
});
```

## 💡 Dicas de Otimização

### 1. Use o Período de Aprendizado
- Deixe a campanha rodar por 7 dias sem grandes mudanças
- Meta precisa de ~50 conversões/semana para otimizar

### 2. Crie Anúncios Variados
- Teste diferentes criativos, textos e CTAs
- Use vídeos curtos (15-30s) que performam bem no feed

### 3. Teste Diferentes Públicos
- Público amplo (deixe o Meta encontrar leads)
- Públicos detalhados (interesses específicos)
- Lookalikes de conversões

### 4. Configure Orçamento por Dia
- Comece com R$ 50-100/dia
- Aumente gradualmente após provar ROI positivo

## 🛠️ Resolução de Problemas

### Pixel não está disparando
- Verifique se substituiu `YOUR_PIXEL_ID` pelo ID real
- Confirme que o pixel está ativo no Gerenciador de Eventos
- Limpe o cache do navegador

### Evento "Lead" não está sendo rastreado
- Use o Pixel Helper para debugar
- Verifique o console do navegador (F12) por erros
- Confirme que o formulário está sendo enviado com sucesso

### Conversões contam 2x ou mais
- Verifique se não tem código duplicado do pixel
- Certifique-se de que o evento só dispara após sucesso real

### Taxa de correspondência baixa
- Implemente API de Conversões para aumentar precisão
- Envie mais dados do usuário (email, telefone com hash)

## 📞 Recursos Úteis

- [Central de Ajuda do Meta Business](https://www.facebook.com/business/help)
- [Documentação do Meta Pixel](https://developers.facebook.com/docs/meta-pixel)
- [Guia de Eventos Padrão](https://www.facebook.com/business/help/402791146561655)
- [API de Conversões](https://developers.facebook.com/docs/marketing-api/conversions-api)

## 🎓 Próximos Passos

1. ✅ Instalar e testar o pixel
2. ✅ Criar conversões personalizadas
3. ✅ Configurar primeira campanha
4. ✅ Criar públicos de retargeting
5. ✅ Implementar API de Conversões (opcional)
6. ✅ Analisar métricas e otimizar

## 🔐 Privacidade e LGPD

**IMPORTANTE**: Informe os usuários sobre o uso de pixels de rastreamento:

1. Adicione aviso de cookies no site
2. Inclua o Meta Pixel na política de privacidade
3. Permita opt-out para usuários que não desejam rastreamento
4. Use apenas dados necessários e com consentimento

---

**Suporte**: Para dúvidas, consulte a [Central de Ajuda do Meta Business](https://www.facebook.com/business/help).
