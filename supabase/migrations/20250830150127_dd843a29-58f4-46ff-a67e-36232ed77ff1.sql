-- Create the first admin user
-- Replace 'admin@exemplo.com' with the actual admin email

DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user_id for the admin email (replace with actual email)
    SELECT auth.users.id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@exemplo.com';
    
    -- Only insert if user exists and role doesn't exist yet
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin role granted to user: %', admin_user_id;
    ELSE
        RAISE NOTICE 'User with email admin@exemplo.com not found. Please replace with correct email.';
    END IF;
END $$;