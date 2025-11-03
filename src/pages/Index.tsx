import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, GraduationCap, Phone, Mail, User } from "lucide-react";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
  telefone: z.string().min(10, "Telefone inválido").max(15),
  curso: z.string().min(1, "Selecione um curso"),
});

type FormData = z.infer<typeof formSchema>;

const Index = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      curso: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    console.log("Enviando dados:", data);

    try {
      const { data: result, error } = await supabase.functions.invoke("enviar-conversao", {
        body: {
          nome: data.nome,
          email: data.email,
          telefone: data.telefone,
          curso: data.curso,
          timestamp: new Date().toISOString(),
        },
      });

      if (error) throw error;

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Em breve entraremos em contato com você.",
      });

      form.reset();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Cursos EAD</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Transforme seu Futuro
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              Cadastre-se e receba informações sobre nossos cursos
            </p>
            <p className="text-sm text-muted-foreground">
              EJA • Técnico • Graduação • Pós-graduação
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nome Completo
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu nome completo"
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Telefone
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="(00) 00000-0000"
                          {...field}
                          className="h-12"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="curso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Curso de Interesse
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Selecione um curso" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="eja">EJA - Educação de Jovens e Adultos</SelectItem>
                          <SelectItem value="tecnico">Curso Técnico</SelectItem>
                          <SelectItem value="graduacao">Graduação</SelectItem>
                          <SelectItem value="pos-graduacao">Pós-graduação</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Receber Informações"
                  )}
                </Button>
              </form>
            </Form>
          </div>

          {/* Benefits Section */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { title: "100% Online", desc: "Estude de onde estiver" },
              { title: "Certificado Válido", desc: "Reconhecido pelo MEC" },
              { title: "Suporte Total", desc: "Ajuda quando precisar" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/60 backdrop-blur-sm rounded-lg p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${400 + i * 100}ms` }}
              >
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Cursos EAD. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
