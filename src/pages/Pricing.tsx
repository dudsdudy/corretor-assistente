import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Loader2, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import SubscriptionManager from "@/components/SubscriptionManager";
import { useNavigate } from "react-router-dom";

const Pricing = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { 
    isPremium, 
    studiesUsed, 
    studiesRemaining,
    createCheckout,
    checkSubscriptionStatus
  } = useFreeTrial(user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check subscription status when page loads
        await checkSubscriptionStatus();
      }
    };
    
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [checkSubscriptionStatus]);

  const handleUpgrade = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const checkoutUrl = await createCheckout();
      if (checkoutUrl) {
        window.open(checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-secondary/20">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Escolha o Plano Ideal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ative o turbo para a recorrência em suas vendas com nossa plataforma profissional
          </p>
          <div className="bg-primary/10 rounded-lg p-4 mt-6 max-w-md mx-auto">
            <p className="text-sm font-medium text-primary">
              💡 Com 10 estudos por dia, você economiza até 40 horas semanais!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Mais tempo para fechar vendas e conquistar novos clientes
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 items-start">
          {/* Free Trial Card */}
          <Card className={`relative ${isPremium ? 'opacity-75' : ''}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Teste Grátis</CardTitle>
                  <p className="text-muted-foreground mt-2">Para experimentar</p>
                </div>
                {!isPremium && (
                  <Badge variant="outline">Atual</Badge>
                )}
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">Grátis</span>
                <p className="text-sm text-muted-foreground">3 estudos inclusos</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">3 estudos gratuitos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Relatórios em PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Cálculos profissionais</span>
                </li>
              </ul>
              
              {!isPremium && user && (
                <div className="bg-muted rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium">Seu progresso:</p>
                  <p className="text-xs text-muted-foreground">
                    {studiesUsed}/3 estudos utilizados
                  </p>
                  {studiesRemaining > 0 && (
                    <p className="text-xs text-primary font-medium">
                      {studiesRemaining} estudos restantes
                    </p>
                  )}
                </div>
              )}

              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                className="w-full"
                disabled={isPremium}
              >
                {user ? 'Continuar Testando' : 'Começar Teste'}
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan Card */}
          <Card className={`relative transform transition-all duration-300 hover:scale-105 ${isPremium ? 'ring-2 ring-primary shadow-2xl bg-gradient-to-br from-primary/5 to-secondary/10' : 'shadow-lg hover:shadow-xl'}`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-primary text-primary-foreground px-4 py-1 text-sm font-semibold">
                ⭐ Plano Ideal
              </Badge>
            </div>
            
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2 mb-2">
                    <Crown className="h-6 w-6 text-primary" />
                    Plano Pro
                  </CardTitle>
                  <p className="text-muted-foreground">Para corretores profissionais</p>
                </div>
                {isPremium && (
                  <Badge variant="default" className="bg-green-500 text-white">✓ Ativo</Badge>
                )}
              </div>
              <div className="mt-6 p-4 bg-gradient-subtle rounded-lg border">
                <div className="text-center">
                  <span className="text-4xl font-bold text-primary">R$ 49,99</span>
                  <span className="text-muted-foreground text-lg">/mês</span>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-2">Cobrado mensalmente • Cancele quando quiser</p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Estudos ilimitados</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Pipeline avançado de leads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Personalização completa</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Relatórios com sua marca</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Suporte prioritário</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Automação via WhatsApp</span>
                </li>
              </ul>

              <Button 
                onClick={handleUpgrade}
                disabled={loading || isPremium}
                className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : isPremium ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Crown className="h-4 w-4 mr-2" />
                )}
                {isPremium ? 'Plano Ativo' : 'Fazer Upgrade'}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription Management Card */}
          {user && (
            <div className="space-y-4">
              <SubscriptionManager user={user} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5" />
                    Configurações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => navigate('/settings')} 
                    variant="outline" 
                    className="w-full"
                  >
                    Perfil e Configurações
                  </Button>
                  <Button 
                    onClick={() => navigate('/leads')} 
                    variant="outline" 
                    className="w-full"
                  >
                    Gerenciar Leads
                  </Button>
                  <Button 
                    onClick={() => navigate('/sales')} 
                    variant="outline" 
                    className="w-full"
                  >
                    Dashboard de Vendas
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground">
            Não tem certeza? Comece com o teste grátis e faça upgrade quando quiser.
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <span>• Cancelamento a qualquer momento</span>
            <span>• Suporte via WhatsApp</span>
            <span>• Atualizações gratuitas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;