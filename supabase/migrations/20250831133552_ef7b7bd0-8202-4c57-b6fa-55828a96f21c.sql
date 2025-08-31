-- Add missing columns to existing profiles table for broker information
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS insurance_company TEXT,
ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS insurance_types TEXT[] DEFAULT '{}';