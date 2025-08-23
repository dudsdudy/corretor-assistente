-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create client_analyses table for storing client data and recommendations
CREATE TABLE public.client_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  broker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_age INTEGER,
  client_gender TEXT,
  client_profession TEXT,
  monthly_income DECIMAL(10,2),
  has_dependents BOOLEAN DEFAULT false,
  dependents_count INTEGER DEFAULT 0,
  current_debts DECIMAL(10,2),
  health_status TEXT,
  existing_insurance BOOLEAN DEFAULT false,
  risk_profile TEXT,
  recommended_coverage JSONB,
  justifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on client_analyses
ALTER TABLE public.client_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for client_analyses
CREATE POLICY "Brokers can view their own analyses" 
ON public.client_analyses 
FOR SELECT 
USING (auth.uid() = broker_id);

CREATE POLICY "Brokers can create analyses" 
ON public.client_analyses 
FOR INSERT 
WITH CHECK (auth.uid() = broker_id);

CREATE POLICY "Brokers can update their own analyses" 
ON public.client_analyses 
FOR UPDATE 
USING (auth.uid() = broker_id);

CREATE POLICY "Brokers can delete their own analyses" 
ON public.client_analyses 
FOR DELETE 
USING (auth.uid() = broker_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_analyses_updated_at
  BEFORE UPDATE ON public.client_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();