// Arquivo corrigido: MultiStepFormDynamic.tsx - Redesign Typeform Style
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, ArrowLeft, Check, X, CheckCircle, MessageCircle, ChevronUp, ChevronDown } from "lucide-react";

interface ConditionalRule {
  value: string;
  action: "skip_to_step" | "success_page" | "disqualify_page";
  target_step?: number;
  target_page?: string;
}
interface ConditionalLogic {
  conditions: ConditionalRule[];
}
interface Question {
  id: string;
  step: number;
  question: string;
  subtitle?: string;
  options: string[];
  field_name: string;
  input_type?: "text" | "select" | "password" | "buttons";
  max_length?: number;
  input_placeholder?: string;
  required?: boolean;
  conditional_logic?: ConditionalLogic | null;
}
interface SuccessPage {
  id: string;
  page_key: string;
  title: string;
  subtitle: string;
  description: string;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_message: string;
}

export const MultiStepFormDynamic = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const [isSuccess, setIsSuccess] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [successPages, setSuccessPages] = useState<SuccessPage[]>([]);
  const [activeSuccessPage, setActiveSuccessPage] = useState<SuccessPage | null>(null);
  const [rotatedWhatsApp, setRotatedWhatsApp] = useState<{
    number: string;
    name: string;
  } | null>(null);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const { toast } = useToast();
  const formName = import.meta.env.VITE_FORM_NAME || "default";

  // Flag to track if GTM should fire (only on real final submit)
  const shouldFireGtmRef = useRef(false);

  // Generate unique session ID for analytics tracking
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  // Track form start (only once)
  useEffect(() => {
    const storageKey = `form_session_${formName}`;
    const existingSession = sessionStorage.getItem(storageKey);

    if (!existingSession) {
      sessionStorage.setItem(storageKey, JSON.stringify({
        sessionId,
        startedAt: new Date().toISOString(),
        stepReached: 1,
        partialData: {}
      }));

      supabase.from("form_analytics").insert({
        session_id: sessionId,
        subdomain: formName,
        event_type: "form_started",
        step_reached: 1
      }).then(({ error }) => {
        if (error) console.error("Error tracking form start:", error);
      });
    }
  }, [sessionId, formName]);

  // Update localStorage on step changes
  useEffect(() => {
    const storageKey = `form_session_${formName}`;
    const cached = sessionStorage.getItem(storageKey);
    if (cached && !isSuccess) {
      try {
        const data = JSON.parse(cached);
        data.stepReached = step;
        data.partialData = form.getValues();
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      } catch (e) {
        console.error("Error updating session storage:", e);
      }
    }
  }, [step, formName, isSuccess]);

  // Send partial data on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const storageKey = `form_session_${formName}`;
      const cached = sessionStorage.getItem(storageKey);
      if (cached && !isSuccess) {
        try {
          const data = JSON.parse(cached);
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          navigator.sendBeacon(`${supabaseUrl}/functions/v1/salvar-parcial`, JSON.stringify({
            sessionId: data.sessionId,
            subdomain: formName,
            stepReached: data.stepReached,
            partialData: data.partialData
          }));
        } catch (e) {
          console.error("Error sending partial data:", e);
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formName, isSuccess]);

  // Track WhatsApp click
  const trackWhatsAppClick = useCallback(() => {
    supabase.from("form_analytics").insert({
      session_id: sessionId,
      subdomain: formName,
      event_type: "whatsapp_clicked"
    }).then(({ error }) => {
      if (error) console.error("Error tracking WhatsApp click:", error);
    });
  }, [sessionId, formName]);

  useEffect(() => {
    loadQuestions();
    loadSettings();
    loadSuccessPages();
  }, []);

  const loadSuccessPages = async () => {
    try {
      const { data, error } = await supabase.from("success_pages").select("*").eq("subdomain", formName);
      if (error) throw error;
      setSuccessPages(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar páginas de sucesso:", error);
    }
  };

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase.from("form_questions").select("*").eq("subdomain", formName).order("step", { ascending: true });
      if (error) throw error;
      const transformedData = (data || []).map(item => ({
        ...item,
        options: Array.isArray(item.options) ? item.options as string[] : [],
        input_type: (["select", "text", "password", "buttons"].includes(item.input_type) ? item.input_type : "text") as "text" | "select" | "password" | "buttons",
        required: item.required !== undefined ? item.required : true,
        conditional_logic: item.conditional_logic as unknown as ConditionalLogic | null
      }));
      setQuestions(transformedData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perguntas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from("app_settings").select("*").eq("subdomain", formName).single();
      if (error) {
        if (error.code === 'PGRST116') {
          const defaultSettings = {
            subdomain: formName,
            form_name: formName,
            whatsapp_enabled: true,
            whatsapp_number: '5531989236061',
            whatsapp_message: 'Olá! Acabei de enviar meus dados no formulário.',
            success_title: 'Obrigado',
            success_description: 'Recebemos suas informações com sucesso!',
            success_subtitle: 'Em breve entraremos em contato.'
          };
          const { data: newData, error: insertError } = await supabase.from("app_settings").insert([defaultSettings]).select().single();
          if (insertError) {
            console.error("Erro ao criar configurações:", insertError);
            return;
          }
          setSettings(newData);
          return;
        }
        throw error;
      }
      setSettings(data);
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const buildSchema = () => {
    const schemaFields: Record<string, z.ZodType<any>> = {};
    questions.forEach(q => {
      const isRequired = q.required !== false;
      if (q.field_name.toLowerCase().includes("whatsapp") || q.field_name.toLowerCase().includes("telefone")) {
        if (isRequired) {
          schemaFields[q.field_name] = z.string()
            .regex(/^55 \(\d{2}\) \d{5}-\d{4}$/, "Telefone inválido. Use o formato 55 (99) 99999-9999")
            .refine(val => {
              const cleaned = val.replace(/\D/g, "");
              return cleaned.length === 13;
            }, { message: "Telefone deve ter 11 dígitos + código do país" })
            .refine(val => {
              const ddd = val.match(/\((\d{2})\)/)?.[1];
              if (!ddd) return false;
              const dddNum = parseInt(ddd);
              return dddNum >= 11 && dddNum <= 99;
            }, { message: "DDD inválido. Use um DDD brasileiro válido" })
            .refine(val => {
              const ninthDigit = val.match(/\) (\d)/)?.[1];
              return ninthDigit === "9";
            }, { message: "Número de celular deve começar com 9 após o DDD" });
        } else {
          schemaFields[q.field_name] = z.string();
        }
      } else if (q.field_name.toLowerCase().includes("placa")) {
        if (isRequired) {
          schemaFields[q.field_name] = z.string()
            .transform(val => val.replace(/-/g, ""))
            .refine(val => /^[A-Z]{3}\d[A-Z]\d{2}$|^[A-Z]{3}\d{4}$/.test(val), "Placa inválida. Use formato Mercosul (ABC-1D23) ou antigo (ABC-1234)")
            .refine(val => val.length === 7, "Placa deve ter exatamente 7 caracteres");
        } else {
          schemaFields[q.field_name] = z.string();
        }
      } else if (q.field_name.toLowerCase().includes("cpf")) {
        if (isRequired) {
          schemaFields[q.field_name] = z.string()
            .refine(val => {
              const cleaned = val.replace(/\D/g, "");
              return cleaned.length === 11;
            }, "CPF deve ter 11 dígitos")
            .refine(val => {
              const cleaned = val.replace(/\D/g, "");
              if (/^(\d)\1+$/.test(cleaned)) return false;
              let sum = 0;
              for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
              let d1 = sum * 10 % 11;
              if (d1 === 10) d1 = 0;
              if (d1 !== parseInt(cleaned[9])) return false;
              sum = 0;
              for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
              let d2 = sum * 10 % 11;
              if (d2 === 10) d2 = 0;
              return d2 === parseInt(cleaned[10]);
            }, "CPF inválido");
        } else {
          schemaFields[q.field_name] = z.string();
        }
      } else if (q.field_name.toLowerCase().includes("cnpj")) {
        if (isRequired) {
          schemaFields[q.field_name] = z.string()
            .refine(val => {
              const cleaned = val.replace(/\D/g, "");
              return cleaned.length === 14;
            }, "CNPJ deve ter 14 dígitos")
            .refine(val => {
              const cleaned = val.replace(/\D/g, "");
              if (/^(\d)\1+$/.test(cleaned)) return false;
              const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
              let sum = 0;
              for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * weights1[i];
              let d1 = sum % 11;
              d1 = d1 < 2 ? 0 : 11 - d1;
              if (d1 !== parseInt(cleaned[12])) return false;
              const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
              sum = 0;
              for (let i = 0; i < 13; i++) sum += parseInt(cleaned[i]) * weights2[i];
              let d2 = sum % 11;
              d2 = d2 < 2 ? 0 : 11 - d2;
              return d2 === parseInt(cleaned[13]);
            }, "CNPJ inválido");
        } else {
          schemaFields[q.field_name] = z.string();
        }
      } else if (q.field_name.toLowerCase().includes("email")) {
        if (isRequired) {
          schemaFields[q.field_name] = z.string().email("Email inválido").max(255);
        } else {
          schemaFields[q.field_name] = z.string().email("Email inválido").max(255).or(z.literal(""));
        }
      } else if (q.input_type === "select" && q.options.length > 0) {
        if (isRequired) {
          schemaFields[q.field_name] = z.string().min(1, "Selecione uma opção");
        } else {
          schemaFields[q.field_name] = z.string();
        }
      } else {
        if (isRequired) {
          let schema = z.string().min(1, "Campo obrigatório");
          if (q.max_length && q.max_length > 0) {
            schema = schema.max(q.max_length, `Máximo de ${q.max_length} caracteres`);
          } else {
            schema = schema.max(200);
          }
          schemaFields[q.field_name] = schema;
        } else {
          let schema = z.string();
          if (q.max_length && q.max_length > 0) {
            schema = schema.max(q.max_length, `Máximo de ${q.max_length} caracteres`);
          } else {
            schema = schema.max(200);
          }
          schemaFields[q.field_name] = schema;
        }
      }
    });
    return z.object(schemaFields);
  };

  const formSchema = buildSchema();
  type FormData = z.infer<typeof formSchema>;

  const defaultValues = questions.reduce((acc, q) => {
    if (q.field_name.toLowerCase().includes("whatsapp") || q.field_name.toLowerCase().includes("telefone")) {
      acc[q.field_name] = "55 ";
    } else {
      acc[q.field_name] = "";
    }
    return acc;
  }, {} as Record<string, string>);

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange"
  });

  // Calculate unique steps for multi-question per step support
  const uniqueSteps = [...new Set(questions.map(q => q.step))].sort((a, b) => a - b);
  const totalSteps = uniqueSteps.length + 1;
  const currentStepNumber = uniqueSteps[step - 1];
  const currentQuestions = questions.filter(q => q.step === currentStepNumber);
  const progressPercentage = (step / uniqueSteps.length) * 100;

  const formatWhatsApp = (value: string) => {
    let cleaned = value.replace(/\D/g, "");
    if (cleaned.startsWith("55")) cleaned = cleaned.slice(2);
    if (cleaned.length === 0) return "55 ";
    if (cleaned.length <= 2) return `55 (${cleaned}`;
    if (cleaned.length <= 7) return `55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `55 (${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const formatPlaca = (value: string) => {
    let cleaned = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleaned.length > 7) cleaned = cleaned.slice(0, 7);
    if (cleaned.length <= 3) return cleaned;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  };

  const formatCPF = (value: string) => {
    let cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
    if (cleaned.length <= 9) return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  };

  const formatCNPJ = (value: string) => {
    let cleaned = value.replace(/\D/g, "");
    if (cleaned.length > 14) cleaned = cleaned.slice(0, 14);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
    if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  };

  const handleConditionalLogic = (question: Question, value: string) => {
    if (!question?.conditional_logic?.conditions) return null;
    const condition = question.conditional_logic.conditions.find(c => c.value === value);
    return condition || null;
  };

  // Handle disqualification - show page without submitting
  const handleDisqualification = (targetPage: string) => {
    const successPage = successPages.find(p => p.page_key === targetPage);
    if (successPage) {
      setActiveSuccessPage(successPage);
    }
    setIsDisqualified(true);
    setIsSuccess(true);
    setStep(totalSteps);

    // Track disqualification in analytics
    supabase.from("form_analytics").insert({
      session_id: sessionId,
      subdomain: formName,
      event_type: "lead_disqualified",
      step_reached: step,
      partial_data: form.getValues()
    }).then(({ error }) => {
      if (error) console.error("Error tracking disqualification:", error);
    });

    // Clear session storage
    sessionStorage.removeItem(`form_session_${formName}`);
  };

  const nextStep = async () => {
    if (!currentQuestions || currentQuestions.length === 0) return;

    let allValid = true;
    for (const question of currentQuestions) {
      const isRequired = question.required !== false;
      const value = form.watch(question.field_name);

      if (!isRequired && (!value || value.trim() === '' || value === '55 ')) {
        continue;
      }
      const isValid = await form.trigger(question.field_name);
      if (!isValid) {
        allValid = false;
      }
    }
    if (!allValid) return;

    // Check for conditional logic on any question in this step
    for (const question of currentQuestions) {
      const value = form.watch(question.field_name);
      const condition = handleConditionalLogic(question, value);
      if (condition) {
        if (condition.action === "disqualify_page" && condition.target_page) {
          handleDisqualification(condition.target_page);
          return;
        } else if (condition.action === "success_page" && condition.target_page) {
          const successPage = successPages.find(p => p.page_key === condition.target_page);
          if (successPage) {
            setActiveSuccessPage(successPage);
          }
          shouldFireGtmRef.current = false;
          form.handleSubmit(onSubmit)();
          return;
        } else if (condition.action === "skip_to_step" && condition.target_step) {
          const targetIndex = uniqueSteps.findIndex(s => s === condition.target_step);
          if (targetIndex !== -1) {
            setAnimationKey(prev => prev + 1);
            setStep(targetIndex + 1);
            return;
          }
        }
      }
    }

    // Default: go to next step with animation
    if (step < totalSteps) {
      setAnimationKey(prev => prev + 1);
      setStep(step + 1);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step < uniqueSteps.length) {
        await nextStep();
      } else {
        shouldFireGtmRef.current = true;
        form.handleSubmit(onSubmit)();
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setAnimationKey(prev => prev + 1);
      setStep(step - 1);
    }
  };

  const getUtmParams = () => {
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const utmParams: Record<string, string> = {};
    utmKeys.forEach(key => {
      const value = searchParams.get(key);
      if (value) {
        utmParams[key] = value;
      }
    });

    if (typeof window !== "undefined") {
      utmParams.page_url = window.location.href;
      utmParams.page_referrer = document.referrer || "";
    }
    return utmParams;
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const utmParams = getUtmParams();
      const edgeFunctionName = formName === "autoprotecta" ? "enviar-conversao-autoprotecta" : formName === "educa" ? "enviar-conversao-educa" : "enviar-conversao";

      const { data: responseData, error } = await supabase.functions.invoke(edgeFunctionName, {
        body: {
          ...data,
          ...utmParams,
          form_name: formName,
          timestamp: new Date().toISOString()
        }
      });
      if (error) console.error("Webhook error:", error);

      if (responseData?.whatsapp_redirecionado) {
        setRotatedWhatsApp({
          number: responseData.whatsapp_redirecionado,
          name: responseData.vendedor_nome || ""
        });
      }

      if (shouldFireGtmRef.current && typeof window !== "undefined") {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          event: "gtm.formSubmit",
          form_nome: formName,
          lead_nome: data.nome || data.name || "",
          lead_email: data.email || "",
          lead_telefone: data.telefone || data.phone || "",
          ...utmParams,
          timestamp: new Date().toISOString()
        });
      }

      shouldFireGtmRef.current = false;

      supabase.from("form_analytics").insert({
        session_id: sessionId,
        subdomain: formName,
        event_type: "form_completed",
        step_reached: uniqueSteps.length
      }).then(({ error }) => {
        if (error) console.error("Error tracking form completion:", error);
      });

      sessionStorage.removeItem(`form_session_${formName}`);
      setSubmittedData(data);
      setIsSuccess(true);
      setStep(totalSteps);
    } catch (error) {
      console.error("Erro ao enviar", error);
      toast({
        title: "Erro ao enviar cadastro",
        description: "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Option letter generator (A, B, C, D...)
  const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

  const renderQuestionInput = (question: Question, isFirst: boolean) => {
    const handleButtonClick = async (option: string) => {
      form.setValue(question.field_name, option);

      const condition = question.conditional_logic?.conditions?.find(c => c.value === option);
      if (condition) {
        if (condition.action === "disqualify_page" && condition.target_page) {
          setTimeout(() => handleDisqualification(condition.target_page!), 300);
          return;
        } else if (condition.action === "success_page" && condition.target_page) {
          const successPage = successPages.find(p => p.page_key === condition.target_page);
          if (successPage) {
            setActiveSuccessPage(successPage);
          }
          shouldFireGtmRef.current = false;
          setTimeout(() => form.handleSubmit(onSubmit)(), 300);
          return;
        } else if (condition.action === "skip_to_step" && condition.target_step) {
          const targetIndex = uniqueSteps.findIndex(s => s === condition.target_step);
          if (targetIndex !== -1) {
            setTimeout(() => {
              setAnimationKey(prev => prev + 1);
              setStep(targetIndex + 1);
            }, 300);
            return;
          }
        }
      }

      if (currentQuestions.length === 1 && step < uniqueSteps.length) {
        setTimeout(() => nextStep(), 300);
      }
    };

    const handleSelectChange = async (value: string) => {
      form.setValue(question.field_name, value);

      const condition = question.conditional_logic?.conditions?.find(c => c.value === value);
      if (condition) {
        if (condition.action === "disqualify_page" && condition.target_page) {
          setTimeout(() => handleDisqualification(condition.target_page!), 300);
          return;
        } else if (condition.action === "success_page" && condition.target_page) {
          const successPage = successPages.find(p => p.page_key === condition.target_page);
          if (successPage) {
            setActiveSuccessPage(successPage);
          }
          shouldFireGtmRef.current = false;
          setTimeout(() => form.handleSubmit(onSubmit)(), 300);
          return;
        } else if (condition.action === "skip_to_step" && condition.target_step) {
          const targetIndex = uniqueSteps.findIndex(s => s === condition.target_step);
          if (targetIndex !== -1) {
            setTimeout(() => {
              setAnimationKey(prev => prev + 1);
              setStep(targetIndex + 1);
            }, 300);
            return;
          }
        }
      }

      if (currentQuestions.length === 1 && step < uniqueSteps.length) {
        setTimeout(() => nextStep(), 300);
      }
    };

    const fieldValue = form.watch(question.field_name);
    const fieldState = form.getFieldState(question.field_name, form.formState);
    const isRequired = question.required !== false;
    const hasValue = fieldValue && fieldValue.trim() !== '' && fieldValue !== '55 ';
    const isValid = hasValue && !fieldState.invalid;
    const isInvalid = hasValue && fieldState.invalid;

    const getValidationFeedback = () => {
      const fieldName = question.field_name.toLowerCase();
      if (fieldName.includes("cpf")) return { valid: "CPF válido!", invalid: "CPF inválido" };
      if (fieldName.includes("cnpj")) return { valid: "CNPJ válido!", invalid: "CNPJ inválido" };
      if (fieldName.includes("email")) return { valid: "Email válido!", invalid: "Email inválido" };
      if (fieldName.includes("whatsapp") || fieldName.includes("telefone")) return { valid: "Telefone válido!", invalid: "Telefone inválido" };
      if (fieldName.includes("placa")) return { valid: "Placa válida!", invalid: "Placa inválida" };
      return { valid: "Campo válido!", invalid: "Campo inválido" };
    };

    const feedback = getValidationFeedback();

    return (
      <div key={question.id} className="space-y-6">
        {/* Question Header - Typeform style */}
        <div className="space-y-2">
          <h2 className="typeform-question">{question.question}</h2>
          {question.subtitle && (
            <p className="typeform-subtitle">{question.subtitle}</p>
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          {question.input_type === "buttons" && question.options.length > 0 ? (
            <div className="grid gap-3">
              {question.options.map((option, idx) => {
                const isSelected = form.watch(question.field_name) === option;
                return (
                  <button
                    key={option}
                    type="button"
                    className={`typeform-option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleButtonClick(option)}
                  >
                    <span className="option-letter">{getOptionLetter(idx)}</span>
                    <span className="text-base md:text-lg font-medium">{option}</span>
                    {isSelected && (
                      <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : question.input_type === "select" && question.options.length > 0 ? (
            <Select
              key={`select-${question.field_name}-${step}`}
              value={form.watch(question.field_name)}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className="typeform-input">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {question.options.map(option => (
                  <SelectItem key={option} value={option} className="text-base py-3">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="relative">
              <Input
                key={`input-${question.field_name}-${step}`}
                type={
                  question.input_type === "password" ? "text" :
                  question.field_name.toLowerCase().includes("email") ? "email" :
                  question.field_name.toLowerCase().includes("whatsapp") || question.field_name.toLowerCase().includes("telefone") ? "tel" :
                  "text"
                }
                placeholder={
                  question.input_placeholder ||
                  (question.field_name.toLowerCase().includes("whatsapp") || question.field_name.toLowerCase().includes("telefone") ? "55 (99) 99999-9999" :
                  question.field_name.toLowerCase().includes("placa") ? "ABC-1D23" :
                  question.field_name.toLowerCase().includes("cpf") ? "000.000.000-00" :
                  question.field_name.toLowerCase().includes("cnpj") ? "00.000.000/0000-00" :
                  `Digite sua resposta aqui...`)
                }
                className={`typeform-input ${isValid ? 'valid' : isInvalid ? 'invalid' : ''} ${
                  question.field_name.toLowerCase().includes("placa") ? 'uppercase' : ''
                }`}
                autoFocus={isFirst}
                autoComplete="off"
                maxLength={
                  question.max_length ||
                  (question.field_name.toLowerCase().includes("whatsapp") || question.field_name.toLowerCase().includes("telefone") ? 19 :
                  question.field_name.toLowerCase().includes("placa") ? 8 :
                  question.field_name.toLowerCase().includes("cpf") ? 14 :
                  question.field_name.toLowerCase().includes("cnpj") ? 18 : undefined)
                }
                value={form.watch(question.field_name) || (
                  question.field_name.toLowerCase().includes("whatsapp") || question.field_name.toLowerCase().includes("telefone") ? "55 " : ""
                )}
                onChange={e => {
                  let formatted = e.target.value;
                  const fieldName = question.field_name.toLowerCase();
                  
                  if (fieldName.includes("whatsapp") || fieldName.includes("telefone")) {
                    formatted = formatWhatsApp(e.target.value);
                  } else if (fieldName.includes("placa")) {
                    formatted = formatPlaca(e.target.value);
                  } else if (fieldName.includes("cpf")) {
                    formatted = formatCPF(e.target.value);
                  } else if (fieldName.includes("cnpj")) {
                    formatted = formatCNPJ(e.target.value);
                  }
                  
                  form.setValue(question.field_name, formatted, { shouldValidate: true });
                }}
                onKeyDown={handleKeyDown}
              />
              {isValid && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 rounded-full p-1.5">
                  <Check className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          )}

          {/* Validation feedback */}
          {hasValue && isRequired && (
            isValid ? (
              <p className="text-green-600 text-sm flex items-center gap-1.5 animate-fade-in-up">
                <Check className="h-4 w-4" />
                {feedback.valid}
              </p>
            ) : isInvalid ? (
              <p className="text-destructive text-sm flex items-center gap-1.5 animate-fade-in-up">
                <X className="h-4 w-4" />
                {form.formState.errors[question.field_name]?.message as string || feedback.invalid}
              </p>
            ) : null
          )}

          {/* Keyboard hint for text inputs */}
          {question.input_type !== "buttons" && question.input_type !== "select" && (
            <div className="keyboard-hint mt-4">
              Pressione <kbd>Enter ↵</kbd> para continuar
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSuccessPage = () => {
    const nomeQuestion = questions.find(q => q.field_name === "nome");
    const firstName = nomeQuestion && submittedData ? submittedData[nomeQuestion.field_name]?.split(" ")[0] : "você";
    const successConfig = activeSuccessPage || settings;

    return (
      <div className="space-y-8 text-center max-w-lg mx-auto">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="typeform-success-icon">
            <CheckCircle />
          </div>
        </div>

        {/* Success Message */}
        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {isDisqualified ? (successConfig?.title || "Obrigado pela participação") : `Obrigado, ${firstName}!`}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            {successConfig?.description || "Recebemos suas informações com sucesso. Em breve entraremos em contato."}
          </p>
        </div>

        {/* WhatsApp Button */}
        {successConfig?.whatsapp_enabled && !isDisqualified && (
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Button
              type="button"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                trackWhatsAppClick();
                const phoneNumber = rotatedWhatsApp?.number 
                  ? rotatedWhatsApp.number.replace(/\D/g, "") 
                  : (successConfig.whatsapp_number || "").replace(/\D/g, "");
                const message = encodeURIComponent(successConfig.whatsapp_message || "Olá! Preenchi o formulário.");
                window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
              }}
              className="w-full h-16 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold rounded-2xl transition-all duration-200 hover:scale-[1.02]"
            >
              <MessageCircle className="w-6 h-6 mr-3" />
              Continuar no WhatsApp
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              Você será redirecionado para o WhatsApp.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderStep = () => {
    if (step === totalSteps && isSuccess) {
      return renderSuccessPage();
    }
    if (!currentQuestions || currentQuestions.length === 0) return null;
    
    return (
      <div key={animationKey} className="space-y-8 step-transition-enter">
        {currentQuestions.map((question, index) => renderQuestionInput(question, index === 0))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="typeform-container">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="typeform-container">
        <div className="text-center max-w-md">
          <p className="text-xl text-muted-foreground">Nenhuma pergunta configurada ainda.</p>
          <p className="text-base text-muted-foreground mt-2">
            Entre em contato conosco para mais informações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="typeform-container">
      {/* Progress Bar - Fixed at top */}
      {step < totalSteps && (
        <div className="typeform-progress">
          <div 
            className="typeform-progress-bar" 
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Step Counter */}
        {step < totalSteps && (
          <div className="mb-8 flex items-center justify-between">
            <span className="text-sm font-semibold text-primary">
              Pergunta {step} de {uniqueSteps.length}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(progressPercentage)}% completo
            </span>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={e => e.preventDefault()}>
          <div className="min-h-[300px] flex flex-col justify-center">
            {renderStep()}
          </div>

          {/* Navigation */}
          {step < totalSteps && (
            <div className="mt-12 flex items-center justify-between gap-4">
              {/* Back Button */}
              <div className="w-24">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={isSubmitting}
                    className="typeform-nav-arrow"
                    aria-label="Voltar"
                  >
                    <ChevronUp className="h-6 w-6 rotate-[-90deg]" />
                  </button>
                )}
              </div>

              {/* Continue / Submit Button */}
              <div className="flex-1 max-w-sm">
                {step < uniqueSteps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={isSubmitting || !currentQuestions.every(q => {
                      const value = form.watch(q.field_name);
                      const isRequired = q.required !== false;
                      if (!isRequired) return true;
                      if (!value || value.trim() === '' || value === '55 ') return false;
                      const fieldState = form.getFieldState(q.field_name);
                      return !fieldState.invalid;
                    })}
                    className="typeform-button-primary w-full"
                  >
                    Continuar
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      shouldFireGtmRef.current = true;
                      form.handleSubmit(onSubmit)();
                    }}
                    className="typeform-button-primary w-full"
                    disabled={isSubmitting || !currentQuestions.every(q => {
                      const value = form.watch(q.field_name);
                      const isRequired = q.required !== false;
                      if (!isRequired) return true;
                      if (!value || value.trim() === '' || value === '55 ') return false;
                      const fieldState = form.getFieldState(q.field_name);
                      return !fieldState.invalid;
                    })}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        Finalizar
                        <Check className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Spacer for alignment */}
              <div className="w-24" />
            </div>
          )}
        </form>
      </div>

      {/* Keyboard Navigation Hint */}
      {step < totalSteps && (
        <div className="fixed bottom-6 right-6 hidden md:flex items-center gap-2">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className="typeform-nav-arrow disabled:opacity-30"
            aria-label="Pergunta anterior"
          >
            <ChevronUp className="h-5 w-5" />
          </button>
          <button
            onClick={nextStep}
            className="typeform-nav-arrow"
            aria-label="Próxima pergunta"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};
