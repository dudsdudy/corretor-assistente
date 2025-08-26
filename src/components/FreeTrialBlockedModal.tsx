import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, CheckCircle, Zap, Shield, Loader2 } from "lucide-react";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface FreeTrialBlockedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const FreeTrialBlockedModal = ({ open, onOpenChange, user }: FreeTrialBlockedModalProps) => {
  const { createCheckout } = useFreeTrial(user);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const onUpgrade = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const checkoutUrl = await createCheckout();
      if (checkoutUrl) {
        // Open Stripe checkout in a new tab
        window.open(checkoutUrl, '_blank');
        onOpenChange(false); // Close modal after opening checkout
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto p-3 bg-gradient-primary rounded-full w-fit">
            <Crown className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl">
            Seus 3 estudos gratuitos acabaram!
          </DialogTitle>
          <DialogDescription className="text-base">
            Você utilizou todos os estudos do seu teste grátis. Continue gerando 
            recomendações profissionais e impulsionando suas vendas com um plano premium.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-3 gap-4 my-6">
          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-4 text-center space-y-2">
              <Zap className="h-8 w-8 text-primary mx-auto" />
              <h4 className="font-semibold">Estudos Ilimitados</h4>
              <p className="text-sm text-muted-foreground">
                Crie quantos estudos precisar para seus clientes
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-4 text-center space-y-2">
              <Shield className="h-8 w-8 text-success mx-auto" />
              <h4 className="font-semibold">Pipeline Avançado</h4>
              <p className="text-sm text-muted-foreground">
                Gestão completa de leads e vendas
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-4 text-center space-y-2">
              <CheckCircle className="h-8 w-8 text-accent mx-auto" />
              <h4 className="font-semibold">Personalização</h4>
              <p className="text-sm text-muted-foreground">
                Logo e marca da sua corretora
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h5 className="font-semibold mb-2">🎯 O que você já conquistou:</h5>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Experimentou a metodologia profissional de cálculo
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Gerou estudos com qualidade de corretora especializada
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              Viu como otimizar suas apresentações para clientes
            </li>
          </ul>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Decidir depois
          </Button>
          <Button 
            onClick={onUpgrade}
            disabled={loading}
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Crown className="h-4 w-4 mr-2" />
            )}
            Fazer Upgrade - R$ 49,99/mês
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FreeTrialBlockedModal;