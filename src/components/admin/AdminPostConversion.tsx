import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";

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

interface AdminPostConversionProps {
  settings: AppSettings | null;
  settingsChanged: boolean;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onSaveSettings: () => void;
}

export const AdminPostConversion = ({
  settings,
  settingsChanged,
  onUpdateSettings,
  onSaveSettings,
}: AdminPostConversionProps) => {
  if (!settings) return null;

  return (
    <div className="space-y-6">
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
              onChange={e => onUpdateSettings({ success_title: e.target.value })} 
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
              onChange={e => onUpdateSettings({ success_subtitle: e.target.value })} 
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
              onChange={e => onUpdateSettings({ success_description: e.target.value })}
              placeholder="Em breve entraremos em contato para dar continuidade ao seu atendimento."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Texto explicativo ou próximos passos para o usuário
            </p>
          </div>
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
            <Switch id="whatsapp-enabled" checked={settings.whatsapp_enabled} onCheckedChange={checked => onUpdateSettings({
              whatsapp_enabled: checked
            })} />
          </div>

          <div>
            <Label>Número do WhatsApp</Label>
            <Input value={settings.whatsapp_number} onChange={e => onUpdateSettings({
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
              onChange={e => onUpdateSettings({ whatsapp_message: e.target.value })}
              placeholder="Olá! Sou {nome}, meu telefone é {telefone}. Tenho interesse em {curso}."
              disabled={!settings.whatsapp_enabled}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={2}
            />
            <p className="text-sm text-muted-foreground mt-1">
              💡 Use {"{campo}"} para incluir dados do formulário. Ex: "Sou {"{nome}"}, meu WhatsApp é {"{telefone}"}"
            </p>
            <p className="text-sm text-amber-600 mt-2 bg-amber-50 p-2 rounded">
              ⚠️ Esta mensagem será usada tanto no botão da página de obrigado quanto na rotação de WhatsApp.
            </p>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <div className="space-y-0.5">
              <Label htmlFor="whatsapp-on-submit">Abrir WhatsApp automaticamente ao finalizar</Label>
              <p className="text-sm text-muted-foreground">
                O WhatsApp será aberto assim que o usuário clicar em "Finalizar"
              </p>
            </div>
            <Switch 
              id="whatsapp-on-submit"
              checked={settings.whatsapp_on_submit || false} 
              onCheckedChange={checked => onUpdateSettings({ whatsapp_on_submit: checked })}
              disabled={!settings.whatsapp_enabled}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={onSaveSettings} disabled={!settingsChanged} className="w-full">
        {settingsChanged ? "Salvar Configurações" : "Configurações Salvas"}
      </Button>
    </div>
  );
};
