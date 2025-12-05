// Arquivo corrigido: MultiStepFormDynamic.tsx
import { useState, useEffect } from "react";
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
  input_type?: "text" | "select" | "password";
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
  const { toast } = useToast();

  const formName = import.meta.env.VITE_FORM_NAME || "default";

  useEffect(() => {
    loadQuestions();
    loadSettings();
    loadSuccessPages();
  }, []);

  const loadSuccessPages = async () => {
    try {
      const { data, error } = await supabase
        .from("success_pages")
        .select("*")
        .eq("subdomain", formName);

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

      const transformedData = (data || []).map((item) => ({
        ...item,
        options: Array.isArray(item.options) ? (item.options as string[]) : [],
        input_type: (["select", "text", "password"].includes(item.input_type)
          ? item.input_type
          : "text") as "text" | "select" | "password",
        required: item.required !== undefined ? item.required : true,
        conditional_logic: item.conditional_logic as unknown as ConditionalLogic | null,
      }));

      setQuestions(transformedData);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar perguntas",
        description: error.message,
        variant: "destructive",
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
            success_subtitle: 'Em breve entraremos em contato.',
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

    questions.forEach((q) => {
      const isRequired = q.required !== false;

      if (
        q.field_name.toLowerCase().includes("whatsapp") ||
        q.field_name.toLowerCase().includes("telefone")
      ) {
        if (isRequired) {
          schemaFields[q.field_name] = z
            .string()
            .regex(/^55 \(\d{2}\) \d{5}-\d{4}$/, "Telefone inválido. Use o formato 55 (99) 99999-9999")
            .refine(
              (val) => {
                const cleaned = val.replace(/\D/g, "");
                return cleaned.length === 13;
              },
              { message: "Telefone deve ter 11 dígitos + código do país" }
            )
            .refine(
              (val) => {
                const ddd = val.match(/\((\d{2})\)/)?.[1];
                if (!ddd) return false;
                const dddNum = parseInt(ddd);
                return dddNum >= 11 && dddNum <= 99;
              },
              { message: "DDD inválido. Use um DDD brasileiro válido" }
            )
            .refine(
              (val) => {
                const ninthDigit = val.match(/\) (\d)/)?.[1];
                return ninthDigit === "9";
              },
              { message: "Número de celular deve começar com 9 após o DDD" }
            );
        } else {
          schemaFields[q.field_name] = z.string();
        }
      } else if (q.field_name.toLowerCase().includes("placa")) {
        if (isRequired) {
          schemaFields[q.field_name] = z
            .string()
            .transform((val) => val.replace(/-/g, "")) // Remove máscara para validação
            .refine(
              (val) => /^[A-Z]{3}\d[A-Z]\d{2}$|^[A-Z]{3}\d{4}$/.test(val),
              "Placa inválida. Use formato Mercosul (ABC-1D23) ou antigo (ABC-1234)"
            )
            .refine(
              (val) => val.length === 7,
              "Placa deve ter exatamente 7 caracteres"
            );
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

  const defaultValues = questions.reduce(
    (acc, q) => {
      if (
        q.field_name.toLowerCase().includes("whatsapp") ||
        q.field_name.toLowerCase().includes("telefone")
      ) {
        acc[q.field_name] = "55 ";
      } else {
        acc[q.field_name] = "";
      }
      return acc;
    },
    {} as Record<string, string>
  );

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "onChange",
  });

  const totalSteps = questions.length + 1;
  const currentQuestion = questions[step - 1];

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

  const handleConditionalLogic = (value: string) => {
    if (!currentQuestion?.conditional_logic?.conditions) return null;
    
    const condition = currentQuestion.conditional_logic.conditions.find(
      (c) => c.value === value
    );
    
    return condition || null;
  };

  const nextStep = async () => {
    if (!currentQuestion) return;

    const isRequired = currentQuestion.required !== false;
    const value = form.watch(currentQuestion.field_name);

    if (!isRequired && (!value || value.trim() === '' || value === '55 ')) {
      if (step < totalSteps) setStep(step + 1);
      return;
    }

    const isValid = await form.trigger(currentQuestion.field_name);

    if (isValid) {
      // Check for conditional logic
      const condition = handleConditionalLogic(value);
      
      if (condition) {
        if (condition.action === "success_page" && condition.target_page) {
          // Submit form and redirect to specific success page
          const successPage = successPages.find(p => p.page_key === condition.target_page);
          if (successPage) {
            setActiveSuccessPage(successPage);
          }
          form.handleSubmit(onSubmit)();
          return;
        } else if (condition.action === "skip_to_step" && condition.target_step) {
          // Skip to specific step
          const targetStep = condition.target_step;
          if (targetStep > 0 && targetStep <= questions.length) {
            setStep(targetStep);
            return;
          }
        }
      }
      
      // Default: go to next step
      if (step < totalSteps) setStep(step + 1);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (step < questions.length) await nextStep();
      else form.handleSubmit(onSubmit)();
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      const leadData = { form_data: data };

      const tableName = formName === "autoprotecta" ? "leads_autoprotecta" : "leads";
      const edgeFunctionName =
        formName === "autoprotecta" ? "enviar-conversao-autoprotecta" : "enviar-conversao";

      const { error: dbError } = await supabase.from(tableName).insert([leadData]);
      if (dbError) throw dbError;

      const { error } = await supabase.functions.invoke(edgeFunctionName, {
        body: {
          ...data,
          form_name: formName,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) console.error("Webhook error:", error);

      if (typeof window !== "undefined") {
        (window as any).dataLayer = (window as any).dataLayer || [];

        (window as any).dataLayer.push({
          event: "gtm.formSubmit",
          form_nome: formName,
          timestamp: new Date().toISOString(),
        });
      }

      setSubmittedData(data);
      setIsSuccess(true);
      setStep(totalSteps);
    } catch (error) {
      console.error("Erro ao enviar", error);

      toast({
        title: "Erro ao enviar cadastro",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (step === totalSteps && isSuccess && submittedData) {
      const nomeQuestion = questions.find((q) => q.field_name === "nome");
      const firstName = nomeQuestion
        ? submittedData[nomeQuestion.field_name]?.split(" ")[0]
        : "você";

      // Use active success page if set, otherwise default settings
      const successConfig = activeSuccessPage || settings;

      return (
        <div className="space-y-6 text-center">
          <div className="text-6xl">🎉</div>

          <div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {successConfig?.success_title || successConfig?.title || "Obrigado"}, {firstName}!
            </h2>

            <p className="text-lg text-muted-foreground">
              {successConfig?.success_description || successConfig?.description || "Recebemos suas informações com sucesso!"}
            </p>
          </div>

          {(successConfig?.whatsapp_enabled) && (
            <div className="bg-muted/30 rounded-lg p-8 mt-6">
              <img
                src={whatsappIcon}
                alt="WhatsApp"
                className="w-16 h-16 mx-auto mb-4"
              />

              <h3 className="text-2xl font-semibold text-green-600 mb-4">WhatsApp</h3>

              <p className="text-base text-foreground leading-relaxed mb-4">
                Em breve entraremos em contato com você através do WhatsApp.
              </p>

              <Button
                type="button"
                onClick={() => {
                  const phoneNumber = (successConfig.whatsapp_number || "").replace(/\D/g, "");
                  const message = encodeURIComponent(
                    successConfig.whatsapp_message || "Olá! Preenchi o formulário."
                  );
                  window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
                }}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
              >
                Conversar no WhatsApp
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (!currentQuestion) return null;

    return (
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-foreground">{currentQuestion.question}</h2>

        <div className="space-y-3">
          {currentQuestion.subtitle && (
            <label className="block text-base font-medium text-foreground">
              {currentQuestion.subtitle}
            </label>
          )}

          {currentQuestion.input_type === "select" && currentQuestion.options.length > 0 ? (
            <Select
              key={`select-${currentQuestion.field_name}-${step}`}
              value={form.watch(currentQuestion.field_name)}
              onValueChange={async (value) => {
                form.setValue(currentQuestion.field_name, value);
                
                // Check for conditional logic
                const condition = currentQuestion.conditional_logic?.conditions?.find(
                  (c) => c.value === value
                );
                
                if (condition) {
                  if (condition.action === "success_page" && condition.target_page) {
                    // Submit form and redirect to specific success page
                    const successPage = successPages.find(p => p.page_key === condition.target_page);
                    if (successPage) {
                      setActiveSuccessPage(successPage);
                    }
                    setTimeout(() => form.handleSubmit(onSubmit)(), 300);
                    return;
                  } else if (condition.action === "skip_to_step" && condition.target_step) {
                    // Skip to specific step
                    setTimeout(() => setStep(condition.target_step!), 300);
                    return;
                  }
                }
                
                // Default: go to next step
                if (step < questions.length) setTimeout(() => nextStep(), 300);
              }}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="Selecione uma opção" />
              </SelectTrigger>

              <SelectContent>
                {currentQuestion.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : currentQuestion.input_type === "password" ? (
            <Input
              key={`input-${currentQuestion.field_name}-${step}`}
              type="text"
              placeholder={
                currentQuestion.input_placeholder ||
                `Digite ${currentQuestion.question.toLowerCase()}`
              }
              className="h-12 text-base"
              autoFocus
              autoComplete="off"
              value={form.watch(currentQuestion.field_name) || ""}
              onChange={(e) =>
                form.setValue(currentQuestion.field_name, e.target.value, {
                  shouldValidate: true,
                })
              }
              onKeyDown={handleKeyDown}
            />
          ) : currentQuestion.field_name.toLowerCase().includes("whatsapp") ||
            currentQuestion.field_name.toLowerCase().includes("telefone") ? (
            <Input
              key={`input-${currentQuestion.field_name}-${step}`}
              type="tel"
              placeholder={currentQuestion.input_placeholder || "55 (99) 99999-9999"}
              className="h-12 text-base"
              autoFocus
              autoComplete="off"
              maxLength={currentQuestion.max_length || 19}
              value={form.watch(currentQuestion.field_name) || "55 "}
              onChange={(e) => {
                const formatted = formatWhatsApp(e.target.value);
                form.setValue(currentQuestion.field_name, formatted, {
                  shouldValidate: true,
                });
              }}
              onKeyDown={handleKeyDown}
            />
          ) : currentQuestion.field_name.toLowerCase().includes("placa") ? (
            <Input
              key={`input-${currentQuestion.field_name}-${step}`}
              type="text"
              placeholder={currentQuestion.input_placeholder || "ABC1D23"}
              className="h-12 text-base uppercase"
              autoFocus
              autoComplete="off"
              maxLength={7}
              value={form.watch(currentQuestion.field_name) || ""}
              onChange={(e) => {
                const formatted = formatPlaca(e.target.value);
                form.setValue(currentQuestion.field_name, formatted, {
                  shouldValidate: true,
                });
              }}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <Input
              key={`input-${currentQuestion.field_name}-${step}`}
              type={
                currentQuestion.field_name.toLowerCase().includes("email")
                  ? "email"
                  : "text"
              }
              placeholder={
                currentQuestion.input_placeholder ||
                `Digite ${currentQuestion.question.toLowerCase()}`
              }
              className="h-12 text-base"
              autoFocus
              autoComplete="off"
              maxLength={currentQuestion.max_length || undefined}
              value={form.watch(currentQuestion.field_name) || ""}
              onChange={(e) =>
                form.setValue(currentQuestion.field_name, e.target.value, {
                  shouldValidate: true,
                })
              }
              onKeyDown={handleKeyDown}
            />
          )}

          {form.formState.errors[currentQuestion.field_name] && (
            <p className="text-destructive text-sm mt-1">
              {form.formState.errors[currentQuestion.field_name]?.message as string}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2 text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-lg text-muted-foreground">Nenhuma pergunta configurada ainda.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Entre em contato conosco para mais informações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {step < totalSteps && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Etapa {step} de {questions.length}
              </span>

              <span className="text-sm font-bold text-primary">
                {Math.round((step / questions.length) * 100)}%
              </span>
            </div>

            <Progress value={(step / questions.length) * 100} className="h-2" />
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="min-h-[200px] mb-4">{renderStep()}</div>

          {step < totalSteps && (
            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  className="flex-1 h-12"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              )}

              {step < questions.length ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 h-12"
                  disabled={isSubmitting}
                >
                  Próximo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" className="flex-1 h-12" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
    </div>
  );
};
