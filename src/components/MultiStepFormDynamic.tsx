// Arquivo: MultiStepFormDynamic.tsx - UX Conversacional estilo Typeform
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
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, MessageCircle } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp.png";

interface ConditionalRule {
  value: string;
  action: "skip_to_step" | "success_page";
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

// Mensagens de encorajamento entre etapas
const encouragementMessages = [
  "Ótimo! Vamos continuar...",
  "Perfeito! Falta pouco...",
  "Excelente! Continue assim...",
  "Muito bem! Quase lá...",
  "Legal! Só mais algumas perguntas..."
];

const getEncouragementMessage = (currentStep: number, totalSteps: number) => {
  if (currentStep >= totalSteps - 1) return "Última etapa!";
  return encouragementMessages[currentStep % encouragementMessages.length];
};

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
  const [rotatedWhatsApp, setRotatedWhatsApp] = useState<{ number: string; name: string } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showEncouragement, setShowEncouragement] = useState(false);
  
  const { toast } = useToast();
  const formName = import.meta.env.VITE_FORM_NAME || "default";
  const shouldFireGtmRef = useRef(false);
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  // Track form start
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
          
          navigator.sendBeacon(
            `${supabaseUrl}/functions/v1/salvar-parcial`,
            JSON.stringify({
              sessionId: data.sessionId,
              subdomain: formName,
              stepReached: data.stepReached,
              partialData: data.partialData
            })
          );
        } catch (e) {
          console.error("Error sending partial data:", e);
        }
      }
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formName, isSuccess]);

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
      const { data, error } = await supabase
        .from("form_questions")
        .select("*")
        .eq("subdomain", formName)
        .order("step", { ascending: true });
      
      if (error) throw error;
      
      const transformedData = (data || []).map(item => ({
        ...item,
        options: Array.isArray(item.options) ? item.options as string[] : [],
        input_type: (["select", "text", "password", "buttons"].includes(item.input_type) 
          ? item.input_type 
          : "text") as "text" | "select" | "password" | "buttons",
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
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("subdomain", formName)
        .single();
      
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
          const { data: newData, error: insertError } = await supabase
            .from("app_settings")
            .insert([defaultSettings])
            .select()
            .single();
          
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

  const uniqueSteps = [...new Set(questions.map(q => q.step))].sort((a, b) => a - b);
  const totalSteps = uniqueSteps.length + 1;
  const currentStepNumber = uniqueSteps[step - 1];
  const currentQuestions = questions.filter(q => q.step === currentStepNumber);
  const progressPercentage = Math.round((step / uniqueSteps.length) * 100);

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

  // Transição suave entre etapas
  const transitionToStep = (newStep: number) => {
    setIsTransitioning(true);
    setShowEncouragement(true);
    
    setTimeout(() => {
      setStep(newStep);
      setShowEncouragement(false);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 100);
    }, 600);
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

    for (const question of currentQuestions) {
      const value = form.watch(question.field_name);
      const condition = handleConditionalLogic(question, value);
      if (condition) {
        if (condition.action === "success_page" && condition.target_page) {
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
            transitionToStep(targetIndex + 1);
            return;
          }
        }
      }
    }

    if (step < totalSteps) {
      transitionToStep(step + 1);
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
      setIsTransitioning(true);
      setTimeout(() => {
        setStep(step - 1);
        setTimeout(() => setIsTransitioning(false), 100);
      }, 200);
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
      const edgeFunctionName = formName === "autoprotecta" 
        ? "enviar-conversao-autoprotecta" 
        : formName === "educa" 
          ? "enviar-conversao-educa" 
          : "enviar-conversao";

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
        title: "Erro ao enviar",
        description: "Não se preocupe, tente novamente em alguns instantes.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderQuestionInput = (question: Question, isFirst: boolean) => {
    const handleButtonClick = async (option: string) => {
      form.setValue(question.field_name, option);

      const condition = question.conditional_logic?.conditions?.find(c => c.value === option);
      if (condition) {
        if (condition.action === "success_page" && condition.target_page) {
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
            setTimeout(() => transitionToStep(targetIndex + 1), 300);
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
        if (condition.action === "success_page" && condition.target_page) {
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
            setTimeout(() => transitionToStep(targetIndex + 1), 300);
            return;
          }
        }
      }

      if (currentQuestions.length === 1 && step < uniqueSteps.length) {
        setTimeout(() => nextStep(), 300);
      }
    };

    const inputClasses = "h-14 text-lg border-2 border-muted focus:border-primary transition-colors duration-200 rounded-xl";
    const errorMessage = form.formState.errors[question.field_name]?.message as string;

    return (
      <div key={question.id} className="space-y-6">
        {/* Pergunta conversacional */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground leading-tight">
            {question.question}
          </h2>
          {question.subtitle && (
            <p className="text-base md:text-lg text-muted-foreground">
              {question.subtitle}
            </p>
          )}
        </div>

        {/* Campo de entrada */}
        <div className="space-y-3">
          {question.input_type === "buttons" && question.options.length > 0 ? (
            <div className="grid gap-3">
              {question.options.map(option => {
                const isSelected = form.watch(question.field_name) === option;
                return (
                  <Button
                    key={option}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className={`h-auto min-h-[56px] text-base md:text-lg py-4 px-6 rounded-xl border-2 transition-all duration-200 whitespace-normal text-left justify-start ${
                      isSelected 
                        ? "border-primary shadow-md" 
                        : "border-muted hover:border-primary/50 hover:bg-muted/30"
                    }`}
                    onClick={() => handleButtonClick(option)}
                  >
                    <span className="flex items-center gap-3">
                      {isSelected && <CheckCircle className="h-5 w-5 shrink-0" />}
                      {option}
                    </span>
                  </Button>
                );
              })}
            </div>
          ) : question.input_type === "select" && question.options.length > 0 ? (
            <Select
              key={`select-${question.field_name}-${step}`}
              value={form.watch(question.field_name)}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger className={`${inputClasses}`}>
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
          ) : question.field_name.toLowerCase().includes("whatsapp") || question.field_name.toLowerCase().includes("telefone") ? (
            <Input
              key={`input-${question.field_name}-${step}`}
              type="tel"
              placeholder={question.input_placeholder || "55 (99) 99999-9999"}
              className={inputClasses}
              autoFocus={isFirst}
              autoComplete="off"
              maxLength={question.max_length || 19}
              value={form.watch(question.field_name) || "55 "}
              onChange={e => {
                const formatted = formatWhatsApp(e.target.value);
                form.setValue(question.field_name, formatted, { shouldValidate: true });
              }}
              onKeyDown={handleKeyDown}
            />
          ) : question.field_name.toLowerCase().includes("placa") ? (
            <Input
              key={`input-${question.field_name}-${step}`}
              type="text"
              placeholder={question.input_placeholder || "ABC-1D23"}
              className={`${inputClasses} uppercase`}
              autoFocus={isFirst}
              autoComplete="off"
              maxLength={8}
              value={form.watch(question.field_name) || ""}
              onChange={e => {
                const formatted = formatPlaca(e.target.value);
                form.setValue(question.field_name, formatted, { shouldValidate: true });
              }}
              onKeyDown={handleKeyDown}
            />
          ) : question.field_name.toLowerCase().includes("cpf") ? (
            <Input
              key={`input-${question.field_name}-${step}`}
              type="text"
              placeholder={question.input_placeholder || "000.000.000-00"}
              className={inputClasses}
              autoFocus={isFirst}
              autoComplete="off"
              maxLength={14}
              value={form.watch(question.field_name) || ""}
              onChange={e => {
                const formatted = formatCPF(e.target.value);
                form.setValue(question.field_name, formatted, { shouldValidate: true });
              }}
              onKeyDown={handleKeyDown}
            />
          ) : question.field_name.toLowerCase().includes("cnpj") ? (
            <Input
              key={`input-${question.field_name}-${step}`}
              type="text"
              placeholder={question.input_placeholder || "00.000.000/0000-00"}
              className={inputClasses}
              autoFocus={isFirst}
              autoComplete="off"
              maxLength={18}
              value={form.watch(question.field_name) || ""}
              onChange={e => {
                const formatted = formatCNPJ(e.target.value);
                form.setValue(question.field_name, formatted, { shouldValidate: true });
              }}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <Input
              key={`input-${question.field_name}-${step}`}
              type={question.field_name.toLowerCase().includes("email") ? "email" : "text"}
              placeholder={question.input_placeholder || `Digite aqui...`}
              className={inputClasses}
              autoFocus={isFirst}
              autoComplete="off"
              maxLength={question.max_length || undefined}
              value={form.watch(question.field_name) || ""}
              onChange={e => form.setValue(question.field_name, e.target.value, { shouldValidate: true })}
              onKeyDown={handleKeyDown}
            />
          )}

          {/* Mensagem de erro educativa */}
          {errorMessage && (
            <p className="text-destructive text-sm flex items-center gap-2">
              <span className="shrink-0">💡</span>
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Página de sucesso com WhatsApp
  const renderSuccessPage = () => {
    const nomeQuestion = questions.find(q => q.field_name === "nome");
    const firstName = nomeQuestion ? submittedData[nomeQuestion.field_name]?.split(" ")[0] : "";
    const successConfig = activeSuccessPage || settings;

    return (
      <div className="space-y-8 text-center py-8 animate-fadeInUp">
        {/* Ícone de sucesso */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
        </div>

        {/* Título conversacional */}
        <div className="space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            {firstName ? `${successConfig?.success_title || successConfig?.title || "Perfeito"}, ${firstName}!` : (successConfig?.success_title || successConfig?.title || "Perfeito!")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {successConfig?.success_description || successConfig?.description || "Recebemos suas informações!"}
          </p>
        </div>

        {/* Transição para WhatsApp */}
        {successConfig?.whatsapp_enabled && (
          <div className="bg-card border border-border rounded-2xl p-8 space-y-6 max-w-md mx-auto shadow-sm">
            {/* Ícone WhatsApp */}
            <div className="flex justify-center">
              <img src={whatsappIcon} alt="WhatsApp" className="w-14 h-14" />
            </div>

            {/* Mensagem de continuidade */}
            <div className="space-y-2">
              <p className="text-foreground font-medium text-lg">
                {successConfig?.success_subtitle || successConfig?.subtitle || "Vamos continuar nossa conversa?"}
              </p>
              <p className="text-muted-foreground text-sm">
                Clique abaixo para falar diretamente com nossa equipe
              </p>
            </div>

            {/* Botão CTA principal */}
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
              className="w-full h-14 bg-success hover:bg-success/90 text-success-foreground text-lg font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3"
            >
              <MessageCircle className="w-5 h-5" />
              Continuar conversa no WhatsApp
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderStep = () => {
    if (step === totalSteps && isSuccess && submittedData) {
      return renderSuccessPage();
    }
    if (!currentQuestions || currentQuestions.length === 0) return null;
    
    return (
      <div className={`space-y-8 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {currentQuestions.map((question, index) => renderQuestionInput(question, index === 0))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto px-6 py-12">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Preparando formulário...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto px-6 py-12">
        <div className="text-center space-y-3">
          <p className="text-lg text-muted-foreground">Nenhuma pergunta configurada ainda.</p>
          <p className="text-sm text-muted-foreground">
            Entre em contato conosco para mais informações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-8" style={{ backgroundColor: '#F7F7F7' }}>
      {/* Barra de progresso com % e etapa */}
      {step < totalSteps && (
        <div className="mb-6">
          {/* Indicador de etapa e porcentagem */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Etapa {step} de {uniqueSteps.length}
            </span>
            <span className="text-sm font-medium text-primary">
              {progressPercentage}%
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Mensagem de encorajamento */}
          <div className={`mt-3 text-center transition-all duration-300 ${showEncouragement ? 'opacity-100' : 'opacity-0'}`}>
            <p className="text-primary font-medium text-sm">
              {getEncouragementMessage(step, uniqueSteps.length)}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="min-h-[300px] mb-8">
          {renderStep()}
        </div>

        {/* Botões de navegação */}
        {step < totalSteps && (
          <div className="flex gap-4">
            {step > 1 && (
              <Button
                type="button"
                variant="ghost"
                onClick={prevStep}
                className="h-14 px-6 text-base text-muted-foreground hover:text-foreground"
                disabled={isSubmitting || isTransitioning}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}

            <div className="flex-1" />

            {step < uniqueSteps.length ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={isSubmitting || isTransitioning}
                className="h-16 px-10 text-lg font-semibold rounded-xl min-w-[180px]"
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
                className="h-16 px-10 text-lg font-semibold rounded-xl min-w-[180px]"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Finalizar"
                )}
              </Button>
            )}
          </div>
        )}
      </form>
    </div>
  );
};
