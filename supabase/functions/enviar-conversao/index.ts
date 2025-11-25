import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Aceita QUALQUER estrutura enviada
serve(async (req) => {
  // Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawData = await req.json();

    console.log("📥 Dados recebidos no webhook:", rawData);

    // ============================
    //   SANAR PROBLEMA PRINCIPAL
    // ============================

    // 1) Se houver `form_data`, extrair campos internos
    const formData = rawData.form_data ?? rawData.data ?? rawData.body ?? rawData.payload ?? {};

    // 2) Nome da aba dinâmico
    const formName = rawData.form_name || rawData.formName || formData.form_name || "SemNome";

    // 3) Monta payload final compatível com Apps Script
    const payload = {
      ...rawData, // Campos de nível raiz
      ...formData, // Campos internos do formulário
      form_name: formName,
      timestamp: new Date().toISOString(),
      origem: rawData.origem ?? "site",
    };

    console.log("📦 Payload final enviado à planilha:", payload);

    // ============================
    //       ENVIO À PLANILHA
    // ============================

    const webhookUrl = Deno.env.get("WEBHOOK_URL");

    if (!webhookUrl) {
      console.warn("❗ WEBHOOK_URL não configurada no Supabase.");
      return new Response(
        JSON.stringify({
          success: true,
          warning: "WEBHOOK_URL não configurada. Dados apenas recebidos.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const text = await response.text();
    console.log("📤 Resposta da planilha:", text);

    if (!response.ok) {
      throw new Error("Webhook falhou: " + text);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Dados enviados para a planilha com sucesso!",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("🔥 ERRO no envio:", err.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
