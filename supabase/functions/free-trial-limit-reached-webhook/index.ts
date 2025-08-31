import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIAL-LIMIT-REACHED] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Free trial limit reached webhook started");

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const { finalStudyData } = await req.json();
    
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Authenticate user using the provided JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      logStep('Authentication failed', { authError });
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const userId = user.id;
    logStep("Processing authenticated free trial limit reached", { userId });

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

    // Prepare event data for N8N
    const eventData = {
      event_type: "free_trial_limit_reached",
      user_id: userId,
      email: profile.email,
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      free_studies_used: profile.free_studies_used,
      free_studies_limit: profile.free_studies_limit || 3,
      insurance_company: profile.insurance_company,
      insurance_types: profile.insurance_types,
      final_study_data: finalStudyData,
      limit_reached_date: new Date().toISOString(),
      conversion_opportunity: true,
    };

    // Store event in database
    const { error: eventError } = await supabaseClient
      .from('user_events')
      .insert({
        user_id: userId,
        event_type: 'free_trial_limit_reached',
        event_data: eventData,
        created_at: new Date().toISOString()
      });

    if (eventError) {
      logStep("Event storage error", eventError);
    }

    // Trigger N8N webhook for WhatsApp automation (conversion campaign)
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    if (n8nWebhookUrl) {
      logStep("Triggering N8N webhook for conversion campaign", { url: n8nWebhookUrl });
      
      try {
        const webhookResponse = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_type: "free_trial_limit_reached",
            timestamp: new Date().toISOString(),
            user_data: eventData,
            message_template: "trial_limit_reached_conversion",
            priority: "high", // High priority for conversion
            campaign_type: "immediate_conversion"
          })
        });

        if (!webhookResponse.ok) {
          logStep("N8N webhook failed", { status: webhookResponse.status });
        } else {
          logStep("N8N webhook triggered successfully for conversion campaign");
        }
      } catch (webhookError) {
        logStep("N8N webhook error", { error: webhookError.message });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      event_stored: !eventError,
      webhook_triggered: !!n8nWebhookUrl,
      message: "Free trial limit reached processed successfully",
      conversion_campaign_triggered: true
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