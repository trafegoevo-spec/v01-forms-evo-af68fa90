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
    const url = new URL(req.url);
    const subdomain = url.searchParams.get("subdomain") || "default";

    console.log(`[get-public-settings] Fetching public settings for subdomain: ${subdomain}`);

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch app_settings - only return PUBLIC/SAFE fields
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("app_settings")
      .select(`
        subdomain,
        cover_enabled,
        cover_title,
        cover_subtitle,
        cover_cta_text,
        cover_image_url,
        cover_topics,
        bg_gradient_from,
        bg_gradient_via,
        bg_gradient_to,
        bg_gradient_direction,
        success_title,
        success_subtitle,
        success_description,
        whatsapp_enabled,
        whatsapp_on_submit
      `)
      .eq("subdomain", subdomain)
      .maybeSingle();

    if (settingsError) {
      console.error("[get-public-settings] Error fetching settings:", settingsError);
      throw settingsError;
    }

    // Fetch form questions (already public, but consolidating here)
    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("form_questions")
      .select("*")
      .eq("subdomain", subdomain)
      .order("step", { ascending: true });

    if (questionsError) {
      console.error("[get-public-settings] Error fetching questions:", questionsError);
      throw questionsError;
    }

    // Fetch success pages - only safe fields
    const { data: successPages, error: successPagesError } = await supabaseAdmin
      .from("success_pages")
      .select(`
        id,
        page_key,
        title,
        subtitle,
        description,
        whatsapp_enabled
      `)
      .eq("subdomain", subdomain);

    if (successPagesError) {
      console.error("[get-public-settings] Error fetching success pages:", successPagesError);
      throw successPagesError;
    }

    console.log(`[get-public-settings] Successfully fetched: settings=${!!settings}, questions=${questions?.length || 0}, successPages=${successPages?.length || 0}`);

    return new Response(
      JSON.stringify({
        settings,
        questions,
        successPages,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[get-public-settings] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
