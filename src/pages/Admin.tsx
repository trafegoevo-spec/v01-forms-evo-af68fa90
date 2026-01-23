import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, BarChart3 } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminFormEditor } from "@/components/admin/AdminFormEditor";
import { AdminAppearance } from "@/components/admin/AdminAppearance";
import { AdminPostConversion } from "@/components/admin/AdminPostConversion";
import { AdminWhatsAppQueue } from "@/components/admin/AdminWhatsAppQueue";
import { AdminIntegrations } from "@/components/admin/AdminIntegrations";

interface WhatsAppQueueItem {
  id: string;
  subdomain: string;
  phone_number: string;
  display_name: string | null;
  position: number;
  is_active: boolean;
}

interface ConditionalRule {
  value: string;
  action: "skip_to_step" | "success_page";
  target_step?: number;
  target_page?: string;
  skip_submit?: boolean;
}

interface ConditionalLogic {
  conditions: ConditionalRule[];
}

interface FormQuestion {
  id: string;
  step: number;
  question: string;
  subtitle?: string;
  options: string[];
  field_name: string;
  input_type?: 'text' | 'select' | 'password' | 'buttons';
  max_length?: number;
  input_placeholder?: string;
  required?: boolean;
  conditional_logic?: ConditionalLogic | null;
}

interface CoverTopic {
  icon: string;
  text: string;
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
  whatsapp_on_submit: boolean;
  subdomain: string;
  cover_enabled: boolean;
  cover_title: string;
  cover_subtitle: string;
  cover_cta_text: string;
  cover_image_url: string | null;
  cover_topics: CoverTopic[];
  bg_gradient_from: string;
  bg_gradient_via: string;
  bg_gradient_to: string;
  bg_gradient_direction: string;
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [whatsappQueue, setWhatsappQueue] = useState<WhatsAppQueueItem[]>([]);
  const [whatsappQueueChanged, setWhatsappQueueChanged] = useState(false);
  const [currentQueuePosition, setCurrentQueuePosition] = useState(1);
  
