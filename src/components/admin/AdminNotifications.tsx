import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, MessageSquare, Hash, Send, Loader2 } from "lucide-react";

interface NotificationSettings {
  id?: string;
  subdomain: string;
  email_enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_pass: string;
  smtp_from: string;
  email_recipients: string;
  whatsapp_notify_enabled: boolean;
  evolution_api_url: string;
  evolution_api_key: string;
  evolution_instance: string;
  whatsapp_notify_numbers: string;
  slack_enabled: boolean;
  slack_webhook_url: string;
}

const defaultSettings = (subdomain: string): NotificationSettings => ({
  subdomain,
  email_enabled: false,
  smtp_host: "",
  smtp_port: 587,
  smtp_user: "",
  smtp_pass: "",
  smtp_from: "",
  email_recipients: "",
  whatsapp_notify_enabled: false,
  evolution_api_url: "",
  evolution_api_key: "",
  evolution_instance: "",
  whatsapp_notify_numbers: "",
  slack_enabled: false,
  slack_webhook_url: "",
});

interface Props {
  formName: string;
}

export const AdminNotifications = ({ formName }: Props) => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings(formName));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, [formName]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("subdomain", formName)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSettings({
          id: data.id,
          subdomain: data.subdomain,
          email_enabled: data.email_enabled ?? false,
          smtp_host: data.smtp_host ?? "",
          smtp_port: data.smtp_port ?? 587,
          smtp_user: data.smtp_user ?? "",
          smtp_pass: data.smtp_pass ?? "",
          smtp_from: data.smtp_from ?? "",
          email_recipients: data.email_recipients ?? "",
          whatsapp_notify_enabled: data.whatsapp_notify_enabled ?? false,
          evolution_api_url: data.evolution_api_url ?? "",
          evolution_api_key: data.evolution_api_key ?? "",
          evolution_instance: data.evolution_instance ?? "",
          whatsapp_notify_numbers: data.whatsapp_notify_numbers ?? "",
          slack_enabled: data.slack_enabled ?? false,
          slack_webhook_url: data.slack_webhook_url ?? "",
        });
      }
    } catch (err: any) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const payload = {
        subdomain: formName,
        email_enabled: settings.email_enabled,
        smtp_host: settings.smtp_host || null,
        smtp_port: settings.smtp_port,
        smtp_user: settings.smtp_user || null,
        smtp_pass: settings.smtp_pass || null,
        smtp_from: settings.smtp_from || null,
        email_recipients: settings.email_recipients || null,
        whatsapp_notify_enabled: settings.whatsapp_notify_enabled,
        evolution_api_url: settings.evolution_api_url || null,
        evolution_api_key: settings.evolution_api_key || null,
        evolution_instance: settings.evolution_instance || null,
        whatsapp_notify_numbers: settings.whatsapp_notify_numbers || null,
        slack_enabled: settings.slack_enabled,
        slack_webhook_url: settings.slack_webhook_url || null,
      };

      if (settings.id) {
        const { error } = await supabase
          .from("notification_settings")
          .update(payload)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("notification_settings")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setSettings(prev => ({ ...prev, id: data.id }));
      }

      toast({ title: "Configurações de notificação salvas!" });
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sendTest = async (channel: string) => {
    setTesting(channel);
    try {
      // Save first
      await saveSettings();

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const resp = await fetch(
        `https://${projectId}.supabase.co/functions/v1/notificar-lead`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subdomain: formName,
            lead: {
              nome: "Lead Teste",
              telefone: "5531999999999",
              email: "teste@exemplo.com",
              curso: "Teste de Notificação",
              form_name: formName,
              timestamp: new Date().toISOString(),
            },
          }),
        }
      );

      const result = await resp.json();
      if (result.success) {
        const status = result.results?.[channel] || "not_configured";
        if (status === "sent") {
          toast({ title: `✅ Teste ${channel} enviado com sucesso!` });
        } else if (status === "error") {
          toast({ title: `❌ Erro no teste ${channel}`, variant: "destructive" });
        } else {
          toast({ title: `⚠️ Canal ${channel} não configurado ou desativado` });
        }
      } else {
        toast({ title: "Erro no teste", description: result.error, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro ao enviar teste", description: err.message, variant: "destructive" });
    } finally {
      setTesting(null);
    }
  };

  const update = (updates: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  if (loading) return <p>Carregando configurações de notificação...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações de Novos Leads</CardTitle>
        <CardDescription>
          Configure notificações automáticas por Email, WhatsApp e Slack a cada novo lead.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="space-y-2">
          {/* EMAIL SMTP */}
          <AccordionItem value="email">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                <span>Email (SMTP)</span>
                {settings.email_enabled && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ativo</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.email_enabled}
                  onCheckedChange={v => update({ email_enabled: v })}
                />
                <Label>Ativar notificações por email</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Host SMTP</Label>
                  <Input value={settings.smtp_host} onChange={e => update({ smtp_host: e.target.value })} placeholder="smtp.gmail.com" />
                </div>
                <div>
                  <Label>Porta</Label>
                  <Input type="number" value={settings.smtp_port} onChange={e => update({ smtp_port: parseInt(e.target.value) || 587 })} />
                </div>
                <div>
                  <Label>Usuário SMTP</Label>
                  <Input value={settings.smtp_user} onChange={e => update({ smtp_user: e.target.value })} placeholder="seu@email.com" />
                </div>
                <div>
                  <Label>Senha SMTP</Label>
                  <Input type="password" value={settings.smtp_pass} onChange={e => update({ smtp_pass: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="col-span-2">
                  <Label>Email remetente (From)</Label>
                  <Input value={settings.smtp_from} onChange={e => update({ smtp_from: e.target.value })} placeholder="noreply@suaempresa.com" />
                </div>
                <div className="col-span-2">
                  <Label>Destinatários (separados por vírgula)</Label>
                  <Input value={settings.email_recipients} onChange={e => update({ email_recipients: e.target.value })} placeholder="admin@empresa.com, vendas@empresa.com" />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => sendTest("email")} disabled={!!testing}>
                {testing === "email" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar teste
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* WHATSAPP EVOLUTION API */}
          <AccordionItem value="whatsapp">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span>WhatsApp (Evolution API)</span>
                {settings.whatsapp_notify_enabled && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ativo</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.whatsapp_notify_enabled}
                  onCheckedChange={v => update({ whatsapp_notify_enabled: v })}
                />
                <Label>Ativar notificações por WhatsApp</Label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>URL da Evolution API</Label>
                  <Input value={settings.evolution_api_url} onChange={e => update({ evolution_api_url: e.target.value })} placeholder="https://sua-evolution-api.com" />
                </div>
                <div>
                  <Label>API Key</Label>
                  <Input type="password" value={settings.evolution_api_key} onChange={e => update({ evolution_api_key: e.target.value })} placeholder="••••••••" />
                </div>
                <div>
                  <Label>Nome da Instância</Label>
                  <Input value={settings.evolution_instance} onChange={e => update({ evolution_instance: e.target.value })} placeholder="minha-instancia" />
                </div>
                <div className="col-span-2">
                  <Label>Números de destino (separados por vírgula)</Label>
                  <Input value={settings.whatsapp_notify_numbers} onChange={e => update({ whatsapp_notify_numbers: e.target.value })} placeholder="5531999999999, 5531988888888" />
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => sendTest("whatsapp")} disabled={!!testing}>
                {testing === "whatsapp" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar teste
              </Button>
            </AccordionContent>
          </AccordionItem>

          {/* SLACK */}
          <AccordionItem value="slack">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                <span>Slack</span>
                {settings.slack_enabled && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Ativo</span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings.slack_enabled}
                  onCheckedChange={v => update({ slack_enabled: v })}
                />
                <Label>Ativar notificações por Slack</Label>
              </div>
              <div>
                <Label>Webhook URL do Slack</Label>
                <Input value={settings.slack_webhook_url} onChange={e => update({ slack_webhook_url: e.target.value })} placeholder="https://hooks.slack.com/services/T.../B.../..." />
                <p className="text-xs text-muted-foreground mt-1">
                  Crie um Incoming Webhook em <a href="https://api.slack.com/apps" target="_blank" rel="noopener" className="underline">api.slack.com/apps</a> → Incoming Webhooks
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => sendTest("slack")} disabled={!!testing}>
                {testing === "slack" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Enviar teste
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-6 flex justify-end">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
