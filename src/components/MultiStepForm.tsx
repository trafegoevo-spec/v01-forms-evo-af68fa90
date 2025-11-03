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

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  whatsapp: z.string()
    .regex(/^\(\d{2}\) \d{5}-\d{4}$/, "WhatsApp inválido. Use o formato (99) 99999-9999")
    .refine((val) => {
      const ddd = parseInt(val.substring(1, 3));
      return ddd >= 11 && ddd <= 99 && ddd !== 20 && ddd !== 30 && ddd !== 40 && ddd !== 50 && ddd !== 60 && ddd !== 70 && ddd !== 80 && ddd !== 90;
    }, "DDD inválido")
    .refine((val) => {
      const nono = val.charAt(5);
      return nono === "9";
    }, "WhatsApp deve começar com 9"),
  email: z.string().email("Email inválido").max(255),
  escolaridade: z.string().min(1, "Selecione seu nível de escolaridade"),
  modalidade: z.string().min(1, "Selecione uma modalidade"),
});

type FormData = z.infer<typeof formSchema>;

const ESCOLARIDADES = [
  "Ensino médio incompleto",
  "Ensino médio completo",
  "Graduação em andamento",
  "Graduação completa",
  "Pós-graduação em andamento",
  "Pós-graduação completa",
  "Mestrado / Doutorado",
];

const MODALIDADES = [
  "EJA EAD",
  "Técnico EAD",
  "Graduação EAD",
  "Segunda Graduação EAD",
  "Disciplinas Isoladas EAD",
  "Pós-graduação EAD",
];

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
      const { error } = await supabase.functions.invoke("enviar-conversao", {
        body: {
          nome: data.nome,
          email: data.email,
          telefone: data.whatsapp,
          curso: data.modalidade,
          cidade: data.escolaridade,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) throw error;

      setSubmittedData(data);
      setIsSuccess(true);
      setStep(6);
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
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Qual é o seu nome?
              </h2>
              <p className="text-muted-foreground">Como devemos te chamar?</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nome completo</label>
              <Input
                {...form.register("nome")}
                placeholder="Digite seu nome completo"
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
                Qual é o seu WhatsApp?
              </h2>
              <p className="text-muted-foreground">Para entrarmos em contato</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">WhatsApp</label>
              <Input
                {...form.register("whatsapp")}
                type="tel"
                placeholder="(99) 99999-9999"
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
                Qual é o seu e-mail?
              </h2>
              <p className="text-muted-foreground">Enviaremos informações para você</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">E-mail</label>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="seu@email.com"
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
                Qual é o seu nível de escolaridade?
              </h2>
              <p className="text-muted-foreground">Escolha sua escolaridade atual</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nível de escolaridade</label>
              <Select
                value={form.watch("escolaridade")}
                onValueChange={(value) => form.setValue("escolaridade", value)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Selecione sua escolaridade" />
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
                Qual modalidade você tem interesse?
              </h2>
              <p className="text-muted-foreground">Escolha a modalidade desejada</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Modalidade de interesse</label>
              <Select
                value={form.watch("modalidade")}
                onValueChange={(value) => form.setValue("modalidade", value)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Selecione uma modalidade" />
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
        return (
          <div className="space-y-6 text-center">
            <div className="text-6xl">🎉</div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-3">
                Obrigado, {submittedData.nome.split(' ')[0]}!
              </h2>
              <p className="text-lg text-muted-foreground">
                Recebemos suas informações com sucesso!
              </p>
              <p className="text-lg text-muted-foreground mt-2">
                Em breve entraremos em contato sobre os cursos de <span className="font-semibold text-primary">{submittedData.modalidade}</span>.
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
