import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { subdomain, formData, successPageKey } = await req.json();

    console.log(`[get-whatsapp-link] Building WhatsApp link for subdomain: ${subdomain}`);

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get WhatsApp settings from app_settings or success_pages
    let whatsappNumber = "";
    let whatsappMessage = "";
    let whatsappEnabled = false;

    if (successPageKey && successPageKey !== "default") {
      // Get from success_pages
      const { data: successPage, error } = await supabaseAdmin
        .from("success_pages")
        .select("whatsapp_enabled, whatsapp_number, whatsapp_message")
        .eq("subdomain", subdomain)
        .eq("page_key", successPageKey)
        .maybeSingle();

      if (!error && successPage) {
        whatsappEnabled = successPage.whatsapp_enabled;
        whatsappNumber = successPage.whatsapp_number;
        whatsappMessage = successPage.whatsapp_message;
      }
    }

    // Fallback to app_settings if no success page or no data
    if (!whatsappNumber) {
      const { data: settings, error } = await supabaseAdmin
        .from("app_settings")
        .select("whatsapp_enabled, whatsapp_number, whatsapp_message")
        .eq("subdomain", subdomain)
        .maybeSingle();

      if (!error && settings) {
        whatsappEnabled = settings.whatsapp_enabled;
        whatsappNumber = settings.whatsapp_number;
        whatsappMessage = settings.whatsapp_message;
      }
    }

    if (!whatsappEnabled) {
      return new Response(
        JSON.stringify({ enabled: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Interpolate message with form data
    let interpolatedMessage = whatsappMessage || "Olá! Preenchi o formulário.";
    if (formData && typeof formData === "object") {
      Object.entries(formData).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, "g");
        interpolatedMessage = interpolatedMessage.replace(regex, String(value || ""));
      });
    }

    // Clean phone number
    const cleanNumber = whatsappNumber.replace(/\D/g, "");

    console.log(`[get-whatsapp-link] Generated link for number: ${cleanNumber.substring(0, 4)}***`);

    return new Response(
      JSON.stringify({
        enabled: true,
        url: `https://wa.me/${cleanNumber}?text=${encodeURIComponent(interpolatedMessage)}`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[get-whatsapp-link] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
