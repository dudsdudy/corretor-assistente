import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, ExternalLink, Loader2 } from "lucide-react";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionManagerProps {
  user: User | null;
}

const SubscriptionManager = ({ user }: SubscriptionManagerProps) => {
  const { 
    isPremium, 
    subscriptionTier, 
    subscriptionEnd,
    createCheckout, 
    openCustomerPortal,
    checkSubscriptionStatus
  } = useFreeTrial(user);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const checkoutUrl = await createCheckout();
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível criar a sessão de pagamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar sessão de pagamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const portalUrl = await openCustomerPortal();
      if (portalUrl) {
        window.open(portalUrl, '_blank');
      } else {
        toast({
          title: "Erro", 
          description: "Não foi possível abrir o portal de gerenciamento",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao abrir portal de gerenciamento",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshStatus = async () => {
    setLoading(true);
    try {
      await checkSubscriptionStatus();
      toast({
        title: "Sucesso",
        description: "Status da assinatura atualizado"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status da assinatura",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Assinatura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPremium ? (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Plano Ativo</p>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-green-500 text-white">
                    {subscriptionTier || 'Pro'}
                  </Badge>
                  {subscriptionEnd && (
                    <span className="text-sm text-muted-foreground">
                      até {new Date(subscriptionEnd).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleManageSubscription}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Gerenciar Assinatura
              </Button>
              
              <Button 
                onClick={handleRefreshStatus}
                disabled={loading}
                variant="ghost"
                size="sm"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Atualizar"
                )}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="font-semibold">Teste Grátis</p>
              <p className="text-sm text-muted-foreground">
                Faça upgrade para ter acesso ilimitado
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Plano Pro - R$ 49,99/mês</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Estudos ilimitados</li>
                <li>• Pipeline avançado</li>
                <li>• Personalização completa</li>
              </ul>
            </div>
            
            <Button 
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Crown className="h-4 w-4 mr-2" />
              )}
              Fazer Upgrade
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionManager;