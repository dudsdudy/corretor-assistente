-- Fix security vulnerability in user_events table
-- Replace the overly permissive insert policy with a secure one

-- Drop the existing insecure policy
DROP POLICY IF EXISTS "insert_event" ON public.user_events;

-- Create a secure insert policy that only allows users to insert events for themselves
CREATE POLICY "Users can only insert their own events" 
ON public.user_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Note: Edge functions using service role key will bypass RLS and can still insert events for any user