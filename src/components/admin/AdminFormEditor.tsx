import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowUp, ArrowDown, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

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

interface AdminFormEditorProps {
  questions: FormQuestion[];
  hasUnsavedChanges: boolean;
  onUpdateQuestion: (id: string, updates: Partial<FormQuestion>) => void;
  onDeleteQuestion: (id: string) => void;
  onAddQuestion: () => void;
  onMoveQuestion: (id: string, direction: "up" | "down") => void;
  onAddOption: (questionId: string) => void;
  onRemoveOption: (questionId: string, index: number) => void;
  onUpdateOption: (questionId: string, optionIndex: number, value: string) => void;
  onAddConditionalRule: (questionId: string) => void;
  onUpdateConditionalRule: (questionId: string, index: number, updates: Partial<ConditionalRule>) => void;
  onRemoveConditionalRule: (questionId: string, index: number) => void;
  onSaveAllChanges: () => void;
}

export const AdminFormEditor = ({
  questions,
  hasUnsavedChanges,
  onUpdateQuestion,
  onDeleteQuestion,
  onAddQuestion,
  onMoveQuestion,
  onAddOption,
  onRemoveOption,
  onUpdateOption,
  onAddConditionalRule,
  onUpdateConditionalRule,
  onRemoveConditionalRule,
  onSaveAllChanges,
}: AdminFormEditorProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Editor de Perguntas</h2>
        <Button onClick={onAddQuestion}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Pergunta
        </Button>
      </div>

      {questions.map((question) => (
        <Card key={question.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">Passo</span>
                <Input
                  type="number"
                  min="1"
                  value={question.step}
                  onChange={(e) => onUpdateQuestion(question.id, { step: parseInt(e.target.value) || 1 })}
                  className="w-16 h-8"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onMoveQuestion(question.id, "up")} disabled={questions.findIndex(q => q.id === question.id) === 0}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onMoveQuestion(question.id, "down")} disabled={questions.findIndex(q => q.id === question.id) === questions.length - 1}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => onDeleteQuestion(question.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pergunta</Label>
              <Input value={question.question} onChange={e => onUpdateQuestion(question.id, { question: e.target.value })} />
              <p className="text-xs text-muted-foreground mt-1">
                💡 Use {"{campo}"} para incluir dados anteriores. Ex: "Olá {"{nome}"}, qual é seu WhatsApp?"
              </p>
            </div>

            <div>
              <Label>Subtexto (opcional)</Label>
              <Input value={question.subtitle || ""} onChange={e => onUpdateQuestion(question.id, { subtitle: e.target.value })} placeholder="Texto explicativo abaixo da pergunta" />
            </div>

            <div>
              <Label>Nome do Campo (banco de dados)</Label>
              <Input value={question.field_name} onChange={e => onUpdateQuestion(question.id, { field_name: e.target.value })} />
            </div>

            {question.input_type !== 'select' && question.input_type !== 'password' && question.input_type !== 'buttons' && (
              <div>
                <Label>Texto do Campo de Resposta</Label>
                <Input value={question.input_placeholder || ""} onChange={e => onUpdateQuestion(question.id, { input_placeholder: e.target.value })} placeholder="Ex: Digite qual é o seu nome completo?" />
              </div>
            )}

            {question.input_type !== 'select' && question.input_type !== 'buttons' && (
              <div>
                <Label>Limite de Caracteres (opcional)</Label>
                <Input type="number" value={question.max_length || ""} onChange={e => onUpdateQuestion(question.id, { max_length: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="Deixe vazio para sem limite" min="1" />
              </div>
            )}

            <div>
              <Label>Tipo de Resposta</Label>
              <Select value={question.input_type || 'text'} onValueChange={(value: 'text' | 'select' | 'password' | 'buttons') => {
                onUpdateQuestion(question.id, { input_type: value });
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
                onCheckedChange={(checked) => onUpdateQuestion(question.id, { required: checked })} 
              />
            </div>

            {(question.input_type === 'select' || question.input_type === 'buttons') && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Opções de Escolha</Label>
                  <Button variant="outline" size="sm" onClick={() => onAddOption(question.id)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Opção
                  </Button>
                </div>
                <div className="space-y-2">
                  {question.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={option} onChange={e => onUpdateOption(question.id, index, e.target.value)} placeholder={`Opção ${index + 1}`} />
                      <Button variant="ghost" size="icon" onClick={() => onRemoveOption(question.id, index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lógica Condicional */}
            {(question.input_type === 'select' || question.input_type === 'buttons') && question.options.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <Label>Lógica Condicional</Label>
                    <p className="text-sm text-muted-foreground">
                      Configure ações baseadas na resposta do usuário
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => onAddConditionalRule(question.id)}>
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
                        onValueChange={(value) => onUpdateConditionalRule(question.id, condIndex, { value })}
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
                          onUpdateConditionalRule(question.id, condIndex, { action: value })
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
                          onChange={(e) => onUpdateConditionalRule(question.id, condIndex, { 
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
                          onValueChange={(value) => onUpdateConditionalRule(question.id, condIndex, { target_page: value })}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Página Padrão</SelectItem>
                            <SelectItem value="disqualified">Página de Desqualificado</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onRemoveConditionalRule(question.id, condIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Toggle para não enviar dados */}
                    {condition.action === "success_page" && (
                      <div className="flex items-center gap-2 pt-2 border-t mt-2">
                        <Switch
                          id={`skip-submit-${question.id}-${condIndex}`}
                          checked={condition.skip_submit || false}
                          onCheckedChange={(checked) => 
                            onUpdateConditionalRule(question.id, condIndex, { skip_submit: checked })
                          }
                        />
                        <Label 
                          htmlFor={`skip-submit-${question.id}-${condIndex}`}
                          className="text-sm cursor-pointer"
                        >
                          Não enviar dados do lead
                        </Label>
                        {condition.skip_submit && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            ⚠️ Dados não serão salvos
                          </span>
                        )}
                      </div>
                    )}
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
        </Card>
      ))}

      {questions.length > 0 && (
        <div className="flex justify-end sticky bottom-6">
          <Button onClick={onSaveAllChanges} size="lg" disabled={!hasUnsavedChanges} className="shadow-lg">
            {hasUnsavedChanges ? "Salvar Alterações" : "Tudo Salvo"}
          </Button>
        </div>
      )}
    </div>
  );
};
