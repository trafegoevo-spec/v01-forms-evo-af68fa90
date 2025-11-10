import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AuthDialog } from "@/components/AuthDialog";
import { LogoUploader } from "@/components/LogoUploader";

interface FormQuestion {
  id: string;
  step: number;
  question: string;
  subtitle?: string;
  options: string[];
  field_name: string;
  input_type?: 'text' | 'select';
}

const Admin = () => {
  const { user, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

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
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from("form_questions")
        .select("*")
        .order("step", { ascending: true });

      if (error) throw error;
      
      // Transform data to match FormQuestion type
      const transformedData = (data || []).map(item => ({
        ...item,
        options: Array.isArray(item.options) ? item.options as string[] : [],
        input_type: (item.input_type === 'select' || item.input_type === 'text' ? item.input_type : 'text') as 'text' | 'select'
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

  const updateQuestionLocal = (id: string, updates: Partial<FormQuestion>) => {
    setQuestions(prev => 
      prev.map(q => q.id === id ? { ...q, ...updates } : q)
    );
    setHasUnsavedChanges(true);
  };

  const saveAllChanges = async () => {
    try {
      for (const question of questions) {
        const { error } = await supabase
          .from("form_questions")
          .update({
            question: question.question,
            subtitle: question.subtitle,
            field_name: question.field_name,
            input_type: question.input_type,
            options: question.options,
          })
          .eq("id", question.id);

        if (error) throw error;
      }

      toast({
        title: "Alterações salvas!",
        description: "Todas as mudanças foram salvas com sucesso.",
      });

      setHasUnsavedChanges(false);
      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta pergunta?")) return;

    try {
      const { error } = await supabase
        .from("form_questions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Pergunta excluída!",
      });

      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
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
    const maxStep = Math.max(...questions.map(q => q.step), 0);
    
    // Generate unique field_name
    let fieldName = `campo_${maxStep + 1}`;
    let counter = 1;
    while (questions.some(q => q.field_name === fieldName)) {
      counter++;
      fieldName = `campo_${maxStep + 1}_${counter}`;
    }
    
    try {
      const { error } = await supabase
        .from("form_questions")
        .insert({
          step: maxStep + 1,
          question: "Nova pergunta",
          field_name: fieldName,
          options: [],
          input_type: 'text',
        });

      if (error) throw error;

      toast({
        title: "Pergunta criada!",
      });

      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao criar pergunta",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const moveQuestion = async (questionId: string, direction: "up" | "down") => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === questions.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const currentQuestion = questions[currentIndex];
    const targetQuestion = questions[targetIndex];

    try {
      await supabase
        .from("form_questions")
        .update({ step: targetQuestion.step })
        .eq("id", currentQuestion.id);

      await supabase
        .from("form_questions")
        .update({ step: currentQuestion.step })
        .eq("id", targetQuestion.id);

      toast({
        title: "Ordem atualizada!",
      });

      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao mover pergunta",
        description: error.message,
        variant: "destructive",
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
          onOpenChange={setShowAuthDialog}
        />
      </div>
    );
  }

  // User is authenticated but not admin - will redirect via useEffect
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verificando permissões...</p>
      </div>
    );
  }

  // Show loading while questions are being fetched
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
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button variant="outline" onClick={signOut}>
            Sair
          </Button>
        </div>

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
          {questions.map((question) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Passo {question.step}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveQuestion(question.id, "up")}
                      disabled={questions.findIndex(q => q.id === question.id) === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => moveQuestion(question.id, "down")}
                      disabled={questions.findIndex(q => q.id === question.id) === questions.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Pergunta</Label>
                  <Input
                    value={question.question}
                    onChange={(e) =>
                      updateQuestionLocal(question.id, { question: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Subtexto (opcional)</Label>
                  <Input
                    value={question.subtitle || ""}
                    onChange={(e) =>
                      updateQuestionLocal(question.id, { subtitle: e.target.value })
                    }
                    placeholder="Texto explicativo abaixo da pergunta"
                  />
                </div>

                <div>
                  <Label>Nome do Campo (banco de dados)</Label>
                  <Input
                    value={question.field_name}
                    onChange={(e) =>
                      updateQuestionLocal(question.id, { field_name: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Tipo de Resposta</Label>
                  <Select
                    value={question.input_type || 'text'}
                    onValueChange={(value: 'text' | 'select') => {
                      updateQuestionLocal(question.id, { input_type: value });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Resposta Escrita</SelectItem>
                      <SelectItem value="select">Múltipla Escolha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {question.input_type === 'select' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Opções de Escolha</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(question.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Opção
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(question.id, index, e.target.value)}
                            placeholder={`Opção ${index + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(question.id, index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {questions.length > 0 && (
          <div className="flex justify-end mt-6 sticky bottom-6">
            <Button 
              onClick={saveAllChanges}
              size="lg"
              disabled={!hasUnsavedChanges}
              className="shadow-lg"
            >
              {hasUnsavedChanges ? "Salvar Alterações" : "Tudo Salvo"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
