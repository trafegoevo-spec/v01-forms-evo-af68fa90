import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body (from sendBeacon or regular POST)
    let body;
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("text/plain") || contentType === "") {
      // sendBeacon sends as text/plain
      const text = await req.text();
      body = JSON.parse(text);
    } else {
      body = await req.json();
    }

    const { sessionId, subdomain, stepReached, partialData } = body;

    if (!sessionId) {
      console.log("Missing sessionId in request");
      return new Response(
        JSON.stringify({ error: "sessionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Saving partial data for session ${sessionId}, subdomain ${subdomain}, step ${stepReached}`);

    // Update the existing analytics record with partial data
    const { error } = await supabase
      .from("form_analytics")
      .update({
        step_reached: stepReached || 1,
        partial_data: partialData || {},
        updated_at: new Date().toISOString()
      })
      .eq("session_id", sessionId)
      .eq("subdomain", subdomain || "default");

    if (error) {
      console.error("Error updating analytics:", error);
      // If update fails (no existing record), insert new one
      const { error: insertError } = await supabase
        .from("form_analytics")
        .insert({
          session_id: sessionId,
          subdomain: subdomain || "default",
          event_type: "form_abandoned",
          step_reached: stepReached || 1,
          partial_data: partialData || {}
        });

      if (insertError) {
        console.error("Error inserting analytics:", insertError);
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Successfully saved partial data for session ${sessionId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in salvar-parcial function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
