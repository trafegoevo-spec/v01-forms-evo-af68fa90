import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data = await req.json();
    
    console.log("Conversão recebida:", data);

    // Webhook URL da planilha (Zapier, Make, Google Sheets, etc.)
    const webhookUrl = Deno.env.get('WEBHOOK_URL');
    
    if (!webhookUrl) {
      console.warn("WEBHOOK_URL não configurada. Configure em Cloud > Secrets");
      
      // Retorna sucesso mesmo sem webhook para não bloquear o fluxo
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Dados recebidos. Configure WEBHOOK_URL para enviar para planilha.",
          data 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Prepara payload com todos os campos do formulário dinâmico
    const payload = {
      ...data, // Envia todos os campos recebidos
      data_cadastro: data.timestamp || new Date().toISOString(),
      origem: 'Site EAD'
    };

    // Remove timestamp duplicado se existir
    delete payload.timestamp;

    console.log("Enviando para webhook:", payload);

    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!webhookResponse.ok) {
      console.error("Erro ao enviar para webhook:", await webhookResponse.text());
      throw new Error("Falha ao enviar para planilha");
    }

    console.log("Conversão enviada para planilha com sucesso!");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Dados enviados para planilha com sucesso!" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Erro na função enviar-conversao:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
