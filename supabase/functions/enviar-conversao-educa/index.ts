import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const data = typeof rawData === "object" && rawData !== null ? rawData : {};

    const webhookUrl = Deno.env.get("EDUCA_URL");

    if (!webhookUrl) {
      console.error("❌ EDUCA_URL não configurada");
      return new Response(
        JSON.stringify({ success: false, error: "EDUCA_URL ausente" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = {
      ...data,
      origem: "educa",
      form_name: data.form_name || "educa",
      timestamp: data.timestamp || new Date().toISOString(),
    };

    console.log("📤 Enviando para Educa:", Object.keys(payload).length, "campos");

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    const text = await resp.text();

    if (!resp.ok) {
      console.error("❌ Erro Apps Script:", text);
      return new Response(
        JSON.stringify({ success: false, error: "Apps Script retornou erro" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Enviado com sucesso para Educa");

    return new Response(
      JSON.stringify({ success: true, message: "Dados enviados para planilha Educa" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("❌ Erro geral:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
