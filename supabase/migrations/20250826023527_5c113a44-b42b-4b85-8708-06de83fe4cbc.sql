-- Fix security issue: Add search_path to function
DROP FUNCTION IF EXISTS sync_premium_status();

CREATE OR REPLACE FUNCTION sync_premium_status()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Update is_premium in profiles table when subscribers table changes
  UPDATE public.profiles 
  SET is_premium = NEW.subscribed,
      subscription_status = CASE 
        WHEN NEW.subscribed THEN 'active'
        ELSE 'free_trial'
      END,
      subscription_plan = CASE 
        WHEN NEW.subscribed THEN 'pro'
        ELSE NULL
      END
  WHERE user_id = NEW.user_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync premium status
CREATE TRIGGER sync_premium_status_trigger
    AFTER INSERT OR UPDATE ON public.subscribers
    FOR EACH ROW EXECUTE FUNCTION sync_premium_status();