import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[N8N-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook trigger started");

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { eventType, userId, userData } = await req.json();
    
    if (!eventType || !userId) {
      throw new Error("eventType and userId are required");
    }

    logStep("Processing event", { eventType, userId });

    // Get user profile data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      logStep("Profile fetch error", profileError);
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    // Prepare event data
    const eventData = {
      user_id: userId,
      email: userData.email,
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      free_studies_used: profile.free_studies_used,
      free_studies_remaining: profile.free_studies_limit - profile.free_studies_used,
      subscription_status: profile.subscription_status,
      is_premium: profile.is_premium,
      ...userData
    };

    // Store event in database
    const { error: eventError } = await supabaseClient
      .from('user_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        created_at: new Date().toISOString()
      });

    if (eventError) {
      logStep("Event storage error", eventError);
    }

    // Trigger N8N webhook if configured
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    if (n8nWebhookUrl) {
      logStep("Triggering N8N webhook", { url: n8nWebhookUrl });
      
      try {
        const webhookResponse = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_type: eventType,
            timestamp: new Date().toISOString(),
            user_data: eventData
          })
        });

        if (!webhookResponse.ok) {
          logStep("N8N webhook failed", { status: webhookResponse.status });
        } else {
          logStep("N8N webhook triggered successfully");
        }
      } catch (webhookError) {
        logStep("N8N webhook error", { error: webhookError.message });
      }
    } else {
      logStep("N8N webhook URL not configured, skipping external trigger");
    }

    return new Response(JSON.stringify({ 
      success: true,
      event_stored: !eventError,
      webhook_triggered: !!n8nWebhookUrl
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});