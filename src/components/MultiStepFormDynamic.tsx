import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, ArrowLeft, MessageCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Question {
  id: string;
  step: number;
  question: string;
  subtitle?: string;
  options: string[];
  field_name: string;
}

export const MultiStepFormDynamic = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("form_questions")
        .select("*")
        .order("step", { ascending: true });

      if (error) throw error;

      const transformedData = (data || []).map(item => ({
        ...item,
        options: Array.isArray(item.options) ? item.options as string[] : []
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

  // Build dynamic schema based on questions
  const buildSchema = () => {
    const schemaFields: Record<string, z.ZodType<any>> = {};

    questions.forEach(q => {
      if (q.field_name === "whatsapp") {
        schemaFields[q.field_name] = z.string()
          .regex(/^\(\d{2}\) \d{5}-\d{4}$/, "WhatsApp inválido. Use o formato (99) 99999-9999");
      } else if (q.field_name === "email") {
        schemaFields[q.field_name] = z.string().email("Email inválido").max(255);
      } else if (q.options.length > 0) {
        schemaFields[q.field_name] = z.string().min(1, "Selecione uma opção");
      } else {
        schemaFields[q.field_name] = z.string().min(3, "Campo obrigatório").max(100);
      }
    });

    return z.object(schemaFields);
  };

  const formSchema = buildSchema();
  type FormData = z.infer<typeof formSchema>;

  const defaultValues = questions.reduce((acc, q) => {
    acc[q.field_name] = "";
    return acc;
  }, {} as Record<string, string>);

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const totalSteps = questions.length + 1; // +1 for success page
  const currentQuestion = questions[step - 1];

  const formatWhatsApp = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const nextStep = async () => {
    if (!currentQuestion) return;

    const isValid = await form.trigger(currentQuestion.field_name);

    if (isValid && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);

    try {
      // Save to database
      const { error: dbError } = await supabase.from("leads").insert([data]);

      if (dbError) throw dbError;

      // Send to webhook/edge function
      const { error } = await supabase.functions.invoke("enviar-conversao", {
        body: {
          ...data,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) console.error("Webhook error:", error);

      setSubmittedData(data);
      setIsSuccess(true);
      setStep(totalSteps);
    } catch (error: any) {
      console.error("Erro ao enviar:", error);
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
    // Success page
    if (step === totalSteps && isSuccess && submittedData) {
      const nomeQuestion = questions.find(q => q.field_name === "nome");
      const firstName = nomeQuestion ? submittedData[nomeQuestion.field_name]?.split(' ')[0] : "você";

      return (
        <div className="space-y-6 text-center">
          <div className="text-6xl">🎉</div>
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Obrigado, {firstName}!
            </h2>
            <p className="text-lg text-muted-foreground">
              Recebemos suas informações com sucesso!
            </p>
            <p className="text-lg text-muted-foreground mt-2">
              Em breve entraremos em contato.
            </p>
          </div>
          <div className="pt-4">
            <Button
              onClick={() => {
                window.open("https://wa.me/5531989236061?text=Olá!%20Acabei%20de%20enviar%20meus%20dados%20no%20formulário.", "_blank");
              }}
              className="h-14 px-8 text-lg bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Falar no WhatsApp Agora
            </Button>
          </div>
        </div>
      );
    }

    // Question steps
    if (!currentQuestion) return null;

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {currentQuestion.question}
          </h2>
          {currentQuestion.subtitle && (
            <p className="text-sm text-muted-foreground mt-1">
              {currentQuestion.subtitle}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">
            {currentQuestion.question}
          </label>

          {currentQuestion.options.length > 0 ? (
            // Select field for questions with options
            <Select
              value={form.watch(currentQuestion.field_name)}
              onValueChange={(value) => form.setValue(currentQuestion.field_name, value)}
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
          ) : (
            // Input field for text questions
            <Input
              {...form.register(currentQuestion.field_name)}
              type={currentQuestion.field_name === "email" ? "email" : currentQuestion.field_name === "whatsapp" ? "tel" : "text"}
              placeholder={
                currentQuestion.field_name === "whatsapp"
                  ? "(99) 99999-9999"
                  : `Digite ${currentQuestion.question.toLowerCase()}`
              }
              className="h-12 text-base"
              autoFocus
              autoComplete="off"
              onChange={
                currentQuestion.field_name === "whatsapp"
                  ? (e) => {
                      const formatted = formatWhatsApp(e.target.value);
                      form.setValue(currentQuestion.field_name, formatted);
                    }
                  : undefined
              }
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

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Progress */}
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
          {/* Step Content */}
          <div className="min-h-[200px] mb-4">{renderStep()}</div>

          {/* Navigation Buttons */}
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
                <Button
                  type="submit"
                  className="flex-1 h-12"
                  disabled={isSubmitting}
                >
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
