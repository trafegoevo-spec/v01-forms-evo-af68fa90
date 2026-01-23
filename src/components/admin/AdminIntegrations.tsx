import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from "lucide-react";

interface AdminIntegrationsProps {
  formName: string;
  gtmId: string;
}

export const AdminIntegrations = ({ formName, gtmId }: AdminIntegrationsProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Configuration Info */}
      <Card>
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
              {gtmId || "Não configurado"}
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

      {/* CRM Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Integração CRM
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure o envio de leads para um CRM externo via webhook.
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/admin/crm")} className="w-full">
            Configurar Integração CRM
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
