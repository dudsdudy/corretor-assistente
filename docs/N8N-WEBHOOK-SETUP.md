# Configuração do N8N para Automação WhatsApp - Corretor Consultor

## Visão Geral

Este guia detalha como configurar o N8N para automatizar comunicações via WhatsApp baseadas nos eventos do aplicativo Corretor Consultor.

## Pré-requisitos

1. **Conta N8N** - Pode ser N8N Cloud ou self-hosted
2. **API WhatsApp Business** - Recomendamos usar Evolution API ou similar
3. **Webhook URL** - Configurada no N8N para receber eventos
4. **Supabase Edge Function** - Já implementada: `trigger-n8n-webhook`

## Eventos Disponíveis

O sistema envia os seguintes eventos para o N8N:

### 1. `user_registered`
**Gatilho:** Quando um novo usuário se cadastra
**Dados enviados:**
```json
{
  "event_type": "user_registered",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "user_data": {
    "user_id": "uuid",
    "email": "usuario@email.com",
    "full_name": "João Silva",
    "phone_number": "5511999999999",
    "free_studies_used": 0,
    "free_studies_remaining": 3,
    "subscription_status": "free_trial",
    "is_premium": false
  }
}
```

### 2. `study_completed`
**Gatilho:** Quando um usuário completa um estudo
**Dados enviados:**
```json
{
  "event_type": "study_completed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "user_data": {
    "user_id": "uuid",
    "email": "usuario@email.com",
    "full_name": "João Silva",
    "phone_number": "5511999999999",
    "free_studies_used": 1,
    "free_studies_remaining": 2,
    "subscription_status": "free_trial",
    "is_premium": false
  }
}
```

### 3. `free_trial_limit_reached`
**Gatilho:** Quando usuário usa todos os 3 estudos gratuitos
**Dados enviados:**
```json
{
  "event_type": "free_trial_limit_reached",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "user_data": {
    "user_id": "uuid",
    "email": "usuario@email.com",
    "full_name": "João Silva",
    "phone_number": "5511999999999",
    "free_studies_used": 3,
    "free_studies_remaining": 0,
    "subscription_status": "free_trial",
    "is_premium": false
  }
}
```

## Configuração no N8N

### Passo 1: Criar Webhook

1. No N8N, crie um novo workflow
2. Adicione um nó **Webhook**
3. Configure:
   - **Method:** POST
   - **Path:** /corretor-consultor-events
   - **Response Mode:** Last Node
4. Copie a URL gerada (ex: `https://seu-n8n.app/webhook/corretor-consultor-events`)

### Passo 2: Configurar Variável de Ambiente

No Supabase, adicione a variável:
```
N8N_WEBHOOK_URL=https://seu-n8n.app/webhook/corretor-consultor-events
```

### Passo 3: Configurar Fluxos de Automação

