import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Link, Send } from "lucide-react";
import { AuthDialog } from "@/components/AuthDialog";
import { Switch } from "@/components/ui/switch";

interface CrmIntegration {
  id: string;
  subdomain: string;
  crm_name: string;
  webhook_url: string;
  bearer_token: string | null;
  manager_id: string | null;
  slug: string | null;
  is_active: boolean;
  include_dynamic_fields: boolean;
}

const CrmIntegrationPage = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [crmIntegration, setCrmIntegration] = useState<CrmIntegration | null>(null);
  const [crmChanged, setCrmChanged] = useState(false);
  const [testingCrm, setTestingCrm] = useState(false);
  const [loading, setLoading] = useState(true);
  const formName = import.meta.env.VITE_FORM_NAME || "default";

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setShowAuthDialog(true);
      } else if (user && !isAdmin) {
        navigate("/");
      } else if (user && isAdmin) {
        setShowAuthDialog(false);
        loadCrmIntegration();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const loadCrmIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from("crm_integrations")
        .select("*")
        .eq("subdomain", formName)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCrmIntegration(data as CrmIntegration);
      } else {
        setCrmIntegration({
          id: "",
          subdomain: formName,
          crm_name: "CRM",
          webhook_url: "",
          bearer_token: null,
          manager_id: null,
          slug: null,
          is_active: false,
          include_dynamic_fields: true
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar integração CRM:", error);
      toast({
        title: "Erro ao carregar configuração",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCrmIntegration = (updates: Partial<CrmIntegration>) => {
    if (!crmIntegration) return;
    setCrmIntegration({ ...crmIntegration, ...updates });
    setCrmChanged(true);
  };

  const saveCrmIntegration = async () => {
    if (!crmIntegration) return;
    
    try {
      if (crmIntegration.id) {
        const { error } = await supabase
          .from("crm_integrations")
          .update({
            crm_name: crmIntegration.crm_name,
            webhook_url: crmIntegration.webhook_url,
            bearer_token: crmIntegration.bearer_token,
            manager_id: crmIntegration.manager_id,
            slug: crmIntegration.slug,
            is_active: crmIntegration.is_active,
            include_dynamic_fields: crmIntegration.include_dynamic_fields
          })
          .eq("id", crmIntegration.id);
        
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("crm_integrations")
          .insert({
            subdomain: formName,
            crm_name: crmIntegration.crm_name,
            webhook_url: crmIntegration.webhook_url,
            bearer_token: crmIntegration.bearer_token,
            manager_id: crmIntegration.manager_id,
            slug: crmIntegration.slug,
            is_active: crmIntegration.is_active,
            include_dynamic_fields: crmIntegration.include_dynamic_fields
          })
          .select()
          .single();
        
        if (error) throw error;
        setCrmIntegration(data as CrmIntegration);
      }
      
      toast({ title: "Integração CRM salva!" });
      setCrmChanged(false);
    } catch (error: any) {
      toast({
        title: "Erro ao salvar integração CRM",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testCrmWebhook = async () => {
    if (!crmIntegration?.webhook_url) {
      toast({
        title: "Configure a URL do webhook",
        variant: "destructive"
      });
      return;
    }

    setTestingCrm(true);
    try {
      const testPayload = {
        nome: "Lead de Teste",
        telefone: "31999999999",
        email: "teste@exemplo.com",
        manager_id: crmIntegration.manager_id || "",
        slug: crmIntegration.slug || "",
        _teste: true,
        timestamp: new Date().toISOString()
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };

      if (crmIntegration.bearer_token) {
        headers["Authorization"] = `Bearer ${crmIntegration.bearer_token}`;
      }

      const response = await fetch(crmIntegration.webhook_url, {
        method: "POST",
        headers,
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        toast({
          title: "Teste enviado com sucesso!",
          description: "O webhook recebeu os dados de teste."
        });
      } else {
        toast({
          title: "Erro no webhook",
          description: `Status: ${response.status}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao testar webhook",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTestingCrm(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthDialog open={showAuthDialog} onOpenChange={setShowAuthDialog} />
      
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Integração CRM</h1>
            <p className="text-muted-foreground">
              Configure o envio de leads para seu CRM via webhook
            </p>
          </div>
        </div>

        {crmIntegration && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Webhook Externo (CRM)
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Envie os leads para um CRM externo via webhook. Funciona em paralelo com o webhook do Google Sheets.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="crm-active">Integração Ativa</Label>
                  <p className="text-sm text-muted-foreground">
                    Ative para enviar leads para o CRM
                  </p>
                </div>
                <Switch
                  id="crm-active"
                  checked={crmIntegration.is_active}
                  onCheckedChange={(checked) => updateCrmIntegration({ is_active: checked })}
                />
              </div>

              <div>
                <Label>Nome do CRM</Label>
                <Input
                  value={crmIntegration.crm_name}
                  onChange={(e) => updateCrmIntegration({ crm_name: e.target.value })}
                  placeholder="Ex: Kommo, Pipedrive, HubSpot"
                />
              </div>

              <div>
                <Label>URL do Webhook *</Label>
                <Input
                  value={crmIntegration.webhook_url}
                  onChange={(e) => updateCrmIntegration({ webhook_url: e.target.value })}
                  placeholder="https://seu-crm.com/webhook/leads"
                  type="url"
                />
              </div>

              <div>
                <Label>Bearer Token (Autenticação)</Label>
                <Input
                  value={crmIntegration.bearer_token || ""}
                  onChange={(e) => updateCrmIntegration({ bearer_token: e.target.value || null })}
                  placeholder="seu_token_secreto"
                  type="password"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Será enviado no header Authorization: Bearer TOKEN
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Manager ID</Label>
                  <Input
                    value={crmIntegration.manager_id || ""}
                    onChange={(e) => updateCrmIntegration({ manager_id: e.target.value || null })}
                    placeholder="ID do gerente no CRM"
                  />
                </div>
                <div>
                  <Label>Slug (Campanha)</Label>
                  <Input
                    value={crmIntegration.slug || ""}
                    onChange={(e) => updateCrmIntegration({ slug: e.target.value || null })}
                    placeholder="identificador-campanha"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Incluir campos dinâmicos</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar todos os campos preenchidos no formulário
                  </p>
                </div>
                <Switch
                  checked={crmIntegration.include_dynamic_fields}
                  onCheckedChange={(checked) => updateCrmIntegration({ include_dynamic_fields: checked })}
                />
              </div>

              <div className="bg-muted p-3 rounded-lg">
                <p className="text-xs font-medium mb-2">Payload de exemplo:</p>
                <pre className="text-xs overflow-x-auto">
{`{
  "nome": "João Silva",
  "telefone": "31999999999",
  "email": "joao@email.com",
  "manager_id": "${crmIntegration.manager_id || ""}",
  "slug": "${crmIntegration.slug || ""}",
  ${crmIntegration.include_dynamic_fields ? '"curso": "Graduação",\n  "utm_source": "google",' : ''}
  "data_cadastro": "2026-01-14T12:00:00.000Z"
}`}
                </pre>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={testCrmWebhook}
                  variant="outline"
                  disabled={testingCrm || !crmIntegration.webhook_url}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {testingCrm ? "Testando..." : "Testar Webhook"}
                </Button>
                <Button
                  onClick={saveCrmIntegration}
                  disabled={!crmChanged}
                  className="flex-1"
                >
                  {crmChanged ? "Salvar Integração CRM" : "Integração Salva"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CrmIntegrationPage;
