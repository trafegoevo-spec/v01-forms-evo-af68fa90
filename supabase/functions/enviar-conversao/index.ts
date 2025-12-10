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
    console.log("📥 [CONVERSAO] Dados recebidos:", JSON.stringify(rawData, null, 2));

    const data = typeof rawData === "object" && rawData !== null ? rawData : {};
    const flattened = flattenPayload(data);

    flattened.form_name ??= "default";
    flattened.origem ??= "formulario";
    flattened.timestamp ??= new Date().toISOString();

    const subdomain = flattened.form_name || "default";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Variáveis SUPABASE não configuradas");
      return jsonResponse({ success: false, error: "Configuração ausente" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrai campos fixos
    const nome = flattened.nome || flattened.name || null;
    const telefoneRaw = flattened.whatsapp || flattened.telefone || flattened.phone || "";
    const telefone = telefoneRaw ? parseInt(String(telefoneRaw).replace(/\D/g, ""), 10) : null;
    const email = flattened.email || null;
    const temEmail = email && String(email).trim() !== "";

    // === LÓGICA DE ROTAÇÃO DE WHATSAPP ===
    let whatsappRedirecionado: string | null = null;
    let vendedorNome: string | null = null;

    const { data: queueItems } = await supabase
      .from("whatsapp_queue")
      .select("*")
      .eq("subdomain", subdomain)
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (queueItems && queueItems.length > 0) {
      let { data: queueState } = await supabase
        .from("whatsapp_queue_state")
        .select("*")
        .eq("subdomain", subdomain)
        .single();

      if (!queueState) {
        const { data: newState } = await supabase
          .from("whatsapp_queue_state")
          .insert({ subdomain, current_position: 1 })
          .select()
          .single();
        queueState = newState;
      }

      const currentPosition = queueState?.current_position || 1;

      let selectedItem = queueItems.find(q => q.position >= currentPosition);
      if (!selectedItem) {
        selectedItem = queueItems[0];
      }

      if (selectedItem) {
        whatsappRedirecionado = selectedItem.phone_number;
        vendedorNome = selectedItem.display_name;
        console.log(`📱 WhatsApp selecionado: ${vendedorNome} (${whatsappRedirecionado})`);

        const currentIndex = queueItems.findIndex(q => q.id === selectedItem.id);
        const nextIndex = (currentIndex + 1) % queueItems.length;
        const nextPosition = queueItems[nextIndex].position;

        await supabase
          .from("whatsapp_queue_state")
          .update({ current_position: nextPosition, updated_at: new Date().toISOString() })
          .eq("subdomain", subdomain);
      }
    }

    if (whatsappRedirecionado) {
      flattened.whatsapp_redirecionado = whatsappRedirecionado;
      flattened.vendedor_nome = vendedorNome;
    }

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
        subdomain: subdomain,
      }])
      .select()
      .single();

    if (dbError) {
      console.error("❌ Erro ao salvar:", dbError);
    } else {
      console.log("✅ Salvo com ID:", insertedData?.id);
    }

    const { data: settings } = await supabase
      .from("app_settings")
      .select("webhook_url")
      .eq("subdomain", subdomain)
      .single();

    const webhookUrl = settings?.webhook_url || Deno.env.get("WEBHOOK_URL");

    if (!webhookUrl) {
      console.warn("❗ Nenhum webhook configurado");
      return jsonResponse({
        success: true,
        message: "Dados salvos — configure webhook",
        database_id: insertedData?.id,
        whatsapp_redirecionado: whatsappRedirecionado,
        vendedor_nome: vendedorNome,
      });
    }

    console.log("📤 Enviando para webhook:", webhookUrl);

    const webhookPayload = {
      ...flattened,
      data_cadastro: new Date().toISOString(),
      whatsapp_redirecionado: whatsappRedirecionado,
      vendedor_nome: vendedorNome,
    };

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(webhookPayload),
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("❌ Erro webhook:", text);
      return jsonResponse({
        success: true,
        warning: "Salvo, mas erro no webhook",
        database_id: insertedData?.id,
        whatsapp_redirecionado: whatsappRedirecionado,
        vendedor_nome: vendedorNome,
      });
    }

    console.log("✅ Webhook enviado com sucesso");

    return jsonResponse({
      success: true,
      message: "Dados salvos e enviados",
      database_id: insertedData?.id,
      whatsapp_redirecionado: whatsappRedirecionado,
      vendedor_nome: vendedorNome,
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
