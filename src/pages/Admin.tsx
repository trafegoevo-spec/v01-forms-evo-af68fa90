import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, Plus, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthDialog } from "@/components/AuthDialog";
import { LogoUploader } from "@/components/LogoUploader";
import { Switch } from "@/components/ui/switch";
interface FormQuestion {
  id: string;
  step: number;
  question: string;
  subtitle?: string;
  options: string[];
  field_name: string;
  input_type?: 'text' | 'select' | 'password';
  max_length?: number;
  input_placeholder?: string;
  required?: boolean;
}
interface AppSettings {
  id: string;
  whatsapp_number: string;
  whatsapp_message: string;
  success_title: string;
  success_description: string;
  success_subtitle: string;
  form_name: string;
  whatsapp_enabled: boolean;
  subdomain: string;
}
const Admin = () => {
  const {
    user,
    isAdmin,
    loading: authLoading,
    signOut
  } = useAuth();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const formName = import.meta.env.VITE_FORM_NAME || "default";
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setShowAuthDialog(true);
      } else if (user && !isAdmin) {
        // User is authenticated but not admin - redirect to home
        navigate("/");
      } else if (user && isAdmin) {
        // User is authenticated and is admin - close dialog and load questions
        setShowAuthDialog(false);
        loadQuestions();
        loadSettings();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);
  const loadQuestions = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from("form_questions").select("*").eq("subdomain", formName).order("step", {
        ascending: true
      });
      if (error) throw error;

      // Transform data to match FormQuestion type
      const transformedData = (data || []).map(item => ({
        ...item,
        options: Array.isArray(item.options) ? item.options as string[] : [],
        input_type: (['select', 'text', 'password'].includes(item.input_type) ? item.input_type : 'text') as 'text' | 'select' | 'password',
        required: item.required !== undefined ? item.required : true
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
        // Se não existir, criar configurações padrão
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
          if (insertError) throw insertError;
          setSettings(newData);
          toast({
            title: "Configurações criadas",
            description: "Configurações padrão foram criadas automaticamente."
          });
          return;
        }
        throw error;
      }
      setSettings(data);
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const saveSettings = async () => {
    if (!settings) return;
    try {
      const {
        error
      } = await supabase.from("app_settings").update({
        whatsapp_number: settings.whatsapp_number,
        whatsapp_message: settings.whatsapp_message,
        success_title: settings.success_title,
        success_description: settings.success_description,
        success_subtitle: settings.success_subtitle,
        form_name: settings.form_name,
        whatsapp_enabled: settings.whatsapp_enabled
      }).eq("id", settings.id);
      if (error) throw error;
      toast({
        title: "Configurações salvas!",
        description: "As configurações foram atualizadas com sucesso."
      });
      setSettingsChanged(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar configurações",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const updateSettings = (updates: Partial<AppSettings>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      ...updates
    });
    setSettingsChanged(true);
  };
  const updateQuestionLocal = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? {
      ...q,
      ...updates
    } : q));
    setHasUnsavedChanges(true);
  };
  const saveAllChanges = async () => {
    try {
      for (const question of questions) {
        const {
          error
        } = await supabase.from("form_questions").update({
          question: question.question,
          subtitle: question.subtitle,
          field_name: question.field_name,
          input_type: question.input_type,
          options: question.options,
          max_length: question.max_length,
          input_placeholder: question.input_placeholder,
          required: question.required !== undefined ? question.required : true
        }).eq("id", question.id);
        if (error) throw error;
      }
      toast({
        title: "Alterações salvas!",
        description: "Todas as mudanças foram salvas com sucesso."
      });
      setHasUnsavedChanges(false);
      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const deleteQuestion = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta pergunta?")) return;
    try {
      const {
        error
      } = await supabase.from("form_questions").delete().eq("id", id);
      if (error) throw error;
      toast({
        title: "Pergunta excluída!"
      });
      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const addOption = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    const newOptions = [...question.options, `Opção ${question.options.length + 1}`];
    updateQuestionLocal(questionId, {
      options: newOptions
    });
  };
  const removeOption = (questionId: string, index: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    const newOptions = question.options.filter((_, i) => i !== index);
    updateQuestionLocal(questionId, {
      options: newOptions
    });
  };
  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    const newOptions = question.options.map((opt, i) => i === optionIndex ? value : opt);
    updateQuestionLocal(questionId, {
      options: newOptions
    });
  };
  const addNewQuestion = async () => {
    if (hasUnsavedChanges) {
      if (!confirm("Você tem alterações não salvas. Salvar antes de adicionar nova pergunta?")) {
        return;
      }
      await saveAllChanges();
    }

    const maxStep = Math.max(...questions.map(q => q.step), 0);

    // Generate unique field_name
    let fieldName = `campo_${maxStep + 1}`;
    let counter = 1;
    while (questions.some(q => q.field_name === fieldName)) {
      counter++;
      fieldName = `campo_${maxStep + 1}_${counter}`;
    }
    try {
      const {
        error
      } = await supabase.from("form_questions").insert({
        step: maxStep + 1,
        question: "Nova pergunta",
        field_name: fieldName,
        options: [],
        input_type: 'text',
        subdomain: formName,
        required: true
      });
      if (error) throw error;
      toast({
        title: "Pergunta criada!"
      });
      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao criar pergunta",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const moveQuestion = async (questionId: string, direction: "up" | "down") => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (direction === "up" && currentIndex === 0 || direction === "down" && currentIndex === questions.length - 1) {
      return;
    }
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentQuestion = questions[currentIndex];
    const targetQuestion = questions[targetIndex];
    try {
      await supabase.from("form_questions").update({
        step: targetQuestion.step
      }).eq("id", currentQuestion.id);
      await supabase.from("form_questions").update({
        step: currentQuestion.step
      }).eq("id", targetQuestion.id);
      toast({
        title: "Ordem atualizada!"
      });
      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao mover pergunta",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>;
  }
  if (!user) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AuthDialog open={showAuthDialog} onOpenChange={open => {
        if (!open) {
          navigate("/");
        }
        setShowAuthDialog(open);
      }} />
      </div>;
  }

  // User is authenticated but not admin - will redirect via useEffect
  if (!isAdmin) {
    return <div className="min-h-screen flex items-center justify-center">
        <p>Verificando permissões...</p>
      </div>;
  }

  // Show loading while questions are being fetched
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <p>Carregando perguntas...</p>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/?preview=true")}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar Formulário
          </Button>
          <Button variant="outline" onClick={signOut}>
            Sair
          </Button>
        </div>

        {/* Configuration Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuração do Formulário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Form Name Atual</Label>
              <p className="text-sm font-mono bg-muted p-2 rounded">{formName}</p>
            </div>
            <div>
              <Label>Google Tag Manager ID</Label>
              <p className="text-sm font-mono bg-muted p-2 rounded">
                {import.meta.env.VITE_GTM_ID || "Não configurado"}
              </p>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Configure estas variáveis no arquivo <code className="bg-muted px-1 rounded">.env</code> para cada subdomínio:
              </p>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
              {`VITE_FORM_NAME=${formName}
VITE_GTM_ID=GTM-XXXXXXX`}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Logo Upload */}
        <LogoUploader />

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Editar Questionário</h1>
          <Button onClick={addNewQuestion}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Pergunta
          </Button>
        </div>

        <div className="space-y-4">
          {questions.map(question => <Card key={question.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Passo {question.step}</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => moveQuestion(question.id, "up")} disabled={questions.findIndex(q => q.id === question.id) === 0}>
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => moveQuestion(question.id, "down")} disabled={questions.findIndex(q => q.id === question.id) === questions.length - 1}>
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteQuestion(question.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Pergunta</Label>
                  <Input value={question.question} onChange={e => updateQuestionLocal(question.id, {
                question: e.target.value
              })} />
                </div>

                <div>
                  <Label>Subtexto (opcional)</Label>
                  <Input value={question.subtitle || ""} onChange={e => updateQuestionLocal(question.id, {
                subtitle: e.target.value
              })} placeholder="Texto explicativo abaixo da pergunta" />
                </div>

                <div>
                  <Label>Nome do Campo (banco de dados)</Label>
                  <Input value={question.field_name} onChange={e => updateQuestionLocal(question.id, {
                field_name: e.target.value
              })} />
                </div>

                {question.input_type !== 'select' && question.input_type !== 'password' && <div>
                    <Label>Texto do Campo de Resposta</Label>
                    <Input value={question.input_placeholder || ""} onChange={e => updateQuestionLocal(question.id, {
                input_placeholder: e.target.value
              })} placeholder="Ex: Digite qual é o seu nome completo?" />
                  </div>}

                {question.input_type !== 'select' && <div>
                    <Label>Limite de Caracteres (opcional)</Label>
                    <Input type="number" value={question.max_length || ""} onChange={e => updateQuestionLocal(question.id, {
                max_length: e.target.value ? parseInt(e.target.value) : undefined
              })} placeholder="Deixe vazio para sem limite" min="1" />
                  </div>}

                <div>
                  <Label>Tipo de Resposta</Label>
                  <Select value={question.input_type || 'text'} onValueChange={(value: 'text' | 'select' | 'password') => {
                updateQuestionLocal(question.id, {
                  input_type: value
                });
              }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Resposta Escrita</SelectItem>
                      <SelectItem value="password">Campo Oculto</SelectItem>
                      <SelectItem value="select">Múltipla Escolha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor={`required-${question.id}`}>Campo Obrigatório</Label>
                    <p className="text-sm text-muted-foreground">
                      Se desativado, o usuário pode pular esta pergunta
                    </p>
                  </div>
                  <Switch 
                    id={`required-${question.id}`}
                    checked={question.required !== false} 
                    onCheckedChange={(checked) => updateQuestionLocal(question.id, { required: checked })} 
                  />
                </div>

                {question.input_type === 'select' && <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Opções de Escolha</Label>
                      <Button variant="outline" size="sm" onClick={() => addOption(question.id)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Opção
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {question.options.map((option, index) => <div key={index} className="flex items-center gap-2">
                          <Input value={option} onChange={e => updateOption(question.id, index, e.target.value)} placeholder={`Opção ${index + 1}`} />
                          <Button variant="ghost" size="icon" onClick={() => removeOption(question.id, index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>)}
                    </div>
                  </div>}
              </CardContent>
            </Card>)}
        </div>

        {/* Configurações Gerais */}
        {settings && <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Configurações Gerais</h2>
            <Card>
              <CardHeader>
                <CardTitle>Botão WhatsApp e Página de Sucesso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="whatsapp-enabled">Exibir opção WhatsApp na página de obrigado</Label>
                    <p className="text-sm text-muted-foreground">
                      Ative para mostrar a seção do WhatsApp após o envio do formulário
                    </p>
                  </div>
                  <Switch id="whatsapp-enabled" checked={settings.whatsapp_enabled} onCheckedChange={checked => updateSettings({
                whatsapp_enabled: checked
              })} />
                </div>

                <div>
                  <Label>Número do WhatsApp</Label>
                  <Input value={settings.whatsapp_number} onChange={e => updateSettings({
                whatsapp_number: e.target.value
              })} placeholder="5531989236061" disabled={!settings.whatsapp_enabled} />
                  <p className="text-sm text-muted-foreground mt-1">
                    Formato: código do país + DDD + número (sem espaços ou caracteres especiais)
                  </p>
                </div>

                <div>
                  <Label>Mensagem do WhatsApp</Label>
                  <Input value={settings.whatsapp_message} onChange={e => updateSettings({
                whatsapp_message: e.target.value
              })} placeholder="Olá! Acabei de enviar meus dados no formulário." disabled={!settings.whatsapp_enabled} />
                  <p className="text-sm text-muted-foreground mt-1">
                    Mensagem que será enviada automaticamente ao abrir o WhatsApp
                  </p>
                </div>

                <div>
                  <Label>Título da Página de Sucesso</Label>
                  <Input value={settings.success_title} onChange={e => updateSettings({
                success_title: e.target.value
              })} placeholder="Obrigado" />
                </div>

                <div>
                  <Label>Descrição da Página de Sucesso</Label>
                  <Input value={settings.success_description} onChange={e => updateSettings({
                success_description: e.target.value
              })} placeholder="Recebemos suas informações com sucesso!" />
                </div>

                <div>
                  <Label>Subtítulo da Página de Sucesso</Label>
                  <Input value={settings.success_subtitle} onChange={e => updateSettings({
                success_subtitle: e.target.value
              })} placeholder="Em breve entraremos em contato." />
                </div>

                

                <Button onClick={saveSettings} disabled={!settingsChanged} className="w-full">
                  {settingsChanged ? "Salvar Configurações" : "Configurações Salvas"}
                </Button>
              </CardContent>
            </Card>
          </div>}

        {questions.length > 0 && <div className="flex justify-end mt-6 sticky bottom-6">
            <Button onClick={saveAllChanges} size="lg" disabled={!hasUnsavedChanges} className="shadow-lg">
              {hasUnsavedChanges ? "Salvar Alterações" : "Tudo Salvo"}
            </Button>
          </div>}
      </div>
    </div>;
};
export default Admin;