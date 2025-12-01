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

    const webhookUrl = Deno.env.get("WEBHOOK_URL");

    if (!webhookUrl) {
      console.warn("❗ Nenhum webhook configurado");
      return jsonResponse({
        success: true,
        message: "Dados recebidos — configure WEBHOOK_URL nas secrets",
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
