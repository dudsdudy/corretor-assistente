-- Adicionar coluna para dados detalhados dos dependentes
ALTER TABLE public.client_analyses 
ADD COLUMN dependents_data jsonb;

-- Comentário explicativo sobre a estrutura do JSONB:
-- dependents_data será um array de objetos com estrutura:
-- [
--   {
--     "age": 10,
--     "yearsUntilEducationComplete": 8,
--     "educationType": "superior" | "medio" | "tecnico"
--   }
-- ]