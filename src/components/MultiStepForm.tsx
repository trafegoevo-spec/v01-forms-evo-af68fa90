import { useState } from "react";
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
import { 
  FORM_STEPS, 
  ESCOLARIDADES, 
  MODALIDADES, 
  SUCCESS_PAGE, 
  VALIDATION,
  TOAST_MESSAGES,
  WEBHOOK_MAPPING
} from "@/config/formConfig";

const formSchema = z.object({
  nome: z.string().min(VALIDATION.nome.minLength, VALIDATION.nome.errorMessage).max(VALIDATION.nome.maxLength),
  whatsapp: z.string()
    .regex(VALIDATION.whatsapp.format, VALIDATION.whatsapp.errorMessage)
    .refine((val) => {
      const ddd = parseInt(val.substring(1, 3));
      return ddd >= 11 && ddd <= 99 && ddd !== 20 && ddd !== 30 && ddd !== 40 && ddd !== 50 && ddd !== 60 && ddd !== 70 && ddd !== 80 && ddd !== 90;
    }, "DDD inválido")
    .refine((val) => {
      const nono = val.charAt(5);
      return nono === "9";
    }, "WhatsApp deve começar com 9"),
  email: z.string().email(VALIDATION.email.errorMessage).max(VALIDATION.email.maxLength),
  escolaridade: z.string().min(1, "Selecione seu nível de escolaridade"),
  modalidade: z.string().min(1, "Selecione uma modalidade"),
});

type FormData = z.infer<typeof formSchema>;

export const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<FormData | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      whatsapp: "",
      escolaridade: "",
      modalidade: "",
    },
  });

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const formatWhatsApp = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
  };

  const nextStep = async () => {
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = await form.trigger("nome");
        break;
      case 2:
        isValid = await form.trigger("whatsapp");
        break;
      case 3:
        isValid = await form.trigger("email");
        break;
      case 4:
        isValid = await form.trigger("escolaridade");
        break;
      case 5:
        isValid = await form.trigger("modalidade");
        break;
    }

    if (isValid && step < totalSteps) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    console.log("Enviando dados:", data);

    try {
      // 1. Salvar no banco de dados
      const { error: dbError } = await supabase
        .from("leads")
        .insert({
          nome: data.nome,
          email: data.email,
          whatsapp: data.whatsapp,
          escolaridade: data.escolaridade,
          modalidade: data.modalidade,
        });

      if (dbError) {
        console.error("Erro ao salvar no banco:", dbError);
        throw dbError;
      }

      // 2. Enviar para Google Sheets via webhook (backup)
      const { error: webhookError } = await supabase.functions.invoke("enviar-conversao", {
        body: {
          [WEBHOOK_MAPPING.nome]: data.nome,
          [WEBHOOK_MAPPING.email]: data.email,
          [WEBHOOK_MAPPING.whatsapp]: data.whatsapp,
          [WEBHOOK_MAPPING.modalidade]: data.modalidade,
          [WEBHOOK_MAPPING.escolaridade]: data.escolaridade,
          timestamp: new Date().toISOString(),
        },
      });

      // Não bloquear o sucesso se o webhook falhar
      if (webhookError) {
        console.warn("Webhook falhou (dados salvos no banco):", webhookError);
      }

      setSubmittedData(data);
      setIsSuccess(true);
      setStep(6);
      
      toast(TOAST_MESSAGES.success);
    } catch (error: any) {
      console.error("Erro ao enviar:", error);
      toast({
        ...TOAST_MESSAGES.error,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {FORM_STEPS.nome.title}
              </h2>
              <p className="text-muted-foreground">{FORM_STEPS.nome.subtitle}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{FORM_STEPS.nome.label}</label>
              <Input
                {...form.register("nome")}
                placeholder={FORM_STEPS.nome.placeholder}
                className="h-12 text-base"
                autoFocus
              />
              {form.formState.errors.nome && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {FORM_STEPS.whatsapp.title}
              </h2>
              <p className="text-muted-foreground">{FORM_STEPS.whatsapp.subtitle}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{FORM_STEPS.whatsapp.label}</label>
              <Input
                {...form.register("whatsapp")}
                type={FORM_STEPS.whatsapp.type}
                placeholder={FORM_STEPS.whatsapp.placeholder}
                className="h-12 text-base"
                autoComplete="off"
                autoFocus
                onChange={(e) => {
                  const formatted = formatWhatsApp(e.target.value);
                  form.setValue("whatsapp", formatted);
                }}
              />
              {form.formState.errors.whatsapp && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.whatsapp.message}
                </p>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {FORM_STEPS.email.title}
              </h2>
              <p className="text-muted-foreground">{FORM_STEPS.email.subtitle}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{FORM_STEPS.email.label}</label>
              <Input
                {...form.register("email")}
                type={FORM_STEPS.email.type}
                placeholder={FORM_STEPS.email.placeholder}
                className="h-12 text-base"
                autoFocus
              />
              {form.formState.errors.email && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {FORM_STEPS.escolaridade.title}
              </h2>
              <p className="text-muted-foreground">{FORM_STEPS.escolaridade.subtitle}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{FORM_STEPS.escolaridade.label}</label>
              <Select
                value={form.watch("escolaridade")}
                onValueChange={(value) => form.setValue("escolaridade", value)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder={FORM_STEPS.escolaridade.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {ESCOLARIDADES.map((esc) => (
                    <SelectItem key={esc} value={esc}>
                      {esc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.escolaridade && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.escolaridade.message}
                </p>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {FORM_STEPS.modalidade.title}
              </h2>
              <p className="text-muted-foreground">{FORM_STEPS.modalidade.subtitle}</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{FORM_STEPS.modalidade.label}</label>
              <Select
                value={form.watch("modalidade")}
                onValueChange={(value) => form.setValue("modalidade", value)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder={FORM_STEPS.modalidade.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {MODALIDADES.map((mod) => (
                    <SelectItem key={mod} value={mod}>
                      {mod}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.modalidade && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.modalidade.message}
                </p>
              )}
            </div>
          </div>
        );

      case 6:
        if (!isSuccess || !submittedData) return null;
        const whatsappUrl = `https://wa.me/${SUCCESS_PAGE.whatsappButton.phone}?text=${encodeURIComponent(SUCCESS_PAGE.whatsappButton.message)}`;
        
        return (
          <div className="space-y-6 text-center">
            <div className="text-6xl">{SUCCESS_PAGE.emoji}</div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-3">
                {SUCCESS_PAGE.title(submittedData.nome)}
              </h2>
              <p className="text-lg text-muted-foreground">
                {SUCCESS_PAGE.message1}
              </p>
              <p className="text-lg text-muted-foreground mt-2">
                {SUCCESS_PAGE.message2(submittedData.modalidade)}
              </p>
            </div>
            <div className="pt-4">
              <Button
                onClick={() => window.open(whatsappUrl, "_blank")}
                className="h-14 px-8 text-lg bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                {SUCCESS_PAGE.whatsappButton.text}
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Progress */}
        {step < 6 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Etapa {step} de 5
              </span>
              <span className="text-sm font-bold text-primary">{Math.round((step / 5) * 100)}%</span>
            </div>
            <Progress value={(step / 5) * 100} className="h-2" />
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step Content */}
          <div className="min-h-[200px] mb-4">{renderStep()}</div>

          {/* Navigation Buttons */}
          {step < 6 && (
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

              {step < 5 ? (
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