  const formName = import.meta.env.VITE_FORM_NAME || "default";
  const gtmId = import.meta.env.VITE_GTM_ID || "";

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setShowAuthDialog(true);
      } else if (user && !isAdmin) {
        navigate("/");
      } else if (user && isAdmin) {
        setShowAuthDialog(false);
        loadQuestions();
        loadSettings();
        loadWhatsappQueue();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

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
        input_type: (['select', 'text', 'password', 'buttons'].includes(item.input_type) 
          ? item.input_type 
          : 'text') as 'text' | 'select' | 'password' | 'buttons',
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

  const loadWhatsappQueue = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_queue")
        .select("*")
        .eq("subdomain", formName)
        .order("position", { ascending: true });

      if (error) throw error;
      setWhatsappQueue(data || []);

      const { data: stateData } = await supabase
        .from("whatsapp_queue_state")
        .select("current_position")
        .eq("subdomain", formName)
        .single();

      if (stateData) {
        setCurrentQueuePosition(stateData.current_position);
      }
    } catch (error: any) {
      console.error("Erro ao carregar fila de WhatsApp:", error);
    }
  };

  const addWhatsappQueueItem = async () => {
    if (whatsappQueue.length >= 5) {
      toast({
        title: "Limite atingido",
        description: "Você pode adicionar no máximo 5 números na fila.",
        variant: "destructive"
      });
      return;
    }

    const newPosition = whatsappQueue.length > 0 
      ? Math.max(...whatsappQueue.map(q => q.position)) + 1 
      : 1;

    try {
      const { error } = await supabase.from("whatsapp_queue").insert({
        subdomain: formName,
        phone_number: "5531999999999",
        display_name: `Vendedor ${newPosition}`,
        position: newPosition,
        is_active: true
      });

      if (error) throw error;
      toast({ title: "Número adicionado à fila!" });
      loadWhatsappQueue();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateWhatsappQueueItem = (id: string, updates: Partial<WhatsAppQueueItem>) => {
    setWhatsappQueue(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    setWhatsappQueueChanged(true);
  };

  const saveWhatsappQueue = async () => {
    try {
      for (const item of whatsappQueue) {
        const { error } = await supabase.from("whatsapp_queue").update({
          phone_number: item.phone_number,
          display_name: item.display_name,
          is_active: item.is_active
        }).eq("id", item.id);
        
        if (error) throw error;
      }
      toast({ title: "Fila de WhatsApp salva!" });
      setWhatsappQueueChanged(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteWhatsappQueueItem = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este número da fila?")) return;
    
    try {
      const { error } = await supabase.from("whatsapp_queue").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Número removido!" });
      loadWhatsappQueue();
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .eq("subdomain", formName)
        .maybeSingle();
      
      if (error) throw error;
      
      const defaultTopics: CoverTopic[] = [
        { icon: "CheckCircle", text: "Tópico 1" },
        { icon: "CheckCircle", text: "Tópico 2" },
        { icon: "CheckCircle", text: "Tópico 3" }
      ];

      if (!data) {
        const defaultSettings = {
          subdomain: formName,
          form_name: formName,
          whatsapp_enabled: true,
          whatsapp_on_submit: false,
          whatsapp_number: '5531989236061',
          whatsapp_message: 'Olá! Acabei de enviar meus dados no formulário.',
          success_title: 'Obrigado',
          success_description: 'Recebemos suas informações com sucesso!',
          success_subtitle: 'Em breve entraremos em contato.',
          cover_enabled: false,
          cover_title: 'Bem-vindo',
          cover_subtitle: 'Preencha o formulário e entre em contato conosco',
          cover_cta_text: 'Começar',
          cover_image_url: null,
          cover_topics: JSON.parse(JSON.stringify(defaultTopics)),
          bg_gradient_from: '#f0f9ff',
          bg_gradient_via: '#ffffff',
          bg_gradient_to: '#faf5ff',
          bg_gradient_direction: 'to-br'
        };
        
        const { data: newData, error: insertError } = await supabase
          .from("app_settings")
          .insert([defaultSettings])
          .select()
          .single();
        
        if (insertError) throw insertError;
        
        const parsedTopics = Array.isArray(newData.cover_topics) 
          ? (newData.cover_topics as unknown as CoverTopic[])
          : defaultTopics;
        
        setSettings({ 
          ...newData, 
          cover_topics: parsedTopics,
          bg_gradient_from: newData.bg_gradient_from || '#f0f9ff',
          bg_gradient_via: newData.bg_gradient_via || '#ffffff',
          bg_gradient_to: newData.bg_gradient_to || '#faf5ff',
          bg_gradient_direction: newData.bg_gradient_direction || 'to-br'
        } as AppSettings);
        
        toast({
          title: "Configurações criadas",
          description: "Configurações padrão foram criadas automaticamente."
        });
        return;
      }

      const parsedTopics = Array.isArray(data.cover_topics) 
        ? (data.cover_topics as unknown as CoverTopic[])
        : defaultTopics;
      
      setSettings({ 
        ...data, 
        cover_topics: parsedTopics,
        bg_gradient_from: data.bg_gradient_from || '#f0f9ff',
        bg_gradient_via: data.bg_gradient_via || '#ffffff',
        bg_gradient_to: data.bg_gradient_to || '#faf5ff',
        bg_gradient_direction: data.bg_gradient_direction || 'to-br',
        whatsapp_on_submit: data.whatsapp_on_submit || false
      } as AppSettings);
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
      const { error } = await supabase.from("app_settings").update({
        whatsapp_number: settings.whatsapp_number,
        whatsapp_message: settings.whatsapp_message,
        success_title: settings.success_title,
        success_description: settings.success_description,
        success_subtitle: settings.success_subtitle,
        form_name: settings.form_name,
        whatsapp_enabled: settings.whatsapp_enabled,
        whatsapp_on_submit: settings.whatsapp_on_submit,
        cover_enabled: settings.cover_enabled,
        cover_title: settings.cover_title,
        cover_subtitle: settings.cover_subtitle,
        cover_cta_text: settings.cover_cta_text,
        cover_image_url: settings.cover_image_url,
        cover_topics: JSON.parse(JSON.stringify(settings.cover_topics)),
        bg_gradient_from: settings.bg_gradient_from,
        bg_gradient_via: settings.bg_gradient_via,
        bg_gradient_to: settings.bg_gradient_to,
        bg_gradient_direction: settings.bg_gradient_direction
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
    setSettings({ ...settings, ...updates });
    setSettingsChanged(true);
  };

  const updateQuestionLocal = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    setHasUnsavedChanges(true);
  };

  const addConditionalRule = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const currentLogic = question.conditional_logic || { conditions: [] };
    const newCondition: ConditionalRule = {
      value: question.options[0] || "",
      action: "skip_to_step",
      target_step: question.step + 1
    };
    
    updateQuestionLocal(questionId, {
      conditional_logic: {
        conditions: [...currentLogic.conditions, newCondition]
      }
    });
  };

  const updateConditionalRule = (questionId: string, index: number, updates: Partial<ConditionalRule>) => {
    const question = questions.find(q => q.id === questionId);
    if (!question?.conditional_logic) return;
    
    const newConditions = question.conditional_logic.conditions.map((c, i) => 
      i === index ? { ...c, ...updates } : c
    );
    
    updateQuestionLocal(questionId, {
      conditional_logic: { conditions: newConditions }
    });
  };

  const removeConditionalRule = (questionId: string, index: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question?.conditional_logic) return;
    
    const newConditions = question.conditional_logic.conditions.filter((_, i) => i !== index);
    
    updateQuestionLocal(questionId, {
      conditional_logic: newConditions.length > 0 ? { conditions: newConditions } : null
    });
  };

  const saveAllChanges = async () => {
    try {
      for (const question of questions) {
        const { error } = await supabase.from("form_questions").update({
          step: question.step,
          question: question.question,
          subtitle: question.subtitle,
          field_name: question.field_name,
          input_type: question.input_type,
          options: question.options,
          max_length: question.max_length,
          input_placeholder: question.input_placeholder,
          required: question.required !== undefined ? question.required : true,
          conditional_logic: question.conditional_logic 
            ? JSON.parse(JSON.stringify(question.conditional_logic)) 
            : null
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
      const { error } = await supabase.from("form_questions").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Pergunta excluída!" });
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
    updateQuestionLocal(questionId, { options: newOptions });
  };

  const removeOption = (questionId: string, index: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    const newOptions = question.options.filter((_, i) => i !== index);
    updateQuestionLocal(questionId, { options: newOptions });
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    const newOptions = question.options.map((opt, i) => i === optionIndex ? value : opt);
    updateQuestionLocal(questionId, { options: newOptions });
  };

  const addNewQuestion = async () => {
    if (hasUnsavedChanges) {
      if (!confirm("Você tem alterações não salvas. Salvar antes de adicionar nova pergunta?")) {
        return;
      }
      await saveAllChanges();
    }

    const maxStep = Math.max(...questions.map(q => q.step), 0);
    let fieldName = `campo_${maxStep + 1}`;
    let counter = 1;
    while (questions.some(q => q.field_name === fieldName)) {
      counter++;
      fieldName = `campo_${maxStep + 1}_${counter}`;
    }
    
    try {
      const { error } = await supabase.from("form_questions").insert({
        step: maxStep + 1,
        question: "Nova pergunta",
        field_name: fieldName,
        options: [],
        input_type: 'text',
        subdomain: formName,
        required: true
      });
      if (error) throw error;
      toast({ title: "Pergunta criada!" });
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
      await supabase.from("form_questions").update({ step: targetQuestion.step }).eq("id", currentQuestion.id);
      await supabase.from("form_questions").update({ step: currentQuestion.step }).eq("id", targetQuestion.id);
      toast({ title: "Ordem atualizada!" });
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AuthDialog 
          open={showAuthDialog} 
          onOpenChange={open => {
            if (!open) navigate("/");
            setShowAuthDialog(open);
          }} 
        />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando permissões...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando perguntas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/?preview=true")}>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar Formulário
            </Button>
            <Button variant="ghost" onClick={() => navigate("/relatorio")}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver Relatório
            </Button>
          </div>
          <Button variant="outline" onClick={signOut}>
            Sair
          </Button>
        </div>

        <h1 className="text-2xl font-bold mb-6">Gerenciamento do Formulário</h1>

        <Tabs defaultValue="formulario" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="formulario">Formulário</TabsTrigger>
            <TabsTrigger value="aparencia">Aparência</TabsTrigger>
            <TabsTrigger value="pos-conversao">Pós-Conversão</TabsTrigger>
            <TabsTrigger value="whatsapp-rotacao">WhatsApp Rotação</TabsTrigger>
            <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          </TabsList>

          <TabsContent value="formulario">
            <AdminFormEditor
              questions={questions}
              hasUnsavedChanges={hasUnsavedChanges}
              onUpdateQuestion={updateQuestionLocal}
              onDeleteQuestion={deleteQuestion}
              onAddQuestion={addNewQuestion}
              onMoveQuestion={moveQuestion}
              onAddOption={addOption}
              onRemoveOption={removeOption}
              onUpdateOption={updateOption}
              onAddConditionalRule={addConditionalRule}
              onUpdateConditionalRule={updateConditionalRule}
              onRemoveConditionalRule={removeConditionalRule}
              onSaveAllChanges={saveAllChanges}
            />
          </TabsContent>

          <TabsContent value="aparencia">
            <AdminAppearance
              settings={settings}
              settingsChanged={settingsChanged}
              onUpdateSettings={updateSettings}
              onSaveSettings={saveSettings}
            />
          </TabsContent>

          <TabsContent value="pos-conversao">
            <AdminPostConversion
              settings={settings}
              settingsChanged={settingsChanged}
              onUpdateSettings={updateSettings}
              onSaveSettings={saveSettings}
            />
          </TabsContent>

          <TabsContent value="whatsapp-rotacao">
            <AdminWhatsAppQueue
              whatsappQueue={whatsappQueue}
              currentQueuePosition={currentQueuePosition}
              whatsappQueueChanged={whatsappQueueChanged}
              onAddItem={addWhatsappQueueItem}
              onUpdateItem={updateWhatsappQueueItem}
              onDeleteItem={deleteWhatsappQueueItem}
              onSaveQueue={saveWhatsappQueue}
            />
          </TabsContent>

          <TabsContent value="integracoes">
            <AdminIntegrations formName={formName} gtmId={gtmId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
