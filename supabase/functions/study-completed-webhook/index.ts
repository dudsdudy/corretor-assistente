import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STUDY-COMPLETED] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Study completed webhook started");

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request body
    const { studyData, studiesRemaining } = await req.json();
    
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
    logStep("Processing authenticated study completion", { userId, studiesRemaining });

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

    // Determine the message template based on studies remaining
    let messageTemplate = "study_completed_general";
    if (studiesRemaining === 1) {
      messageTemplate = "study_completed_one_remaining";
    } else if (studiesRemaining === 2) {
      messageTemplate = "study_completed_two_remaining";
    }

    // Prepare event data for N8N
    const eventData = {
      event_type: "study_completed",
      user_id: userId,
      email: profile.email,
      full_name: profile.full_name,
      phone_number: profile.phone_number,
      free_studies_used: profile.free_studies_used,
      free_studies_remaining: studiesRemaining,
      free_studies_limit: profile.free_studies_limit || 3,
      insurance_company: profile.insurance_company,
      study_data: studyData,
      completion_date: new Date().toISOString(),
    };

    // Store event in database
    const { error: eventError } = await supabaseClient
      .from('user_events')
      .insert({
        user_id: userId,
        event_type: 'study_completed',
        event_data: eventData,
        created_at: new Date().toISOString()
      });

    if (eventError) {
      logStep("Event storage error", eventError);
    }

    // Trigger N8N webhook for WhatsApp automation
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");
    if (n8nWebhookUrl) {
      logStep("Triggering N8N webhook for study completion message", { url: n8nWebhookUrl, template: messageTemplate });
      
      try {
        const webhookResponse = await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_type: "study_completed",
            timestamp: new Date().toISOString(),
            user_data: eventData,
            message_template: messageTemplate
          })
        });

        if (!webhookResponse.ok) {
          logStep("N8N webhook failed", { status: webhookResponse.status });
        } else {
          logStep("N8N webhook triggered successfully for study completion");
        }
      } catch (webhookError) {
        logStep("N8N webhook error", { error: webhookError.message });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      event_stored: !eventError,
      webhook_triggered: !!n8nWebhookUrl,
      message_template: messageTemplate,
      studies_remaining: studiesRemaining
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