// Usando secret AUTOPROTECTA_URL
const AUTOPROTECTA_URL = process.env.AUTOPROTECTA_URL;
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
}

export const MultiStepFormDynamic = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const formName = searchParams.get("form_name") || "facuvale";
  const [isSuccess, setIsSuccess] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
    loadSettings();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase.from("form_questions").select("*").order("step", { ascending: true });

      if (error) throw error;

      const transformedData = (data || []).map((item) => ({
        ...item,
        options: Array.isArray(item.options) ? (item.options as string[]) : [],
        input_type: (["select", "text", "password"].includes(item.input_type) ? item.input_type : "text") as
          | "text"
          | "select"
          | "password",
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
      const { data, error } = await supabase.from("app_settings").select("*").single();

      if (error) throw error;
      setSettings(data);
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const buildSchema = () => {
    const schemaFields: Record<string, z.ZodType<any>> = {};

    questions.forEach((q) => {
      if (q.field_name.toLowerCase().includes("whatsapp") || q.field_name.toLowerCase().includes("telefone")) {
        schemaFields[q.field_name] = z
          .string()
          .regex(/^55 \(\d{2}\) \d{5}-\d{4}$/, "Telefone inválido. Use o formato 55 (99) 99999-9999")
          .refine(
            (val) => {
              const cleaned = val.replace(/\D/g, "");
              return cleaned.length === 13;
            },
            {
              message: "Telefone deve ter 11 dígitos + código do país",
            },
          )
          .refine(
            (val) => {
              const ddd = val.match(/\((\d{2})\)/)?.[1];
              if (!ddd) return false;
              const dddNum = parseInt(ddd);
              return dddNum >= 11 && dddNum <= 99;
            },
            {
              message: "DDD inválido. Use um DDD brasileiro válido",
            },
          )
          .refine(
            (val) => {
              const ninthDigit = val.match(/\) (\d)/)?.[1];
              return ninthDigit === "9";
            },
            {
              message: "Número de celular deve começar com 9 após o DDD",
            },
          );
      } else if (q.field_name.toLowerCase().includes("placa")) {
        schemaFields[q.field_name] = z
          .string()
          .regex(/^[A-Z]{3}\d[A-Z]\d{2}$/, "Placa inválida. Use o formato Mercosul: ABC1D23")
          .length(7, "Placa deve ter exatamente 7 caracteres");
      } else if (q.field_name.toLowerCase().includes("email")) {
        schemaFields[q.field_name] = z.string().email("Email inválido").max(255);
      } else if (q.input_type === "select" && q.options.length > 0) {
        schemaFields[q.field_name] = z.string().min(1, "Selecione uma opção");
      } else {
        let schema = z.string().min(1, "Campo obrigatório");
        if (q.max_length && q.max_length > 0) {
          schema = schema.max(q.max_length, `Máximo de ${q.max_length} caracteres`);
        } else {
          schema = schema.max(200);
        }
        schemaFields[q.field_name] = schema;
      }
    });

    return z.object(schemaFields);
  };

  const formSchema = buildSchema();
  type FormData = z.infer<typeof formSchema>;

  const defaultValues = questions.reduce(
    (acc, q) => {
      if (q.field_name.toLowerCase().includes("whatsapp") || q.field_name.toLowerCase().includes("telefone")) {
        acc[q.field_name] = "55 ";
      } else {
        acc[q.field_name] = "";
      }
      return acc;
    },
    {} as Record<string, string>,
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
    return cleaned;
  };

  const nextStep = async () => {
    if (!currentQuestion) return;

    const isValid = await form.trigger(currentQuestion.field_name);

    if (isValid && step < totalSteps) setStep(step + 1);
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

      const { error: dbError } = await supabase.from("leads").insert([leadData]);
      if (dbError) throw dbError;

      const { error } = await supabase.functions.invoke("enviar-conversao", {
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
          form_nome: "FormularioEAD",
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
      const firstName = nomeQuestion ? submittedData[nomeQuestion.field_name]?.split(" ")[0] : "você";

      return (
        <div className="space-y-6 text-center">
          <div className="text-6xl">🎉</div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              {settings?.success_title || "Obrigado"}, {firstName}!
            </h2>
            <p className="text-lg text-muted-foreground">
              {settings?.success_description || "Recebemos suas informações com sucesso!"}
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-8 mt-6">
            <img src={whatsappIcon} alt="WhatsApp" className="w-16 h-16 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-green-600 mb-4">WhatsApp</h3>
            <p className="text-base text-foreground leading-relaxed">
              Em breve entraremos em contato com você através do WhatsApp.
            </p>
          </div>
        </div>
      );
    }

    if (!currentQuestion) return null;

    return (
      <div className="space-y-6">
        <h2 className="text-4xl font-bold text-foreground">{currentQuestion.question}</h2>

        <div className="space-y-3">
          {currentQuestion.subtitle && (
            <label className="block text-base font-medium text-foreground">{currentQuestion.subtitle}</label>
          )}

          {currentQuestion.input_type === "select" && currentQuestion.options.length > 0 ? (
            <Select
              key={`select-${currentQuestion.field_name}-${step}`}
              value={form.watch(currentQuestion.field_name)}
              onValueChange={async (value) => {
                form.setValue(currentQuestion.field_name, value);
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
              placeholder={currentQuestion.input_placeholder || `Digite ${currentQuestion.question.toLowerCase()}`}
              className="h-12 text-base"
              autoFocus
              autoComplete="off"
              value={form.watch(currentQuestion.field_name) || ""}
              onChange={(e) => form.setValue(currentQuestion.field_name, e.target.value, { shouldValidate: true })}
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
                form.setValue(currentQuestion.field_name, formatted, { shouldValidate: true });
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
                form.setValue(currentQuestion.field_name, formatted, { shouldValidate: true });
              }}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <Input
              key={`input-${currentQuestion.field_name}-${step}`}
              type={currentQuestion.field_name.toLowerCase().includes("email") ? "email" : "text"}
              placeholder={currentQuestion.input_placeholder || `Digite ${currentQuestion.question.toLowerCase()}`}
              className="h-12 text-base"
              autoFocus
              autoComplete="off"
              maxLength={currentQuestion.max_length || undefined}
              value={form.watch(currentQuestion.field_name) || ""}
              onChange={(e) => form.setValue(currentQuestion.field_name, e.target.value, { shouldValidate: true })}
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
          <p className="text-sm text-muted-foreground mt-2">Entre em contato conosco para mais informações.</p>
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
              <span className="text-sm font-bold text-primary">{Math.round((step / questions.length) * 100)}%</span>
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
                <Button type="button" onClick={nextStep} className="flex-1 h-12" disabled={isSubmitting}>
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
