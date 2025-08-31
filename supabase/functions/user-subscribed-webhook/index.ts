import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[USER-SUBSCRIBED] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("User subscription webhook started");

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body - this webhook can be called by Stripe or authenticated users
    const { userId, subscriptionData } = await req.json();
    
    // Get authenticated user if this is called from frontend
    const authHeader = req.headers.get('Authorization');
    let authenticatedUserId = null;
    
    if (authHeader) {
      const { data: { user } } = await supabaseClient.auth.getUser(
        authHeader.replace('Bearer ', '')
      );
      authenticatedUserId = user?.id;
    }

    // If called from frontend, ensure user can only update their own subscription
    if (authHeader && authenticatedUserId !== userId) {
      return new Response(JSON.stringify({ error: 'Access denied: cannot update subscription for other users' }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!userId) {
      throw new Error("userId is required");
    }

    logStep("Processing user subscription", { userId, subscriptionData, authenticatedUserId });

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
      event_type: "user_subscribed",
      user_id: userId,
      email: profile.email,
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      insurance_company: profile.insurance_company,
      subscription_plan: subscriptionData?.plan || 'pro',
      subscription_status: 'active',
      subscription_date: new Date().toISOString(),
      previous_free_studies_used: profile.free_studies_used,
      conversion_successful: true,
    };

    // Store event in database
    const { error: eventError } = await supabaseClient
      .from('user_events')
      .insert({
        user_id: userId,
        event_type: 'user_subscribed',
        event_data: eventData,
        created_at: new Date().toISOString()
      });

    if (eventError) {
      logStep("Event storage error", eventError);
    }

    // Trigger N8N webhook for WhatsApp automation (welcome premium user)
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    if (n8nWebhookUrl) {
      logStep("Triggering N8N webhook for premium welcome message", { url: n8nWebhookUrl });
      
      try {
        const webhookResponse = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_type: "user_subscribed",
            timestamp: new Date().toISOString(),
            user_data: eventData,
            message_template: "premium_welcome",
            priority: "high",
            campaign_type: "welcome_premium"
          })
        });

        if (!webhookResponse.ok) {
          logStep("N8N webhook failed", { status: webhookResponse.status });
        } else {
          logStep("N8N webhook triggered successfully for premium welcome");
        }
      } catch (webhookError) {
        logStep("N8N webhook error", { error: webhookError.message });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      event_stored: !eventError,
      webhook_triggered: !!n8nWebhookUrl,
      message: "User subscription processed successfully",
      welcome_campaign_triggered: true
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