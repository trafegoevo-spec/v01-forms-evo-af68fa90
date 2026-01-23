import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, CheckCircle, Star, Shield, Zap, Heart, Award, ThumbsUp, Clock, Target } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LogoUploader } from "@/components/LogoUploader";
import { CoverImageUploader } from "@/components/CoverImageUploader";

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

const GRADIENT_PRESETS = [
  { name: "Mist", from: "#f8fafc", via: "#f1f5f9", to: "#e2e8f0", direction: "to-b" },
  { name: "Cloud", from: "#ffffff", via: "#f8fafc", to: "#f1f5f9", direction: "to-br" },
  { name: "Pearl", from: "#fafafa", via: "#f5f5f5", to: "#ebebeb", direction: "to-b" },
  { name: "Frost", from: "#f0f9ff", via: "#e8f4fc", to: "#dbeafe", direction: "to-br" },
  { name: "Silk", from: "#fdf4ff", via: "#f5f3ff", to: "#ede9fe", direction: "to-br" },
  { name: "Blush", from: "#fff5f7", via: "#fef2f4", to: "#fce7ea", direction: "to-br" },
  { name: "Dawn", from: "#fffbeb", via: "#fef3c7", to: "#fde68a", direction: "to-b" },
  { name: "Sage", from: "#f0fdf4", via: "#ecfdf5", to: "#dcfce7", direction: "to-br" },
  { name: "Slate", from: "#f8fafc", via: "#e2e8f0", to: "#cbd5e1", direction: "to-b" },
  { name: "Azure", from: "#f0f9ff", via: "#dbeafe", to: "#bfdbfe", direction: "to-br" },
  { name: "Ivory", from: "#fffbf5", via: "#faf7f2", to: "#f5f0e8", direction: "to-b" },
  { name: "Snow", from: "#ffffff", via: "#fafafa", to: "#f4f4f5", direction: "to-b" },
];

interface AdminAppearanceProps {
  settings: AppSettings | null;
  settingsChanged: boolean;
  onUpdateSettings: (updates: Partial<AppSettings>) => void;
  onSaveSettings: () => void;
}

export const AdminAppearance = ({
  settings,
  settingsChanged,
  onUpdateSettings,
  onSaveSettings,
}: AdminAppearanceProps) => {
  if (!settings) return null;

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <LogoUploader />

      {/* Cover Page Settings */}
      <Card>
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
              onCheckedChange={(checked) => onUpdateSettings({ cover_enabled: checked })} 
            />
          </div>

          <div>
            <Label>Título da Capa</Label>
            <Input 
              value={settings.cover_title} 
              onChange={(e) => onUpdateSettings({ cover_title: e.target.value })} 
              placeholder="Bem-vindo"
              disabled={!settings.cover_enabled}
            />
          </div>

          <div>
            <Label>Subtítulo da Capa</Label>
            <Input 
              value={settings.cover_subtitle} 
              onChange={(e) => onUpdateSettings({ cover_subtitle: e.target.value })} 
              placeholder="Preencha o formulário e entre em contato conosco"
              disabled={!settings.cover_enabled}
            />
          </div>

          <div>
            <Label>Texto do Botão (CTA)</Label>
            <Input 
              value={settings.cover_cta_text} 
              onChange={(e) => onUpdateSettings({ cover_cta_text: e.target.value })} 
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
                    onUpdateSettings({ cover_topics: newTopics });
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
                    onUpdateSettings({ cover_topics: newTopics });
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
                      onUpdateSettings({ cover_topics: newTopics });
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
                  onUpdateSettings({ cover_topics: newTopics });
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
                onImageChange={(url) => onUpdateSettings({ cover_image_url: url })}
                disabled={!settings.cover_enabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Gradient Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Background Gradiente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Escolha um dos gradientes disponíveis para o fundo das páginas.
          </p>

          {/* Gradient Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {GRADIENT_PRESETS.map((preset) => {
              const isActive = 
                settings.bg_gradient_from === preset.from &&
                settings.bg_gradient_via === preset.via &&
                settings.bg_gradient_to === preset.to &&
                settings.bg_gradient_direction === preset.direction;
              
              return (
                <button
                  key={preset.name}
                  onClick={() => onUpdateSettings({
                    bg_gradient_from: preset.from,
                    bg_gradient_via: preset.via,
                    bg_gradient_to: preset.to,
                    bg_gradient_direction: preset.direction
                  })}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isActive 
                      ? 'border-primary ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{
                    background: `linear-gradient(to bottom right, ${preset.from}, ${preset.via}, ${preset.to})`
                  }}
                >
                  <span className={`text-xs font-medium ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {preset.name}
                  </span>
                  {isActive && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <div 
            className="h-24 rounded-lg border flex items-center justify-center"
            style={{
              background: `linear-gradient(to bottom right, ${settings.bg_gradient_from}, ${settings.bg_gradient_via}, ${settings.bg_gradient_to})`
            }}
          >
            <span className="text-sm text-muted-foreground">Prévia do Gradiente</span>
          </div>
        </CardContent>
      </Card>

      <Button onClick={onSaveSettings} disabled={!settingsChanged} className="w-full">
        {settingsChanged ? "Salvar Configurações de Aparência" : "Configurações Salvas"}
      </Button>
    </div>
  );
};
