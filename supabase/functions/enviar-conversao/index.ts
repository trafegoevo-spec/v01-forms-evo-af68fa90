import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();
    console.log("📥 Dados recebidos:", JSON.stringify(rawData, null, 2));

    // Garante que sempre será um objeto
    const data = typeof rawData === "object" && rawData !== null ? rawData : {};

    // Flatten automático para payloads aninhados
    const flattened = flattenPayload(data);

    // Valores padrão
    flattened.form_name ??= "default";
    flattened.origem ??= "formulario";
    flattened.timestamp ??= new Date().toISOString();

    // Cria cliente Supabase com service role para operações admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas");
      return jsonResponse({
        success: false,
        error: "Configuração do Supabase ausente",
      }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrai campos fixos (estrutura v0)
    const nome = flattened.nome || flattened.name || null;
    const telefoneRaw = flattened.whatsapp || flattened.telefone || flattened.phone || "";
    const telefone = telefoneRaw ? parseInt(String(telefoneRaw).replace(/\D/g, ""), 10) : null;
    const email = flattened.email || null;
    const temEmail = email && String(email).trim() !== "";
    const subdomain = flattened.form_name || "default";

    // Salva na tabela forma_respostas (estrutura v0)
    const { data: insertedData, error: dbError } = await supabase
      .from("forma_respostas")
      .insert([{
        entidade_id: null,
        pergunta_fixa_1: nome,
        pergunta_fixa_2: telefone,
        pergunta_fixa_3: temEmail,
        dados_json: flattened,
        versao_formulario: "v1",
        subdomain: subdomain,
      }])
      .select()
      .single();

    if (dbError) {
      console.error("❌ Erro ao salvar no banco:", dbError);
      // Continua mesmo com erro no banco para tentar enviar ao webhook
    } else {
      console.log("✅ Salvo no banco com ID:", insertedData?.id);
    }

    // Busca webhook_url das configurações
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("webhook_url")
      .eq("subdomain", subdomain)
      .single();

    if (settingsError) {
      console.warn("⚠️ Erro ao buscar configurações:", settingsError.message);
    }

    // Tenta usar webhook do app_settings, senão usa variável de ambiente
    const webhookUrl = settings?.webhook_url || Deno.env.get("WEBHOOK_URL");

    if (!webhookUrl) {
      console.warn("❗ Nenhum webhook configurado");
      return jsonResponse({
        success: true,
        message: "Dados salvos no banco — configure webhook_url nas configurações",
        database_id: insertedData?.id,
      });
    }

    // Payload para o webhook (igual ao v0)
    const webhookPayload = {
      ...flattened,
      data_cadastro: new Date().toISOString(),
    };

    console.log("📤 Enviando para webhook:", webhookUrl);

    // Envia para o webhook externo
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(10000),
    });

    const resultText = await webhookResponse.text();

    if (!webhookResponse.ok) {
      console.error("❌ Erro no webhook:", resultText);
      return jsonResponse({
        success: true,
        warning: "Dados salvos, mas erro ao enviar para webhook",
        database_id: insertedData?.id,
      });
    }

    console.log("✅ Webhook enviado com sucesso:", Object.keys(flattened).length, "campos");

    return jsonResponse({
      success: true,
      message: "Dados salvos e enviados com sucesso",
      database_id: insertedData?.id,
      sent_keys: Object.keys(flattened),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("❌ Erro na edge function:", errorMessage);
    return jsonResponse({
      success: false,
      error: errorMessage,
    }, 500);
  }
});

/* ------------------------------------------------------------- */
/* HELPERS                                                        */
/* ------------------------------------------------------------- */

function jsonResponse(obj: any, status: number = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Achata payloads aninhados (data, body, payload, formData)
function flattenPayload(obj: any) {
  const targets = ["data", "body", "payload", "formData"];
  let flat = { ...obj };

  for (const key of targets) {
    if (obj[key] && typeof obj[key] === "object") {
      flat = { ...flat, ...obj[key] };
    }
  }

  return flat;
}