import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subdomain, lead } = await req.json();
    console.log("🔔 [NOTIFICAR] subdomain:", subdomain);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: config } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("subdomain", subdomain)
      .single();

    if (!config) {
      console.log("⚠️ Nenhuma configuração de notificação para:", subdomain);
      return jsonResponse({ success: true, message: "Sem configuração de notificação" });
    }

    const nome = lead.nome || lead.name || "Sem nome";
    const telefone = lead.whatsapp || lead.telefone || lead.phone || "Não informado";
    const email = lead.email || "Não informado";

    const results: Record<string, string> = {};

    // === EMAIL SMTP ===
    if (config.email_enabled && config.smtp_host && config.smtp_user && config.email_recipients) {
      try {
        console.log("📧 Enviando email via SMTP...");
        const client = new SMTPClient({
          connection: {
            hostname: config.smtp_host,
            port: config.smtp_port || 587,
            tls: true,
            auth: {
              username: config.smtp_user,
              password: config.smtp_pass || "",
            },
          },
        });

        const leadDetails = Object.entries(lead)
          .filter(([k]) => !["form_name", "timestamp", "origem"].includes(k))
          .map(([k, v]) => `<tr><td style="padding:6px 12px;border:1px solid #e2e8f0;font-weight:600">${k}</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${v}</td></tr>`)
          .join("");

        const htmlBody = `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2 style="color:#1e40af">🔔 Novo Lead Recebido</h2>
            <p style="color:#475569">Formulário: <strong>${subdomain}</strong></p>
            <table style="width:100%;border-collapse:collapse;margin-top:16px">
              <tr style="background:#f1f5f9"><td style="padding:6px 12px;border:1px solid #e2e8f0;font-weight:600">Nome</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${nome}</td></tr>
              <tr><td style="padding:6px 12px;border:1px solid #e2e8f0;font-weight:600">Telefone</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${telefone}</td></tr>
              <tr style="background:#f1f5f9"><td style="padding:6px 12px;border:1px solid #e2e8f0;font-weight:600">Email</td><td style="padding:6px 12px;border:1px solid #e2e8f0">${email}</td></tr>
              ${leadDetails}
            </table>
            <p style="color:#94a3b8;font-size:12px;margin-top:24px">Enviado automaticamente pelo sistema de formulários.</p>
          </div>
        `;

        const recipients = config.email_recipients.split(",").map((e: string) => e.trim()).filter(Boolean);

        await client.send({
          from: config.smtp_from || config.smtp_user,
          to: recipients,
          subject: `🔔 Novo Lead: ${nome} - ${subdomain}`,
          content: `Novo lead: ${nome} | Tel: ${telefone} | Email: ${email}`,
          html: htmlBody,
        });

        await client.close();
        console.log("✅ Email enviado com sucesso");
        results.email = "sent";
      } catch (emailErr) {
        console.error("❌ Erro ao enviar email:", emailErr);
        results.email = "error";
      }
    }

    // === WHATSAPP EVOLUTION API ===
    if (config.whatsapp_notify_enabled && config.evolution_api_url && config.evolution_api_key && config.evolution_instance && config.whatsapp_notify_numbers) {
      try {
        console.log("📱 Enviando WhatsApp via Evolution API...");
        const numbers = config.whatsapp_notify_numbers.split(",").map((n: string) => n.trim()).filter(Boolean);

        const message = `🔔 *Novo Lead Recebido*\n\n` +
          `📋 *Formulário:* ${subdomain}\n` +
          `👤 *Nome:* ${nome}\n` +
          `📞 *Telefone:* ${telefone}\n` +
          `📧 *Email:* ${email}\n` +
          Object.entries(lead)
            .filter(([k]) => !["form_name", "timestamp", "origem", "nome", "name", "whatsapp", "telefone", "phone", "email"].includes(k))
            .map(([k, v]) => `• *${k}:* ${v}`)
            .join("\n");

        let allSent = true;
        for (const number of numbers) {
          const cleanNumber = number.replace(/\D/g, "");
          const resp = await fetch(
            `${config.evolution_api_url}/message/sendText/${config.evolution_instance}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: config.evolution_api_key,
              },
              body: JSON.stringify({
                number: cleanNumber,
                text: message,
              }),
              signal: AbortSignal.timeout(10000),
            }
          );

          if (!resp.ok) {
            console.error(`❌ Erro WhatsApp para ${cleanNumber}:`, await resp.text());
            allSent = false;
          } else {
            console.log(`✅ WhatsApp enviado para ${cleanNumber}`);
          }
        }
        results.whatsapp = allSent ? "sent" : "partial";
      } catch (waErr) {
        console.error("❌ Erro WhatsApp:", waErr);
        results.whatsapp = "error";
      }
    }

    // === SLACK WEBHOOK ===
    if (config.slack_enabled && config.slack_webhook_url) {
      try {
        console.log("💬 Enviando para Slack...");

        const extraFields = Object.entries(lead)
          .filter(([k]) => !["form_name", "timestamp", "origem", "nome", "name", "whatsapp", "telefone", "phone", "email"].includes(k))
          .map(([k, v]) => ({
            type: "mrkdwn",
            text: `*${k}:*\n${v}`,
          }));

        const slackPayload = {
          blocks: [
            {
              type: "header",
              text: { type: "plain_text", text: `🔔 Novo Lead - ${subdomain}`, emoji: true },
            },
            {
              type: "section",
              fields: [
                { type: "mrkdwn", text: `*👤 Nome:*\n${nome}` },
                { type: "mrkdwn", text: `*📞 Telefone:*\n${telefone}` },
                { type: "mrkdwn", text: `*📧 Email:*\n${email}` },
                ...extraFields.slice(0, 7),
              ],
            },
            {
              type: "context",
              elements: [
                { type: "mrkdwn", text: `📅 ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}` },
              ],
            },
          ],
        };

        const resp = await fetch(config.slack_webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackPayload),
          signal: AbortSignal.timeout(10000),
        });

        if (resp.ok) {
          console.log("✅ Slack enviado com sucesso");
          results.slack = "sent";
        } else {
          console.error("❌ Erro Slack:", await resp.text());
          results.slack = "error";
        }
      } catch (slackErr) {
        console.error("❌ Erro Slack:", slackErr);
        results.slack = "error";
      }
    }

    return jsonResponse({ success: true, results });
  } catch (err) {
    console.error("❌ Erro geral notificação:", err);
    return jsonResponse({ success: false, error: String(err) }, 500);
  }
});

function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
