-- 1) Add status column & helpful indexes
ALTER TABLE public.client_analyses
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'novo';

CREATE INDEX IF NOT EXISTS idx_client_analyses_broker_id ON public.client_analyses (broker_id);
CREATE INDEX IF NOT EXISTS idx_client_analyses_created_at ON public.client_analyses (created_at);
CREATE INDEX IF NOT EXISTS idx_client_analyses_status ON public.client_analyses (status);

-- 2) Roles: enum, table, helper function
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','manager','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function to check roles (security definer to avoid recursive RLS issues)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles r WHERE r.user_id = _user_id AND r.role = _role
  );
$$;

-- Policies for user_roles
DO $$ BEGIN
  CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Client analyses: allow admins to view all (keep existing user-scoped policies intact)
DO $$ BEGIN
  CREATE POLICY "Admins can view all analyses"
  ON public.client_analyses
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;