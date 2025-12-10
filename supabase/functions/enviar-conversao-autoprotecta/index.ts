import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json().catch(() => ({}));
    console.log("📥 [AUTOPROTECTA] Dados recebidos:", JSON.stringify(rawData, null, 2));

    const data = typeof rawData === "object" && rawData !== null ? rawData : {};
    const flattened = flattenPayload(data);

    flattened.form_name ??= "autoprotecta";
    flattened.origem ??= "formulario";
    flattened.timestamp ??= new Date().toISOString();

    // Cria cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variáveis SUPABASE não configuradas");
      return jsonResponse({ success: false, error: "Configuração ausente" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrai campos fixos (estrutura v0)
    const nome = flattened.nome || flattened.name || null;
    const telefoneRaw = flattened.whatsapp || flattened.telefone || flattened.phone || "";
    const telefone = telefoneRaw ? parseInt(String(telefoneRaw).replace(/\D/g, ""), 10) : null;
    const email = flattened.email || null;
    const temEmail = email && String(email).trim() !== "";

    // Salva na tabela forma_respostas
    const { data: insertedData, error: dbError } = await supabase
      .from("forma_respostas")
      .insert([{
        entidade_id: null,
        pergunta_fixa_1: nome,
        pergunta_fixa_2: telefone,
        pergunta_fixa_3: temEmail,
        dados_json: flattened,
        versao_formulario: "v1",
        subdomain: "autoprotecta",
      }])
      .select()
      .single();

    if (dbError) {
      console.error("❌ Erro ao salvar:", dbError);
    } else {
      console.log("✅ Salvo com ID:", insertedData?.id);
    }

    // Busca webhook das configurações ou usa variável de ambiente
    const { data: settings } = await supabase
      .from("app_settings")
      .select("webhook_url")
      .eq("subdomain", "autoprotecta")
      .single();

    const webhookUrl = settings?.webhook_url || Deno.env.get("AUTOPROTECTA_URL");

    if (!webhookUrl) {
      console.warn("❗ Nenhum webhook configurado");
      return jsonResponse({
        success: true,
        message: "Dados salvos — configure webhook",
        database_id: insertedData?.id,
      });
    }

    console.log("📤 Enviando para webhook:", webhookUrl);

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...flattened, data_cadastro: new Date().toISOString() }),
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("❌ Erro webhook:", text);
      return jsonResponse({
        success: true,
        warning: "Salvo, mas erro no webhook",
        database_id: insertedData?.id,
      });
    }

    console.log("✅ Webhook enviado com sucesso");

    return jsonResponse({
      success: true,
      message: "Dados salvos e enviados",
      database_id: insertedData?.id,
    });

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("❌ Erro:", errorMessage);
    return jsonResponse({ success: false, error: errorMessage }, 500);
  }
});

function jsonResponse(obj: any, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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