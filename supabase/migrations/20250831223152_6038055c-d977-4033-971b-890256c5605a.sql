-- Security Fix: Update SECURITY DEFINER functions to validate user ownership
-- Fix can_create_study function to only allow users to check their own studies
CREATE OR REPLACE FUNCTION public.can_create_study(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
  v_is_premium BOOLEAN;
BEGIN
  -- Security check: only allow users to check their own study limits
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot check study limits for other users';
  END IF;

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
$function$;

-- Fix increment_free_studies_used function to only allow users to increment their own studies
CREATE OR REPLACE FUNCTION public.increment_free_studies_used(p_user_id uuid)
 RETURNS TABLE(studies_used integer, studies_remaining integer, limit_reached boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_used INTEGER;
  v_limit INTEGER;
BEGIN
  -- Security check: only allow users to increment their own studies
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot increment studies for other users';
  END IF;

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
$function$;