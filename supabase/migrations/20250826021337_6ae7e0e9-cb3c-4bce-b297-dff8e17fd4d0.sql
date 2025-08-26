-- Adicionar coluna para controlar estudos gratuitos na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN free_studies_used INTEGER DEFAULT 0,
ADD COLUMN free_studies_limit INTEGER DEFAULT 3,
ADD COLUMN is_premium BOOLEAN DEFAULT false,
ADD COLUMN phone_number TEXT,
ADD COLUMN subscription_status TEXT DEFAULT 'free_trial',
ADD COLUMN subscription_plan TEXT,
ADD COLUMN trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Criar tabela para rastrear eventos de usuário (para N8N webhooks)
CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de eventos
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

-- Criar política para que usuários possam ver apenas seus próprios eventos
CREATE POLICY "select_own_events" ON public.user_events
FOR SELECT
USING (user_id = auth.uid());

-- Política para edge functions inserirem eventos (usar service role key)
CREATE POLICY "insert_event" ON public.user_events
FOR INSERT
WITH CHECK (true);

-- Função para atualizar contadores automaticamente
CREATE OR REPLACE FUNCTION public.increment_free_studies_used(p_user_id UUID)
RETURNS TABLE(studies_used INTEGER, studies_remaining INTEGER, limit_reached BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_used INTEGER;
  v_limit INTEGER;
BEGIN
  -- Buscar valores atuais
  SELECT free_studies_used, free_studies_limit 
  INTO v_current_used, v_limit
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- Se não encontrou o profile, retornar erro
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found for user_id: %', p_user_id;
  END IF;
  
  -- Incrementar apenas se não atingiu o limite
  IF v_current_used < v_limit THEN
    UPDATE public.profiles 
    SET free_studies_used = free_studies_used + 1
    WHERE user_id = p_user_id;
    
    v_current_used := v_current_used + 1;
  END IF;
  
  -- Retornar status atual
  RETURN QUERY SELECT 
    v_current_used,
    v_limit - v_current_used,
    v_current_used >= v_limit;
END;
$$;

-- Função para verificar se usuário pode criar estudos
CREATE OR REPLACE FUNCTION public.can_create_study(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
  v_is_premium BOOLEAN;
BEGIN
  SELECT free_studies_used, free_studies_limit, is_premium
  INTO v_used, v_limit, v_is_premium
  FROM public.profiles 
  WHERE user_id = p_user_id;
  
  -- Se não encontrou ou é premium, permitir
  IF NOT FOUND OR v_is_premium THEN
    RETURN true;
  END IF;
  
  -- Verificar se ainda tem estudos disponíveis
  RETURN v_used < v_limit;
END;
$$;