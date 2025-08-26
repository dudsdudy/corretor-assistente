-- Corrigir problemas de segurança nas funções criadas
-- Redefinir as funções com search_path adequado

CREATE OR REPLACE FUNCTION public.increment_free_studies_used(p_user_id UUID)
RETURNS TABLE(studies_used INTEGER, studies_remaining INTEGER, limit_reached BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.can_create_study(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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