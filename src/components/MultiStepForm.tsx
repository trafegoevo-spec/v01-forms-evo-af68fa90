import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
  telefone: z.string().min(10, "Telefone inválido").max(15),
  curso: z.string().min(1, "Selecione um curso"),
  cidade: z.string().min(2, "Cidade inválida").max(100),
});

type FormData = z.infer<typeof formSchema>;

const CURSOS = [
  "EJA - Educação de Jovens e Adultos",
  "Curso Técnico",
  "Graduação",
  "Pós-graduação",
];

export const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      curso: "",
      cidade: "",
    },
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  const nextStep = async () => {
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = await form.trigger("nome");
        break;
      case 2:
        isValid = await form.trigger("email");
        break;
      case 3:
        isValid = await form.trigger("telefone");
        break;
      case 4:
        isValid = await form.trigger("curso");
        break;
      case 5:
        isValid = await form.trigger("cidade");
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
          telefone: data.telefone,
          curso: data.curso,
          cidade: data.cidade,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) throw error;

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Em breve entraremos em contato com você.",
      });

      form.reset();
      setStep(1);
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

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Qual é o seu telefone?
              </h2>
              <p className="text-muted-foreground">Para entrarmos em contato</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefone</label>
              <Input
                {...form.register("telefone")}
                type="tel"
                placeholder="(00) 00000-0000"
                className="h-12 text-base"
                autoFocus
              />
              {form.formState.errors.telefone && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.telefone.message}
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
                Qual curso você tem interesse?
              </h2>
              <p className="text-muted-foreground">Escolha a modalidade desejada</p>
            </div>
            <div className="space-y-3">
              {CURSOS.map((curso) => (
                <label
                  key={curso}
                  className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <input
                    type="radio"
                    {...form.register("curso")}
                    value={curso}
                    className="w-5 h-5 accent-primary"
                  />
                  <span className="text-base">{curso}</span>
                </label>
              ))}
              {form.formState.errors.curso && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.curso.message}
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
                Qual é a sua cidade?
              </h2>
              <p className="text-muted-foreground">Para oferecermos o melhor atendimento</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cidade</label>
              <Input
                {...form.register("cidade")}
                placeholder="Digite sua cidade"
                className="h-12 text-base"
                autoFocus
              />
              {form.formState.errors.cidade && (
                <p className="text-destructive text-sm mt-1">
                  {form.formState.errors.cidade.message}
                </p>
              )}
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
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Etapa {step} de {totalSteps}
            </span>
            <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step Content */}
          <div className="min-h-[300px] mb-8">{renderStep()}</div>

          {/* Navigation Buttons */}
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

            {step < totalSteps ? (
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
        </form>
      </div>
    </div>
  );
};