## Fluxo 1: Boas-vindas (user_registered)

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "name": "Filter - User Registered",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.event_type}}",
              "operation": "equal",
              "value2": "user_registered"
            }
          ]
        }
      },
      "position": [450, 300]
    },
    {
      "name": "WhatsApp - Boas Vindas",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://sua-api-whatsapp.com/message/sendText/instancia",
        "method": "POST",
        "headers": {
          "apikey": "SUA_API_KEY"
        },
        "body": {
          "number": "{{$json.user_data.phone_number}}",
          "options": {
            "delay": 1200,
            "presence": "composing"
          },
          "textMessage": {
            "text": "🎉 Olá {{$json.user_data.full_name}}!\n\nBem-vindo ao Corretor Consultor! Você tem 3 estudos gratuitos para experimentar nossa plataforma.\n\n✨ Comece agora e otimize suas vendas de seguro de vida!\n\n👉 https://seu-app.com"
          }
        }
      },
      "position": [650, 200]
    }
  ]
}
```

## Fluxo 2: Lembrete de Uso (study_completed)

```json
{
  "nodes": [
    {
      "name": "Filter - Study Completed",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.event_type}}",
              "operation": "equal",
              "value2": "study_completed"
            }
          ]
        }
      }
    },
    {
      "name": "Check Studies Remaining",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "number": [
            {
              "value1": "={{$json.user_data.free_studies_remaining}}",
              "operation": "equal",
              "value2": 1
            }
          ]
        }
      }
    },
    {
      "name": "WhatsApp - Último Estudo",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "body": {
          "number": "{{$json.user_data.phone_number}}",
          "textMessage": {
            "text": "🔥 {{$json.user_data.full_name}}, falta só 1 estudo gratuito!\n\nNão perca a chance de explorar todo o potencial do Corretor Consultor.\n\n💡 Transforme suas vendas agora:\n👉 https://seu-app.com"
          }
        }
      }
    }
  ]
}
```

## Fluxo 3: Oferta de Assinatura (free_trial_limit_reached)

```json
{
  "nodes": [
    {
      "name": "Filter - Limit Reached",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{$json.event_type}}",
              "operation": "equal",
              "value2": "free_trial_limit_reached"
            }
          ]
        }
      }
    },
    {
      "name": "WhatsApp - Oferta Premium",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "body": {
          "number": "{{$json.user_data.phone_number}}",
          "textMessage": {
            "text": "🎯 {{$json.user_data.full_name}}, seus 3 estudos gratuitos terminaram!\n\n💪 Para continuar gerando recomendações incríveis e impulsionar suas vendas:\n\n👑 Conheça nossos planos Premium\n👉 https://seu-app.com/planos\n\n💬 Dúvidas? Responda esta mensagem!"
          }
        }
      }
    },
    {
      "name": "Delay 3 dias",
      "type": "n8n-nodes-base.wait",
      "parameters": {
        "amount": 3,
        "unit": "days"
      }
    },
    {
      "name": "Check Still Free",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://seu-supabase.supabase.co/rest/v1/profiles?user_id=eq.{{$json.user_data.user_id}}&select=is_premium",
        "headers": {
          "apikey": "SEU_SUPABASE_ANON_KEY"
        }
      }
    },
    {
      "name": "WhatsApp - Follow Up",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "body": {
          "textMessage": {
            "text": "💡 Oi {{$json.user_data.full_name}}!\n\nVi que você experimentou o Corretor Consultor. Como foi a experiência?\n\n🚀 Que tal desbloquear o potencial completo?\n\n✅ Estudos ilimitados\n✅ Pipeline de vendas\n✅ Personalização completa\n\n👉 https://seu-app.com/planos"
          }
        }
      }
    }
  ]
}
```

## APIs WhatsApp Recomendadas

### Evolution API
```bash
# Instalação via Docker
docker run -d \
  --name evolution-api \
  -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave-secreta \
  atendai/evolution-api:latest
```

**Endpoint para envio:**
```
POST https://sua-evolution.com/message/sendText/instancia
Headers: apikey: sua-chave
Body: { "number": "5511999999999", "textMessage": { "text": "mensagem" } }
```

### WhatsApp Business API (Meta)
- Mais robusta, mas requer aprovação do Meta
- Ideal para grandes volumes
- Documentação: https://developers.facebook.com/docs/whatsapp

## Variáveis de Ambiente Necessárias

No Supabase Edge Functions, configure:

```env
N8N_WEBHOOK_URL=https://seu-n8n.app/webhook/corretor-consultor-events
```

## Testando a Integração

1. **Cadastre um usuário teste** no app
2. **Verifique nos logs** do N8N se recebeu o webhook
3. **Complete alguns estudos** e monitore os eventos
4. **Atinja o limite de 3 estudos** para testar o fluxo completo

## Logs e Monitoramento

### No Supabase
```sql
-- Ver eventos enviados
SELECT * FROM user_events ORDER BY created_at DESC LIMIT 10;
```

### No N8N
- Acesse **Executions** para ver histórico de execuções
- Use **Debug mode** durante configuração
- Configure **Error Workflows** para falhas

## Personalização Avançada

### Segmentação por Perfil
```javascript
// No N8N, adicione lógica condicional
if (userData.monthly_income > 10000) {
  message = "Mensagem para high-value prospects";
} else {
  message = "Mensagem padrão";
}
```

### Horário de Envio
```javascript
// Verificar horário comercial
const hour = new Date().getHours();
if (hour >= 9 && hour <= 18) {
  // Enviar mensagem
} else {
  // Agendar para próximo horário comercial
}
```

## Métricas Importantes

Monitore:
- Taxa de conversão free trial → premium
- Tempo médio para conversão
- Engajamento com mensagens WhatsApp
- Churn rate pós-trial

## Próximos Passos

1. Configure os workflows básicos
2. Teste com usuários piloto
3. Otimize mensagens baseado em conversão
4. Adicione segmentação avançada
5. Implemente follow-ups personalizados