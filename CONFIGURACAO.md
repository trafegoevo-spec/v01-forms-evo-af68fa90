# 📝 Guia de Configuração do Formulário

Este guia explica como fazer alterações no formulário sem precisar mexer no código React.

## 🎯 Configurações do Formulário

### 📋 Perguntas e Textos

**Arquivo:** `src/config/formConfig.ts`

Neste arquivo você pode alterar:

#### 1. Perguntas do Formulário
```typescript
export const FORM_STEPS = {
  nome: {
    title: "Qual é o seu nome?",        // Título da pergunta
    subtitle: "Como devemos te chamar?",  // Subtítulo
    label: "Nome completo",              // Label do campo
    placeholder: "Digite seu nome completo", // Placeholder
    type: "text",                        // Tipo do campo
  },
  // ... outras perguntas
}
```

#### 2. Opções dos Campos Select
```typescript
export const ESCOLARIDADES = [
  "Ensino médio incompleto",
  "Ensino médio completo",
  // ... adicione ou remova opções
];

export const MODALIDADES = [
  "EJA EAD",
  "Técnico EAD",
  // ... adicione ou remova opções
];
```

#### 3. Página de Sucesso
```typescript
export const SUCCESS_PAGE = {
  emoji: "🎉",
  title: (nome: string) => `Obrigado, ${nome.split(' ')[0]}!`,
  message1: "Recebemos suas informações com sucesso!",
  message2: (modalidade: string) => `Em breve entraremos em contato sobre os cursos de ${modalidade}.`,
  whatsappButton: {
    text: "Falar no WhatsApp Agora",
    phone: "5531989236061",  // ← ALTERE AQUI o número do WhatsApp
    message: "Olá! Acabei de enviar meus dados no formulário.",
  },
};
```

#### 4. Validações
```typescript
export const VALIDATION = {
  nome: {
    minLength: 3,
    maxLength: 100,
    errorMessage: "Nome deve ter no mínimo 3 caracteres",
  },
  // ... outras validações
}
```

#### 5. Mensagens de Toast
```typescript
export const TOAST_MESSAGES = {
  success: {
    title: "Cadastro enviado com sucesso!",
    description: "Em breve entraremos em contato.",
  },
  error: {
    title: "Erro ao enviar cadastro",
    description: "Tente novamente mais tarde.",
  },
};
```

## 🏷️ Google Tag Manager

**Arquivo:** `src/config/gtmConfig.ts`

### Como Ativar o GTM:

1. Abra o arquivo `src/config/gtmConfig.ts`
2. Altere as configurações:

```typescript
export const GTM_CONFIG = {
  ENABLED: true,              // ← Mude para true
  GTM_ID: "GTM-XXXXXXX",     // ← Cole seu ID do GTM aqui
};
```

3. Salve o arquivo e recarregue a página

### Como Desativar o GTM:

```typescript
export const GTM_CONFIG = {
  ENABLED: false,  // ← Mude para false
  GTM_ID: "",
};
```

## 🔗 Webhook / Planilha Google

O mapeamento dos campos enviados para o webhook está documentado em `formConfig.ts`:

```typescript
export const WEBHOOK_MAPPING = {
  nome: "nome",
  email: "email",
  whatsapp: "telefone",        // whatsapp é enviado como "telefone"
  modalidade: "curso",
  escolaridade: "graduacao",
};
```

Para configurar o webhook, consulte o arquivo `WEBHOOK-SETUP.md`.

## 📊 Banco de Dados

Os dados são salvos automaticamente na tabela `leads` do PostgreSQL com os seguintes campos:
- `id` (UUID automático)
- `nome`
- `email`
- `whatsapp`
- `escolaridade`
- `modalidade`
- `created_at` (timestamp automático)

Você pode visualizar os dados no backend do Lovable Cloud.

## ✅ Checklist de Configuração Inicial

- [ ] Alterar número do WhatsApp em `formConfig.ts` → `SUCCESS_PAGE.whatsappButton.phone`
- [ ] Configurar webhook conforme `WEBHOOK-SETUP.md`
- [ ] Ativar Google Tag Manager em `gtmConfig.ts` (se aplicável)
- [ ] Testar o formulário end-to-end
- [ ] Verificar se os dados estão chegando na planilha
- [ ] Verificar se os dados estão sendo salvos no banco

## 🎨 Alterações Visuais

Para alterações visuais (cores, tamanhos, etc.), você precisará editar:
- `src/components/MultiStepForm.tsx` - Componente do formulário
- `src/pages/Index.tsx` - Página principal com banner
- `src/index.css` - Estilos globais

## 💡 Dicas

1. **Testando Mudanças**: Após alterar os arquivos de configuração, salve e recarregue a página
2. **Backup**: Antes de fazer alterações, faça um backup dos arquivos de configuração
3. **Validações**: Se alterar as validações, teste bem para garantir que funcionam corretamente
4. **GTM**: Teste os eventos do GTM usando o modo Preview do Google Tag Manager

## 🆘 Precisa de Ajuda?

- Consulte `WEBHOOK-SETUP.md` para configurar a integração com planilhas
- Verifique os logs no console do navegador (F12) para debug
- Entre em contato com o desenvolvedor se precisar de alterações mais complexas
