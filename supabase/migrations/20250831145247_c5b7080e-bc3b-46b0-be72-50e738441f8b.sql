-- Fix critical security vulnerability in subscribers table
-- Remove the insecure update policy that allows any user to update any subscription
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create secure update policy that only allows:
-- 1. Users to update their own subscription (based on user_id or email match)
-- 2. Admins to update any subscription
CREATE POLICY "Users can update own subscription or admins can update any" 
ON public.subscribers 
FOR UPDATE 
USING (
  -- User can update if it's their own subscription (either by user_id or email)
  (auth.uid() = user_id) OR 
  (auth.email() = email) OR 
  -- Or if user is an admin
  has_role(auth.uid(), 'admin'::app_role)
);

-- Also fix the overly permissive insert policy to be more secure
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

-- Create secure insert policy
CREATE POLICY "Users can create own subscription or admins can create any" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (
  -- User can insert if it's for their own user_id/email
  (auth.uid() = user_id) OR 
  (auth.email() = email) OR 
  -- Or if user is an admin
  has_role(auth.uid(), 'admin'::app_role)
);