import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FOLLOW-UP-NON-CONVERTED] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Follow-up non-converted users webhook started");

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { followUpType, daysAfterLimit } = await req.json();
    
    // Security check: This function should only be called by admins
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header - admin access required' }), {
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

    // Check if user has admin role
    const { data: hasAdminRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      logStep('Access denied - admin role required', { userId: user.id });
      return new Response(JSON.stringify({ error: 'Access denied: admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    
    if (!followUpType) {
      throw new Error("followUpType is required (e.g., '3_days', '7_days', '14_days')");
    }

    logStep("Processing follow-up for non-converted users", { followUpType, daysAfterLimit });

    // Calculate the date range for users who reached the limit X days ago
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - (daysAfterLimit || 3));
    const startOfDay = new Date(daysAgo);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(daysAgo);
    endOfDay.setHours(23, 59, 59, 999);

    // Find users who reached the free trial limit X days ago and haven't subscribed
    const { data: nonConvertedUsers, error: queryError } = await supabaseClient
      .from('user_events')
      .select(`
        user_id,
        event_data,
        created_at
      `)
      .eq('event_type', 'free_trial_limit_reached')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (queryError) {
      logStep("Query error", queryError);
      throw new Error(`Failed to query non-converted users: ${queryError.message}`);
    }

    if (!nonConvertedUsers || nonConvertedUsers.length === 0) {
      logStep("No non-converted users found for follow-up", { daysAgo: daysAgo.toISOString() });
      return new Response(JSON.stringify({ 
        success: true,
        users_processed: 0,
        message: "No non-converted users found for follow-up"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep(`Found ${nonConvertedUsers.length} non-converted users for follow-up`);

    // Process each non-converted user
    const processedUsers = [];
    const n8nWebhookUrl = Deno.env.get("N8N_WEBHOOK_URL");

    for (const userEvent of nonConvertedUsers) {
      try {
        // Check if user has subscribed since reaching the limit
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('is_premium, subscription_status, email, full_name, phone_number, insurance_company')
          .eq('user_id', userEvent.user_id)
          .single();

        // Skip if user has already subscribed
        if (profile?.is_premium) {
          logStep(`User ${userEvent.user_id} has already subscribed, skipping follow-up`);
          continue;
        }

        // Prepare follow-up event data
        const followUpEventData = {
          event_type: "follow_up_non_converted",
          user_id: userEvent.user_id,
          email: profile?.email,
          full_name: profile?.full_name,
          phone_number: profile?.phone_number,
          insurance_company: profile?.insurance_company,
          follow_up_type: followUpType,
          days_after_limit: daysAfterLimit,
          original_limit_reached_date: userEvent.created_at,
          follow_up_date: new Date().toISOString(),
          conversion_opportunity: true,
        };

        // Store follow-up event in database
        await supabaseClient
          .from('user_events')
          .insert({
            user_id: userEvent.user_id,
            event_type: 'follow_up_non_converted',
            event_data: followUpEventData,
            created_at: new Date().toISOString()
          });

        // Trigger N8N webhook for WhatsApp follow-up automation
        if (n8nWebhookUrl) {
          try {
            const webhookResponse = await fetch(n8nWebhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                event_type: "follow_up_non_converted",
                timestamp: new Date().toISOString(),
                user_data: followUpEventData,
                message_template: `follow_up_${followUpType}`,
                priority: "medium",
                campaign_type: "follow_up_conversion"
              })
            });

            if (webhookResponse.ok) {
              processedUsers.push(userEvent.user_id);
              logStep(`Follow-up webhook triggered for user ${userEvent.user_id}`);
            }
          } catch (webhookError) {
            logStep(`Webhook error for user ${userEvent.user_id}`, { error: webhookError.message });
          }
        }
      } catch (userError) {
        logStep(`Error processing user ${userEvent.user_id}`, { error: userError.message });
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      users_found: nonConvertedUsers.length,
      users_processed: processedUsers.length,
      follow_up_type: followUpType,
      processed_user_ids: processedUsers
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