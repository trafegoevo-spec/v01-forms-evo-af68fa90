import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Eye, Plus, Trash2, ArrowUp, ArrowDown, X, Users, CheckCircle, Star, Shield, Zap, Heart, Award, ThumbsUp, Clock, Target, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthDialog } from "@/components/AuthDialog";
import { LogoUploader } from "@/components/LogoUploader";
import { CoverImageUploader } from "@/components/CoverImageUploader";
import { Switch } from "@/components/ui/switch";

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

interface SuccessPage {
  id: string;
  subdomain: string;
  page_key: string;
  title: string;
  subtitle: string;
  description: string;
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  whatsapp_message: string;
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

const AVAILABLE_ICONS = [
  { name: "CheckCircle", label: "Check", Icon: CheckCircle },
  { name: "Star", label: "Estrela", Icon: Star },
  { name: "Shield", label: "Escudo", Icon: Shield },
  { name: "Zap", label: "Raio", Icon: Zap },
  { name: "Heart", label: "Coração", Icon: Heart },
  { name: "Award", label: "Prêmio", Icon: Award },
  { name: "ThumbsUp", label: "Positivo", Icon: ThumbsUp },
  { name: "Clock", label: "Relógio", Icon: Clock },
  { name: "Target", label: "Alvo", Icon: Target },
];
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
  const [successPages, setSuccessPages] = useState<SuccessPage[]>([]);
  const [successPagesChanged, setSuccessPagesChanged] = useState(false);
  const [whatsappQueue, setWhatsappQueue] = useState<WhatsAppQueueItem[]>([]);
  const [whatsappQueueChanged, setWhatsappQueueChanged] = useState(false);
  const [currentQueuePosition, setCurrentQueuePosition] = useState(1);
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
        loadSuccessPages();
        loadWhatsappQueue();
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
        input_type: (['select', 'text', 'password', 'buttons'].includes(item.input_type) ? item.input_type : 'text') as 'text' | 'select' | 'password' | 'buttons',
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

