/**
 * CONFIGURAÇÃO DO FORMULÁRIO
 * 
 * Este arquivo centraliza todas as configurações do formulário multi-etapas.
 * Edite aqui para alterar perguntas, opções e textos sem precisar mexer no código React.
 */

// ============= CONFIGURAÇÕES DAS PERGUNTAS =============

export const FORM_STEPS = {
  nome: {
    title: "Qual é o seu nome?",
    subtitle: "Como devemos te chamar?",
    label: "Nome completo",
    placeholder: "Digite seu nome completo",
    type: "text" as const,
  },
  whatsapp: {
    title: "Qual é o seu WhatsApp?",
    subtitle: "Para entrarmos em contato",
    label: "WhatsApp",
    placeholder: "(99) 99999-9999",
    type: "tel" as const,
  },
  email: {
    title: "Qual é o seu e-mail?",
    subtitle: "Enviaremos informações para você",
    label: "E-mail",
    placeholder: "seu@email.com",
    type: "email" as const,
  },
  escolaridade: {
    title: "Qual é o seu nível de escolaridade?",
    subtitle: "Escolha sua escolaridade atual",
    label: "Nível de escolaridade",
    placeholder: "Selecione sua escolaridade",
    type: "select" as const,
  },
  modalidade: {
    title: "Qual modalidade você tem interesse?",
    subtitle: "Escolha a modalidade desejada",
    label: "Modalidade de interesse",
    placeholder: "Selecione uma modalidade",
    type: "select" as const,
  },
};

// ============= OPÇÕES DOS CAMPOS SELECT =============

export const ESCOLARIDADES = [
  "Ensino médio incompleto",
  "Ensino médio completo",
  "Graduação em andamento",
  "Graduação completa",
  "Pós-graduação em andamento",
  "Pós-graduação completa",
  "Mestrado / Doutorado",
];

export const MODALIDADES = [
  "EJA EAD",
  "Técnico EAD",
  "Graduação EAD",
  "Segunda Graduação EAD",
  "Disciplinas Isoladas EAD",
  "Pós-graduação EAD",
];

// ============= TEXTOS DA PÁGINA DE SUCESSO =============

export const SUCCESS_PAGE = {
  emoji: "🎉",
  title: (nome: string) => `Obrigado, ${nome.split(' ')[0]}!`,
  message1: "Recebemos suas informações com sucesso!",
  message2: (modalidade: string) => `Em breve entraremos em contato sobre os cursos de ${modalidade}.`,
  whatsappButton: {
    text: "Falar no WhatsApp Agora",
    phone: "5531989236061", // Formato: código do país + DDD + número
    message: "Olá! Acabei de enviar meus dados no formulário.",
  },
};

// ============= CONFIGURAÇÕES DE VALIDAÇÃO =============

export const VALIDATION = {
  nome: {
    minLength: 3,
    maxLength: 100,
    errorMessage: "Nome deve ter no mínimo 3 caracteres",
  },
  whatsapp: {
    format: /^\(\d{2}\) \d{5}-\d{4}$/,
    errorMessage: "WhatsApp inválido. Use o formato (99) 99999-9999",
  },
  email: {
    maxLength: 255,
    errorMessage: "Email inválido",
  },
};

// ============= MENSAGENS DE TOAST =============

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

// ============= CONFIGURAÇÃO DO WEBHOOK (Edge Function) =============
// Os dados enviados para o webhook terão este mapeamento:
export const WEBHOOK_MAPPING = {
  // Campo do formulário → Campo enviado ao webhook
  nome: "nome",
  email: "email",
  whatsapp: "telefone", // Note que whatsapp vira "telefone" no webhook
  modalidade: "curso",
  escolaridade: "graduacao",
  // Campos adicionais automáticos:
  // - timestamp: data/hora do envio
  // - origem: "Site EAD"
};
