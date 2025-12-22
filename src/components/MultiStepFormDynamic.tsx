// Arquivo corrigido: MultiStepFormDynamic.tsx
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
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import whatsappIcon from "@/assets/whatsapp.png";
import { Progress } from "@/components/ui/progress";
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
  const {
    toast
  } = useToast();
  const formName = import.meta.env.VITE_FORM_NAME || "default";

  // Flag to track if GTM should fire (only on real final submit)
  const shouldFireGtmRef = useRef(false);

  // Generate unique session ID for analytics tracking
  const sessionId = useMemo(() => crypto.randomUUID(), []);

  // Track form start (only once)
  useEffect(() => {
    const storageKey = `form_session_${formName}`;
    const existingSession = sessionStorage.getItem(storageKey);

    // Only track if this is a new session
    if (!existingSession) {
      sessionStorage.setItem(storageKey, JSON.stringify({
        sessionId,
        startedAt: new Date().toISOString(),
        stepReached: 1,
        partialData: {}
      }));

      // Send form_started event to analytics
      supabase.from("form_analytics").insert({
        session_id: sessionId,
        subdomain: formName,
        event_type: "form_started",
        step_reached: 1
      }).then(({
        error
      }) => {
        if (error) console.error("Error tracking form start:", error);
      });
    }
  }, [sessionId, formName]);

  // Update localStorage on step changes (no Supabase request)
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

  // Send partial data on page unload (using sendBeacon for reliability)
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
    }).then(({
      error
    }) => {
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
      const {
        data,
        error
      } = await supabase.from("success_pages").select("*").eq("subdomain", formName);
      if (error) throw error;
      setSuccessPages(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar páginas de sucesso:", error);
    }
  };
  const loadQuestions = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("form_questions").select("*").eq("subdomain", formName).order("step", {
        ascending: true
      });
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
      const {
        data,
        error
      } = await supabase.from("app_settings").select("*").eq("subdomain", formName).single();
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
          const {
            data: newData,
            error: insertError
          } = await supabase.from("app_settings").insert([defaultSettings]).select().single();
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
          schemaFields[q.field_name] = z.string().regex(/^55 \(\d{2}\) \d{5}-\d{4}$/, "Telefone inválido. Use o formato 55 (99) 99999-9999").refine(val => {
            const cleaned = val.replace(/\D/g, "");
            return cleaned.length === 13;
          }, {
            message: "Telefone deve ter 11 dígitos + código do país"
          }).refine(val => {
            const ddd = val.match(/\((\d{2})\)/)?.[1];
            if (!ddd) return false;
            const dddNum = parseInt(ddd);
            return dddNum >= 11 && dddNum <= 99;
          }, {
            message: "DDD inválido. Use um DDD brasileiro válido"
          }).refine(val => {
            const ninthDigit = val.match(/\) (\d)/)?.[1];
            return ninthDigit === "9";
          }, {
            message: "Número de celular deve começar com 9 após o DDD"
          });
        } else {
          schemaFields[q.field_name] = z.string();
        }
      } else if (q.field_name.toLowerCase().includes("placa")) {
        if (isRequired) {
          schemaFields[q.field_name] = z.string().transform(val => val.replace(/-/g, "")) // Remove máscara para validação
          .refine(val => /^[A-Z]{3}\d[A-Z]\d{2}$|^[A-Z]{3}\d{4}$/.test(val), "Placa inválida. Use formato Mercosul (ABC-1D23) ou antigo (ABC-1234)").refine(val => val.length === 7, "Placa deve ter exatamente 7 caracteres");
        } else {
          schemaFields[q.field_name] = z.string();
        }
      } else if (q.field_name.toLowerCase().includes("cpf")) {
        if (isRequired) {
          schemaFields[q.field_name] = z.string().refine(val => {
            const cleaned = val.replace(/\D/g, "");
            return cleaned.length === 11;
          }, "CPF deve ter 11 dígitos").refine(val => {
            const cleaned = val.replace(/\D/g, "");
            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1+$/.test(cleaned)) return false;
            // Validação do primeiro dígito verificador
            let sum = 0;
            for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
            let d1 = sum * 10 % 11;
            if (d1 === 10) d1 = 0;
            if (d1 !== parseInt(cleaned[9])) return false;
            // Validação do segundo dígito verificador
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
          schemaFields[q.field_name] = z.string().refine(val => {
            const cleaned = val.replace(/\D/g, "");
            return cleaned.length === 14;
          }, "CNPJ deve ter 14 dígitos").refine(val => {
            const cleaned = val.replace(/\D/g, "");
            // Verifica se todos os dígitos são iguais
            if (/^(\d)\1+$/.test(cleaned)) return false;
            // Validação do primeiro dígito verificador
            const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
            let sum = 0;
            for (let i = 0; i < 12; i++) sum += parseInt(cleaned[i]) * weights1[i];
            let d1 = sum % 11;
            d1 = d1 < 2 ? 0 : 11 - d1;
            if (d1 !== parseInt(cleaned[12])) return false;
            // Validação do segundo dígito verificador
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
  const totalSteps = uniqueSteps.length + 1; // +1 for success page
  const currentStepNumber = uniqueSteps[step - 1];
  const currentQuestions = questions.filter(q => q.step === currentStepNumber);
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

    // Aplica máscara visual: ABC-1D23 ou ABC-1234
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
  const nextStep = async () => {
    if (!currentQuestions || currentQuestions.length === 0) return;

    // Validate all questions in current step
    let allValid = true;
    for (const question of currentQuestions) {
      const isRequired = question.required !== false;
      const value = form.watch(question.field_name);

      // Skip validation for optional empty fields
      if (!isRequired && (!value || value.trim() === '' || value === '55 ')) {
        continue;
      }
      const isValid = await form.trigger(question.field_name);
      if (!isValid) {
        allValid = false;
      }
    }
    if (!allValid) return;

    // Check for conditional logic on any question in this step (use first match)
    for (const question of currentQuestions) {
      const value = form.watch(question.field_name);
      const condition = handleConditionalLogic(question, value);
      if (condition) {
        if (condition.action === "success_page" && condition.target_page) {
          const successPage = successPages.find(p => p.page_key === condition.target_page);
          if (successPage) {
            setActiveSuccessPage(successPage);
          }
          shouldFireGtmRef.current = false; // Conditional logic, NOT final submit
          form.handleSubmit(onSubmit)();
          return;
        } else if (condition.action === "skip_to_step" && condition.target_step) {
          // Find which step index corresponds to target_step
          const targetIndex = uniqueSteps.findIndex(s => s === condition.target_step);
          if (targetIndex !== -1) {
            setStep(targetIndex + 1);
            return;
          }
        }
      }
    }

    // Default: go to next step
    if (step < totalSteps) setStep(step + 1);
  };
  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step < uniqueSteps.length) {
        await nextStep();
      } else {
        shouldFireGtmRef.current = true; // Enter on last step = final submit
        form.handleSubmit(onSubmit)();
      }
    }
  };
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // Captura parâmetros UTM da URL
  const getUtmParams = () => {
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    const utmParams: Record<string, string> = {};
    utmKeys.forEach(key => {
      const value = searchParams.get(key);
      if (value) {
        utmParams[key] = value;
      }
    });

    // Também captura a URL completa de origem
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

      // Seleciona edge function baseado no form_name
      const edgeFunctionName = formName === "autoprotecta" ? "enviar-conversao-autoprotecta" : formName === "educa" ? "enviar-conversao-educa" : "enviar-conversao";

      // Envia para edge function (que salva no banco E envia para webhook)
      const {
        data: responseData,
        error
      } = await supabase.functions.invoke(edgeFunctionName, {
        body: {
          ...data,
          ...utmParams,
          form_name: formName,
          timestamp: new Date().toISOString()
        }
      });
      if (error) console.error("Webhook error:", error);

      // Captura o número rotacionado retornado pela edge function
      if (responseData?.whatsapp_redirecionado) {
        setRotatedWhatsApp({
          number: responseData.whatsapp_redirecionado,
          name: responseData.vendedor_nome || ""
        });
      }

      // GTM event APENAS quando shouldFireGtmRef=true (botão Finalizar clicado)
      if (shouldFireGtmRef.current && typeof window !== "undefined") {
        (window as any).dataLayer = (window as any).dataLayer || [];
        (window as any).dataLayer.push({
          event: "gtm.formSubmit",
          form_nome: formName,
          ...utmParams,
          timestamp: new Date().toISOString()
        });
      }

      // Reset ref after use
      shouldFireGtmRef.current = false;

      // Track form_completed event
      supabase.from("form_analytics").insert({
        session_id: sessionId,
        subdomain: formName,
        event_type: "form_completed",
        step_reached: uniqueSteps.length
      }).then(({
        error
      }) => {
        if (error) console.error("Error tracking form completion:", error);
      });

      // Clear session storage on success
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
  const renderQuestionInput = (question: Question, isFirst: boolean) => {
    const handleButtonClick = async (option: string) => {
      form.setValue(question.field_name, option);

      // Check for conditional logic
      const condition = question.conditional_logic?.conditions?.find(c => c.value === option);
      if (condition) {
        if (condition.action === "success_page" && condition.target_page) {
          const successPage = successPages.find(p => p.page_key === condition.target_page);
          if (successPage) {
            setActiveSuccessPage(successPage);
          }
          shouldFireGtmRef.current = false; // Conditional logic, NOT final submit
          setTimeout(() => form.handleSubmit(onSubmit)(), 300);
          return;
        } else if (condition.action === "skip_to_step" && condition.target_step) {
          const targetIndex = uniqueSteps.findIndex(s => s === condition.target_step);
          if (targetIndex !== -1) {
            setTimeout(() => setStep(targetIndex + 1), 300);
            return;
          }
        }
      }

      // Only auto-advance if this is the only question in the step
      if (currentQuestions.length === 1 && step < uniqueSteps.length) {
        setTimeout(() => nextStep(), 300);
      }
    };
    const handleSelectChange = async (value: string) => {
      form.setValue(question.field_name, value);

      // Check for conditional logic
      const condition = question.conditional_logic?.conditions?.find(c => c.value === value);
      if (condition) {
        if (condition.action === "success_page" && condition.target_page) {
          const successPage = successPages.find(p => p.page_key === condition.target_page);
          if (successPage) {
            setActiveSuccessPage(successPage);
          }
          shouldFireGtmRef.current = false; // Conditional logic, NOT final submit
          setTimeout(() => form.handleSubmit(onSubmit)(), 300);
          return;
        } else if (condition.action === "skip_to_step" && condition.target_step) {
          const targetIndex = uniqueSteps.findIndex(s => s === condition.target_step);
          if (targetIndex !== -1) {
            setTimeout(() => setStep(targetIndex + 1), 300);
            return;
          }
        }
      }

      // Only auto-advance if this is the only question in the step
      if (currentQuestions.length === 1 && step < uniqueSteps.length) {
        setTimeout(() => nextStep(), 300);
      }
    };
    return <div key={question.id} className="space-y-4">
        <div>
          <h2 className="font-bold text-foreground md:text-4xl text-3xl text-left">{question.question}</h2>
          {question.subtitle && <label className="block font-medium text-muted-foreground mt-2 text-base">
              {question.subtitle}
            </label>}
        </div>

        <div className="space-y-2">
          {question.input_type === "buttons" && question.options.length > 0 ? <div className="grid gap-2">
              {question.options.map(option => {
            const isSelected = form.watch(question.field_name) === option;
            return <Button key={option} type="button" variant={isSelected ? "default" : "outline"} className={`h-auto min-h-[44px] text-base py-2 px-4 whitespace-normal text-left justify-start ${isSelected ? "" : "hover:bg-muted"}`} onClick={() => handleButtonClick(option)}>
                    {option}
                  </Button>;
          })}
            </div> : question.input_type === "select" && question.options.length > 0 ? <Select key={`select-${question.field_name}-${step}`} value={form.watch(question.field_name)} onValueChange={handleSelectChange}>
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>
              <SelectContent>
                {question.options.map(option => <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>)}
              </SelectContent>
            </Select> : question.input_type === "password" ? <Input key={`input-${question.field_name}-${step}`} type="text" placeholder={question.input_placeholder || `Digite ${question.question.toLowerCase()}`} className="h-12 text-base" autoFocus={isFirst} autoComplete="off" value={form.watch(question.field_name) || ""} onChange={e => form.setValue(question.field_name, e.target.value, {
          shouldValidate: true
        })} onKeyDown={handleKeyDown} /> : question.field_name.toLowerCase().includes("whatsapp") || question.field_name.toLowerCase().includes("telefone") ? <Input key={`input-${question.field_name}-${step}`} type="tel" placeholder={question.input_placeholder || "55 (99) 99999-9999"} className="h-12 text-base" autoFocus={isFirst} autoComplete="off" maxLength={question.max_length || 19} value={form.watch(question.field_name) || "55 "} onChange={e => {
          const formatted = formatWhatsApp(e.target.value);
          form.setValue(question.field_name, formatted, {
            shouldValidate: true
          });
        }} onKeyDown={handleKeyDown} /> : question.field_name.toLowerCase().includes("placa") ? <Input key={`input-${question.field_name}-${step}`} type="text" placeholder={question.input_placeholder || "ABC-1D23"} className="h-12 text-base uppercase" autoFocus={isFirst} autoComplete="off" maxLength={8} value={form.watch(question.field_name) || ""} onChange={e => {
          const formatted = formatPlaca(e.target.value);
          form.setValue(question.field_name, formatted, {
            shouldValidate: true
          });
        }} onKeyDown={handleKeyDown} /> : question.field_name.toLowerCase().includes("cpf") ? <Input key={`input-${question.field_name}-${step}`} type="text" placeholder={question.input_placeholder || "000.000.000-00"} className="h-12 text-base" autoFocus={isFirst} autoComplete="off" maxLength={14} value={form.watch(question.field_name) || ""} onChange={e => {
          const formatted = formatCPF(e.target.value);
          form.setValue(question.field_name, formatted, {
            shouldValidate: true
          });
        }} onKeyDown={handleKeyDown} /> : question.field_name.toLowerCase().includes("cnpj") ? <Input key={`input-${question.field_name}-${step}`} type="text" placeholder={question.input_placeholder || "00.000.000/0000-00"} className="h-12 text-base" autoFocus={isFirst} autoComplete="off" maxLength={18} value={form.watch(question.field_name) || ""} onChange={e => {
          const formatted = formatCNPJ(e.target.value);
          form.setValue(question.field_name, formatted, {
            shouldValidate: true
          });
        }} onKeyDown={handleKeyDown} /> : <Input key={`input-${question.field_name}-${step}`} type={question.field_name.toLowerCase().includes("email") ? "email" : "text"} placeholder={question.input_placeholder || `Digite ${question.question.toLowerCase()}`} className="h-12 text-base" autoFocus={isFirst} autoComplete="off" maxLength={question.max_length || undefined} value={form.watch(question.field_name) || ""} onChange={e => form.setValue(question.field_name, e.target.value, {
          shouldValidate: true
        })} onKeyDown={handleKeyDown} />}

          {form.formState.errors[question.field_name] && <p className="text-destructive text-sm mt-1">
              {form.formState.errors[question.field_name]?.message as string}
            </p>}
        </div>
      </div>;
  };
  const renderStep = () => {
    if (step === totalSteps && isSuccess && submittedData) {
      const nomeQuestion = questions.find(q => q.field_name === "nome");
      const firstName = nomeQuestion ? submittedData[nomeQuestion.field_name]?.split(" ")[0] : "você";

      // Use active success page if set, otherwise default settings
      const successConfig = activeSuccessPage || settings;
      return <div className="space-y-6 text-center">
          <div className="text-6xl">🎉</div>

          <div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {successConfig?.success_title || successConfig?.title || "Obrigado"}, {firstName}!
            </h2>

            <p className="text-lg text-muted-foreground">
              {successConfig?.success_description || successConfig?.description || "Recebemos suas informações com sucesso!"}
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-8 mt-6">
            <img src={whatsappIcon} alt="WhatsApp" className="w-16 h-16 mx-auto mb-4" />

            <p className="text-base text-foreground leading-relaxed mb-4">
              {successConfig?.success_subtitle || successConfig?.subtitle || "Em breve entraremos em contato."}
            </p>

            {successConfig?.whatsapp_enabled && <Button type="button" onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            trackWhatsAppClick();
            const phoneNumber = rotatedWhatsApp?.number ? rotatedWhatsApp.number.replace(/\D/g, "") : (successConfig.whatsapp_number || "").replace(/\D/g, "");
            const message = encodeURIComponent(successConfig.whatsapp_message || "Olá! Preenchi o formulário.");
            window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
          }} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white">
                Conversar no WhatsApp
              </Button>}
          </div>
        </div>;
    }
    if (!currentQuestions || currentQuestions.length === 0) return null;
    return <div className="space-y-8">
        {currentQuestions.map((question, index) => renderQuestionInput(question, index === 0))}
      </div>;
  };
  if (loading) {
    return <div className="w-full max-w-2xl mx-auto px-4 py-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>;
  }
  if (questions.length === 0) {
    return <div className="w-full max-w-2xl mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Nenhuma pergunta configurada ainda.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Entre em contato conosco para mais informações.
          </p>
        </div>
      </div>;
  }
  return <div className="w-full max-w-2xl mx-auto px-[5px] py-[20px]">
      {step < totalSteps && <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-extrabold text-primary">
              Etapa {step} de {uniqueSteps.length}
            </span>

            <span className="text-sm font-bold text-primary">
              {Math.round(step / uniqueSteps.length * 100)}%
            </span>
          </div>

          <Progress value={step / uniqueSteps.length * 100} className="h-2" />
        </div>}

      <form onSubmit={e => e.preventDefault()}>
        <div className="min-h-[200px] mb-4">{renderStep()}</div>

        {step < totalSteps && <div className="flex gap-3">
            {step > 1 && <Button type="button" variant="outline" onClick={prevStep} className="flex-1 h-12" disabled={isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>}

            {step < uniqueSteps.length ? <Button type="button" onClick={nextStep} disabled={isSubmitting} className="flex-1 h-12 text-base font-sans">
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button> : <Button type="button" onClick={() => {
          shouldFireGtmRef.current = true; // Finalizar button = final submit
          form.handleSubmit(onSubmit)();
        }} className="flex-1 h-12" disabled={isSubmitting}>
                {isSubmitting ? <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </> : "Finalizar"}
              </Button>}
          </div>}
      </form>
    </div>;
};