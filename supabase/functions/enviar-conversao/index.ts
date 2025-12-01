import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Aceita QUALQUER payload sem validação restritiva
serve(async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();

    // 🔥 Garante que SEMPRE será um objeto
    const data = typeof rawData === "object" && rawData !== null ? rawData : {};

    // 🔥 Flatten automático: se vier dentro de `data`, `payload`, `body`, etc.
    const flattened = flattenPayload(data);

    // 🔥 Garante form_name e origem
    flattened.form_name ??= "default";
    flattened.origem ??= "formulario";

    // 🔥 Timestamp automático
    flattened.timestamp ??= new Date().toISOString();

    // Buscar webhook_url das configurações do admin
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let webhookUrl = Deno.env.get("WEBHOOK_URL");

    // Tentar buscar webhook_url personalizado do admin
    try {
      const { data: settings, error } = await supabase
        .from("app_settings")
        .select("webhook_url")
        .single();

      if (!error && settings?.webhook_url) {
        webhookUrl = settings.webhook_url;
        console.log("📝 Usando webhook_url personalizado do admin");
      }
    } catch (err) {
      console.warn("⚠️ Não foi possível buscar configurações do admin, usando padrão");
    }

    if (!webhookUrl) {
      console.warn("❗ Nenhum webhook configurado");
      return jsonResponse({
        success: true,
        message: "Dados recebidos — configure WEBHOOK_URL no admin",
      });
    }

    // Envio para Apps Script da planilha
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(flattened),
      signal: AbortSignal.timeout(10000),
    });

    const resultText = await webhookResponse.text();

    if (!webhookResponse.ok) {
      console.error("Erro no webhook:", resultText);
      return jsonResponse({
        success: true,
        warning: "Erro ao enviar para planilha",
      });
    }

    console.log("Enviado com sucesso:", Object.keys(flattened).length, "campos");

    return jsonResponse({
      success: true,
      message: "Dados enviados com sucesso",
      sent_keys: Object.keys(flattened),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro na edge function:", errorMessage);
    return jsonResponse(
      {
        success: false,
        error: errorMessage,
      },
      500,
    );
  }
});

/* ------------------------------------------------------------- */
/* HELPERS                                                      */
/* ------------------------------------------------------------- */

// Resposta padrão
function jsonResponse(obj: any, status: number = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Achata payloads aninhados
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
