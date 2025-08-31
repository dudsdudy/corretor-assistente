-- Admin policies and bootstrap admin role (correcting syntax)

-- 1) Admins can view/update all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2) User roles management
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Master or Admin can insert roles" ON public.user_roles;
CREATE POLICY "Master or Admin can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (auth.email() = 'tiago-de-santana@hotmail.com' OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3) Subscribers management for admins
DROP POLICY IF EXISTS "Admins can view all subscribers" ON public.subscribers;
CREATE POLICY "Admins can view all subscribers"
ON public.subscribers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can insert subscribers" ON public.subscribers;
CREATE POLICY "Admins can insert subscribers"
ON public.subscribers
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update any subscriber" ON public.subscribers;
CREATE POLICY "Admins can update any subscriber"
ON public.subscribers
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete any subscriber" ON public.subscribers;
CREATE POLICY "Admins can delete any subscriber"
ON public.subscribers
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4) Bootstrap: set Tiago as admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'tiago-de-santana@hotmail.com'
ON CONFLICT (user_id, role) DO NOTHING;