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
  const { isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      loadQuestions();
    }
  }, [isAdmin]);

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

  const updateQuestion = async (id: string, updates: Partial<FormQuestion>) => {
    try {
      const { error } = await supabase
        .from("form_questions")
        .update(updates)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Pergunta atualizada!",
        description: "As alterações foram salvas.",
      });

      loadQuestions();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
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
    updateQuestion(questionId, { options: newOptions });
  };

  const removeOption = (questionId: string, index: number) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const newOptions = question.options.filter((_, i) => i !== index);
    updateQuestion(questionId, { options: newOptions });
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    const newOptions = question.options.map((opt, i) => i === optionIndex ? value : opt);
    updateQuestion(questionId, { options: newOptions });
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
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
                      updateQuestion(question.id, { question: e.target.value })
                    }
                    onBlur={() => loadQuestions()}
                  />
                </div>

                <div>
                  <Label>Subtexto (opcional)</Label>
                  <Input
                    value={question.subtitle || ""}
                    onChange={(e) =>
                      updateQuestion(question.id, { subtitle: e.target.value })
                    }
                    onBlur={() => loadQuestions()}
                    placeholder="Texto explicativo abaixo da pergunta"
                  />
                </div>

                <div>
                  <Label>Nome do Campo (banco de dados)</Label>
                  <Input
                    value={question.field_name}
                    onChange={(e) =>
                      updateQuestion(question.id, { field_name: e.target.value })
                    }
                    onBlur={() => loadQuestions()}
                  />
                </div>

                <div>
                  <Label>Tipo de Resposta</Label>
                  <Select
                    value={question.input_type || 'text'}
                    onValueChange={(value: 'text' | 'select') => {
                      updateQuestion(question.id, { input_type: value });
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
                            onBlur={() => loadQuestions()}
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
      </div>
    </div>
  );
};

export default Admin;
