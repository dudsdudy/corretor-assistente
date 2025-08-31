-- Admin policies and bootstrap admin role
-- Ensure RLS is enabled (already enabled by schema)

-- 1) Admins can view/update all profiles
CREATE POLICY IF NOT EXISTS "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY IF NOT EXISTS "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) User roles management
CREATE POLICY IF NOT EXISTS "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY IF NOT EXISTS "Master or Admin can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.email() = 'tiago-de-santana@hotmail.com' OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY IF NOT EXISTS "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) Subscribers management for admins
CREATE POLICY IF NOT EXISTS "Admins can view all subscribers"
ON public.subscribers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY IF NOT EXISTS "Admins can insert subscribers"
ON public.subscribers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY IF NOT EXISTS "Admins can update any subscriber"
ON public.subscribers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY IF NOT EXISTS "Admins can delete any subscriber"
ON public.subscribers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4) Bootstrap: set Tiago as admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'tiago-de-santana@hotmail.com'
ON CONFLICT DO NOTHING;