  const loadWhatsappQueue = async () => {
    try {
      const { data, error } = await supabase
        .from("whatsapp_queue")
        .select("*")
        .eq("subdomain", formName)
        .order("position", { ascending: true });

      if (error) throw error;
      setWhatsappQueue(data || []);

      // Load current position
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
      const {
        data,
        error
      } = await supabase.from("app_settings").select("*").eq("subdomain", formName).maybeSingle();
      
      if (error) throw error;
      
      if (!data) {
        // Se não existir, criar configurações padrão
        const defaultTopics: CoverTopic[] = [
          { icon: "CheckCircle", text: "Tópico 1" },
          { icon: "CheckCircle", text: "Tópico 2" },
          { icon: "CheckCircle", text: "Tópico 3" }
        ];
        const defaultSettings = {
          subdomain: formName,
          form_name: formName,
          whatsapp_enabled: true,
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
        const {
          data: newData,
          error: insertError
        } = await supabase.from("app_settings").insert([defaultSettings]).select().single();
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
      const defaultTopics: CoverTopic[] = [
        { icon: "CheckCircle", text: "Tópico 1" },
        { icon: "CheckCircle", text: "Tópico 2" },
        { icon: "CheckCircle", text: "Tópico 3" }
      ];
      const parsedTopics = Array.isArray(data.cover_topics) 
        ? (data.cover_topics as unknown as CoverTopic[])
        : defaultTopics;
      setSettings({ 
        ...data, 
        cover_topics: parsedTopics,
        bg_gradient_from: data.bg_gradient_from || '#f0f9ff',
        bg_gradient_via: data.bg_gradient_via || '#ffffff',
        bg_gradient_to: data.bg_gradient_to || '#faf5ff',
        bg_gradient_direction: data.bg_gradient_direction || 'to-br'
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
      const {
        error
      } = await supabase.from("app_settings").update({
        whatsapp_number: settings.whatsapp_number,
        whatsapp_message: settings.whatsapp_message,
        success_title: settings.success_title,
        success_description: settings.success_description,
        success_subtitle: settings.success_subtitle,
        form_name: settings.form_name,
        whatsapp_enabled: settings.whatsapp_enabled,
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

  const addSuccessPage = async () => {
    const pageKey = `page_${Date.now()}`;
    try {
      const { error } = await supabase.from("success_pages").insert({
        subdomain: formName,
        page_key: pageKey,
        title: "Nova Página",
        subtitle: "Subtítulo",
        description: "Descrição",
        whatsapp_enabled: false,
        whatsapp_number: "5531989236061",
        whatsapp_message: "Olá!"
      });
      if (error) throw error;
      toast({ title: "Página de sucesso criada!" });
      loadSuccessPages();
    } catch (error: any) {
      toast({
        title: "Erro ao criar página",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateSuccessPage = (id: string, updates: Partial<SuccessPage>) => {
    setSuccessPages(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    setSuccessPagesChanged(true);
  };

  const saveSuccessPages = async () => {
    try {
      for (const page of successPages) {
        const { error } = await supabase.from("success_pages").update({
          page_key: page.page_key,
          title: page.title,
          subtitle: page.subtitle,
          description: page.description,
          whatsapp_enabled: page.whatsapp_enabled,
          whatsapp_number: page.whatsapp_number,
          whatsapp_message: page.whatsapp_message
        }).eq("id", page.id);
        if (error) throw error;
      }
      toast({ title: "Páginas de sucesso salvas!" });
      setSuccessPagesChanged(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const deleteSuccessPage = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta página?")) return;
    try {
      const { error } = await supabase.from("success_pages").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Página excluída!" });
      loadSuccessPages();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const saveAllChanges = async () => {
    try {
      for (const question of questions) {
        const {
          error
        } = await supabase.from("form_questions").update({
          step: question.step,
          question: question.question,
          subtitle: question.subtitle,
          field_name: question.field_name,
          input_type: question.input_type,
          options: question.options,
          max_length: question.max_length,
          input_placeholder: question.input_placeholder,
          required: question.required !== undefined ? question.required : true,
          conditional_logic: question.conditional_logic ? JSON.parse(JSON.stringify(question.conditional_logic)) : null
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

        {/* Cover Page Settings */}
        {settings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Página de Capa (Landing Page)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="cover-enabled">Ativar página de capa</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibe uma página inicial antes do formulário
                  </p>
                </div>
                <Switch 
                  id="cover-enabled"
                  checked={settings.cover_enabled} 
                  onCheckedChange={(checked) => updateSettings({ cover_enabled: checked })} 
                />
              </div>

              <div>
                <Label>Título da Capa</Label>
                <Input 
                  value={settings.cover_title} 
                  onChange={(e) => updateSettings({ cover_title: e.target.value })} 
                  placeholder="Bem-vindo"
                  disabled={!settings.cover_enabled}
                />
              </div>

              <div>
                <Label>Subtítulo da Capa</Label>
                <Input 
                  value={settings.cover_subtitle} 
                  onChange={(e) => updateSettings({ cover_subtitle: e.target.value })} 
                  placeholder="Preencha o formulário e entre em contato conosco"
                  disabled={!settings.cover_enabled}
                />
              </div>

              <div>
                <Label>Texto do Botão (CTA)</Label>
                <Input 
                  value={settings.cover_cta_text} 
                  onChange={(e) => updateSettings({ cover_cta_text: e.target.value })} 
                  placeholder="Começar"
                  disabled={!settings.cover_enabled}
                />
              </div>

              {/* Topic Editor */}
              <div className="space-y-3">
                <Label>Tópicos (até 3)</Label>
                <p className="text-sm text-muted-foreground">Configure os tópicos que aparecem abaixo do subtítulo</p>
                {settings.cover_topics.map((topic, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={topic.icon}
                      onValueChange={(value) => {
                        const newTopics = [...settings.cover_topics];
                        newTopics[index] = { ...newTopics[index], icon: value };
                        updateSettings({ cover_topics: newTopics });
                      }}
                      disabled={!settings.cover_enabled}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue>
                          {(() => {
                            const iconItem = AVAILABLE_ICONS.find(i => i.name === topic.icon);
                            if (iconItem) {
                              const IconComp = iconItem.Icon;
                              return <div className="flex items-center gap-2"><IconComp className="h-4 w-4" />{iconItem.label}</div>;
                            }
                            return topic.icon;
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ICONS.map((iconItem) => (
                          <SelectItem key={iconItem.name} value={iconItem.name}>
                            <div className="flex items-center gap-2">
                              <iconItem.Icon className="h-4 w-4" />
                              {iconItem.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      value={topic.text} 
                      onChange={(e) => {
                        const newTopics = [...settings.cover_topics];
                        newTopics[index] = { ...newTopics[index], text: e.target.value };
                        updateSettings({ cover_topics: newTopics });
                      }} 
                      placeholder={`Tópico ${index + 1}`}
                      disabled={!settings.cover_enabled}
                      className="flex-1"
                    />
                    {settings.cover_topics.length > 1 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          const newTopics = settings.cover_topics.filter((_, i) => i !== index);
                          updateSettings({ cover_topics: newTopics });
                        }}
                        disabled={!settings.cover_enabled}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {settings.cover_topics.length < 3 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const newTopics = [...settings.cover_topics, { icon: "CheckCircle", text: "" }];
                      updateSettings({ cover_topics: newTopics });
                    }}
                    disabled={!settings.cover_enabled}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Tópico
                  </Button>
                )}
              </div>

              <div>
                <Label>Imagem da Capa</Label>
                <div className="mt-2">
                  <CoverImageUploader
                    currentImageUrl={settings.cover_image_url}
                    onImageChange={(url) => updateSettings({ cover_image_url: url })}
                    disabled={!settings.cover_enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Background Gradient Settings */}
        {settings && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Background Gradiente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Escolha um dos gradientes disponíveis para o fundo das páginas.
              </p>

              {/* Gradient Presets */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {[
                  { name: "Cream", from: "#faf7f2", via: "#f5f0e8", to: "#ede5d8", direction: "to-br" },
                  { name: "Sand", from: "#fef6e4", via: "#f8ead0", to: "#f0dfc0", direction: "to-br" },
                  { name: "Blush", from: "#fdf2f0", via: "#f9e5e0", to: "#f5d5cc", direction: "to-br" },
                  { name: "Apricot", from: "#fff5eb", via: "#ffe8d6", to: "#ffd4b8", direction: "to-b" },
                  { name: "Sunset", from: "#fef3e2", via: "#fde5c8", to: "#fbc99a", direction: "to-br" },
                  { name: "Latte", from: "#f9f5f0", via: "#f0e8dd", to: "#e5d8c8", direction: "to-br" },
                  { name: "Pearl", from: "#fafafa", via: "#f5f5f5", to: "#ebebeb", direction: "to-b" },
                  { name: "Ivory", from: "#fffef5", via: "#fdfcf0", to: "#f8f5e8", direction: "to-br" },
                  { name: "Nude", from: "#f8f2ed", via: "#f0e5dc", to: "#e8d8cc", direction: "to-br" },
                  { name: "Sage", from: "#f5f7f2", via: "#e8ece0", to: "#dce3d0", direction: "to-br" },
                  { name: "Mist", from: "#f5f8fa", via: "#e8f0f5", to: "#dce8f0", direction: "to-b" },
                  { name: "Rose", from: "#fdf4f5", via: "#f8e8ea", to: "#f0dce0", direction: "to-br" },
                ].map((preset) => {
                  const isActive = 
                    settings.bg_gradient_from === preset.from &&
                    settings.bg_gradient_via === preset.via &&
                    settings.bg_gradient_to === preset.to &&
                    settings.bg_gradient_direction === preset.direction;
                  
                  return (
                    <button
                      key={preset.name}
                      onClick={() => updateSettings({
                        bg_gradient_from: preset.from,
                        bg_gradient_via: preset.via,
                        bg_gradient_to: preset.to,
                        bg_gradient_direction: preset.direction
                      })}
                      className={`group relative h-20 rounded-lg border-2 overflow-hidden transition-all hover:scale-105 hover:shadow-md ${
                        isActive ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                      }`}
                      style={{
                        background: `linear-gradient(${
                          preset.direction === 'to-t' ? '0deg' :
                          preset.direction === 'to-b' ? '180deg' :
                          preset.direction === 'to-l' ? '270deg' :
                          preset.direction === 'to-r' ? '90deg' :
                          '135deg'
                        }, ${preset.from}, ${preset.via}, ${preset.to})`
                      }}
                    >
                      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-medium px-2 py-0.5 rounded transition-opacity ${
                        isActive ? 'bg-primary text-primary-foreground opacity-100' : 'bg-background/80 opacity-0 group-hover:opacity-100'
                      }`}>
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Preview */}
              <div>
                <Label>Pré-visualização</Label>
                <div 
                  className="h-24 rounded-lg border mt-2"
                  style={{
                    background: `linear-gradient(${
                      settings.bg_gradient_direction === 'to-t' ? '0deg' :
                      settings.bg_gradient_direction === 'to-b' ? '180deg' :
                      settings.bg_gradient_direction === 'to-l' ? '270deg' :
                      settings.bg_gradient_direction === 'to-r' ? '90deg' :
                      settings.bg_gradient_direction === 'to-tl' ? '315deg' :
                      settings.bg_gradient_direction === 'to-tr' ? '45deg' :
                      settings.bg_gradient_direction === 'to-bl' ? '225deg' :
                      '135deg'
                    }, ${settings.bg_gradient_from}, ${settings.bg_gradient_via}, ${settings.bg_gradient_to})`
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

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
                  <div className="flex items-center gap-3">
                    <span>Etapa</span>
                    <Input
                      type="number"
                      min="1"
                      value={question.step}
                      onChange={(e) => updateQuestionLocal(question.id, { step: parseInt(e.target.value) || 1 })}
                      className="w-16 h-8"
                    />
                  </div>
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

                {question.input_type !== 'select' && question.input_type !== 'password' && question.input_type !== 'buttons' && <div>
                    <Label>Texto do Campo de Resposta</Label>
                    <Input value={question.input_placeholder || ""} onChange={e => updateQuestionLocal(question.id, {
                input_placeholder: e.target.value
              })} placeholder="Ex: Digite qual é o seu nome completo?" />
                  </div>}

                {question.input_type !== 'select' && question.input_type !== 'buttons' && <div>
                    <Label>Limite de Caracteres (opcional)</Label>
                    <Input type="number" value={question.max_length || ""} onChange={e => updateQuestionLocal(question.id, {
                max_length: e.target.value ? parseInt(e.target.value) : undefined
              })} placeholder="Deixe vazio para sem limite" min="1" />
                  </div>}

                <div>
                  <Label>Tipo de Resposta</Label>
                  <Select value={question.input_type || 'text'} onValueChange={(value: 'text' | 'select' | 'password' | 'buttons') => {
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
                      <SelectItem value="select">Múltipla Escolha (Dropdown)</SelectItem>
                      <SelectItem value="buttons">Botões Clicáveis</SelectItem>
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

                {(question.input_type === 'select' || question.input_type === 'buttons') && <div>
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

                {/* Lógica Condicional - apenas para perguntas de múltipla escolha */}
                {(question.input_type === 'select' || question.input_type === 'buttons') && question.options.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Label>Lógica Condicional</Label>
                        <p className="text-sm text-muted-foreground">
                          Configure ações baseadas na resposta do usuário
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => addConditionalRule(question.id)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Regra
                      </Button>
                    </div>
                    
                    {question.conditional_logic?.conditions?.map((condition, condIndex) => (
                      <div key={condIndex} className="flex flex-col gap-2 p-3 border rounded-lg mb-2 bg-muted/30">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">Se responder</span>
                          <Select
                            value={condition.value}
                            onValueChange={(value) => updateConditionalRule(question.id, condIndex, { value })}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.map((opt) => (
                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <span className="text-sm font-medium">então</span>
                          <Select
                            value={condition.action}
                            onValueChange={(value: "skip_to_step" | "success_page") => 
                              updateConditionalRule(question.id, condIndex, { action: value })
                            }
                          >
                            <SelectTrigger className="w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="skip_to_step">Pular para passo</SelectItem>
                              <SelectItem value="success_page">Ir para página de sucesso</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {condition.action === "skip_to_step" && (
                            <Input
                              type="number"
                              className="w-20"
                              value={condition.target_step || ""}
                              onChange={(e) => updateConditionalRule(question.id, condIndex, { 
                                target_step: parseInt(e.target.value) || undefined 
                              })}
                              placeholder="Passo"
                              min="1"
                              max={questions.length}
                            />
                          )}
                          
                          {condition.action === "success_page" && (
                            <Select
                              value={condition.target_page || "default"}
                              onValueChange={(value) => updateConditionalRule(question.id, condIndex, { target_page: value })}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="default">Página Padrão</SelectItem>
                                {successPages.map((page) => (
                                  <SelectItem key={page.id} value={page.page_key}>
                                    {page.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeConditionalRule(question.id, condIndex)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {(!question.conditional_logic?.conditions || question.conditional_logic.conditions.length === 0) && (
                      <p className="text-sm text-muted-foreground italic">
                        Nenhuma regra condicional configurada. Por padrão, irá para o próximo passo.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>)}
        </div>

        {/* Configurações Gerais */}
        {settings && <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-bold">Configurações Gerais</h2>
            
            {/* Página de Obrigado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Página de Obrigado
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Personalize os textos exibidos após o envio do formulário
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Título Principal</Label>
                  <Input 
                    value={settings.success_title} 
                    onChange={e => updateSettings({ success_title: e.target.value })} 
                    placeholder="Obrigado!" 
                    className="text-lg"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Texto grande exibido no topo (ex: "Obrigado!", "Parabéns!")
                  </p>
                </div>

                <div>
                  <Label>Subtítulo</Label>
                  <Input 
                    value={settings.success_subtitle} 
                    onChange={e => updateSettings({ success_subtitle: e.target.value })} 
                    placeholder="Recebemos suas informações com sucesso!" 
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Texto secundário logo abaixo do título
                  </p>
                </div>

                <div>
                  <Label>Descrição / Instruções</Label>
                  <textarea
                    value={settings.success_description}
                    onChange={e => updateSettings({ success_description: e.target.value })}
                    placeholder="Em breve entraremos em contato para dar continuidade ao seu atendimento."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Texto explicativo ou próximos passos para o usuário
                  </p>
                </div>

                <Button onClick={saveSettings} disabled={!settingsChanged} className="w-full">
                  {settingsChanged ? "Salvar Configurações da Página" : "Configurações Salvas"}
                </Button>
              </CardContent>
            </Card>

            {/* WhatsApp */}
            <Card>
              <CardHeader>
                <CardTitle>Botão WhatsApp</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure a integração com WhatsApp na página de obrigado
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="whatsapp-enabled">Exibir opção WhatsApp</Label>
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
                  <textarea
                    value={settings.whatsapp_message}
                    onChange={e => updateSettings({ whatsapp_message: e.target.value })}
                    placeholder="Olá! Acabei de enviar meus dados no formulário."
                    disabled={!settings.whatsapp_enabled}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    rows={2}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Mensagem que será enviada automaticamente ao abrir o WhatsApp
                  </p>
                </div>

                <Button onClick={saveSettings} disabled={!settingsChanged} className="w-full">
                  {settingsChanged ? "Salvar Configurações" : "Configurações Salvas"}
                </Button>
              </CardContent>
            </Card>
          </div>}

        {/* Fila de WhatsApp - Rotação */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Fila de WhatsApp (Rotação)
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure até 5 números que serão usados em rotação. Cada lead será direcionado para o próximo número da fila.
              </p>
            </div>
            <Button onClick={addWhatsappQueueItem} disabled={whatsappQueue.length >= 5}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Número
            </Button>
          </div>

          {whatsappQueue.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p>Nenhum número na fila. Será usado o número configurado em "Configurações Gerais".</p>
                <Button onClick={addWhatsappQueueItem} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Primeiro Número
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <span className="font-medium">Próximo na fila:</span>{" "}
                {(() => {
                  const activeItems = whatsappQueue.filter(q => q.is_active);
                  const currentItem = activeItems.find(q => q.position === currentQueuePosition) 
                    || activeItems[0];
                  return currentItem 
                    ? `${currentItem.display_name || "Sem nome"} (${currentItem.phone_number})`
                    : "Nenhum número ativo";
                })()}
              </div>

              {whatsappQueue.map((item, index) => (
                <Card key={item.id} className={!item.is_active ? "opacity-60" : ""}>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center bg-primary/10 rounded-lg p-3 min-w-[60px]">
                        <span className="text-xs text-muted-foreground">Posição</span>
                        <span className="text-2xl font-bold text-primary">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Nome do Vendedor</Label>
                            <Input 
                              value={item.display_name || ""} 
                              onChange={(e) => updateWhatsappQueueItem(item.id, { display_name: e.target.value })}
                              placeholder="Ex: Vendedor 1, Maria"
                            />
                          </div>
                          <div>
                            <Label>Número WhatsApp</Label>
                            <Input 
                              value={item.phone_number} 
                              onChange={(e) => updateWhatsappQueueItem(item.id, { phone_number: e.target.value })}
                              placeholder="5531999999999"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={item.is_active} 
                              onCheckedChange={(checked) => updateWhatsappQueueItem(item.id, { is_active: checked })}
                            />
                            <Label className="text-sm">
                              {item.is_active ? "Ativo" : "Inativo (pulado na rotação)"}
                            </Label>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteWhatsappQueueItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button 
                onClick={saveWhatsappQueue} 
                disabled={!whatsappQueueChanged} 
                className="w-full"
              >
                {whatsappQueueChanged ? "Salvar Fila de WhatsApp" : "Fila Salva"}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                A cada novo lead, o sistema redireciona para o próximo número ativo da fila automaticamente.
              </p>
            </div>
          )}
        </div>

        {/* Páginas de Sucesso Condicionais */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Páginas de Sucesso Condicionais</h2>
            <Button onClick={addSuccessPage}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Página
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Crie páginas de sucesso personalizadas para usar com a lógica condicional.
          </p>
          
          {successPages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhuma página de sucesso condicional criada ainda.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {successPages.map((page) => (
                <Card key={page.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Página: {page.page_key}</span>
                      <Button variant="ghost" size="icon" onClick={() => deleteSuccessPage(page.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Identificador (page_key)</Label>
                      <Input 
                        value={page.page_key} 
                        onChange={(e) => updateSuccessPage(page.id, { page_key: e.target.value })} 
                        placeholder="identificador_unico"
                      />
                      <p className="text-sm text-muted-foreground mt-1">
                        Use este identificador nas regras condicionais
                      </p>
                    </div>
                    
                    <div>
                      <Label>Título</Label>
                      <Input 
                        value={page.title} 
                        onChange={(e) => updateSuccessPage(page.id, { title: e.target.value })} 
                        placeholder="Obrigado"
                      />
                    </div>
                    
                    <div>
                      <Label>Descrição</Label>
                      <Input 
                        value={page.description} 
                        onChange={(e) => updateSuccessPage(page.id, { description: e.target.value })} 
                        placeholder="Mensagem de sucesso"
                      />
                    </div>
                    
                    <div>
                      <Label>Subtítulo</Label>
                      <Input 
                        value={page.subtitle} 
                        onChange={(e) => updateSuccessPage(page.id, { subtitle: e.target.value })} 
                        placeholder="Subtítulo"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>WhatsApp Habilitado</Label>
                        <p className="text-sm text-muted-foreground">
                          Exibir botão do WhatsApp nesta página
                        </p>
                      </div>
                      <Switch 
                        checked={page.whatsapp_enabled} 
                        onCheckedChange={(checked) => updateSuccessPage(page.id, { whatsapp_enabled: checked })} 
                      />
                    </div>
                    
                    {page.whatsapp_enabled && (
                      <>
                        <div>
                          <Label>Número WhatsApp</Label>
                          <Input 
                            value={page.whatsapp_number} 
                            onChange={(e) => updateSuccessPage(page.id, { whatsapp_number: e.target.value })} 
                            placeholder="5531989236061"
                          />
                        </div>
                        
                        <div>
                          <Label>Mensagem WhatsApp</Label>
                          <Input 
                            value={page.whatsapp_message} 
                            onChange={(e) => updateSuccessPage(page.id, { whatsapp_message: e.target.value })} 
                            placeholder="Olá!"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              <Button 
                onClick={saveSuccessPages} 
                disabled={!successPagesChanged} 
                className="w-full"
              >
                {successPagesChanged ? "Salvar Páginas de Sucesso" : "Páginas Salvas"}
              </Button>
            </div>
          )}
        </div>

        {questions.length > 0 && <div className="flex justify-end mt-6 sticky bottom-6">
            <Button onClick={saveAllChanges} size="lg" disabled={!hasUnsavedChanges} className="shadow-lg">
              {hasUnsavedChanges ? "Salvar Alterações" : "Tudo Salvo"}
            </Button>
          </div>}
      </div>
    </div>;
};
export default Admin;