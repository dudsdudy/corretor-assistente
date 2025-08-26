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
          <div className="mx-auto p-3 bg-gradient-primary rounded-full w-fit animate-pulse">
            <Crown className="h-8 w-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            🚀 TRANSFORME SUA CARREIRA AGORA!
          </DialogTitle>
          <DialogDescription className="text-base">
            <span className="text-lg font-semibold text-foreground">Você provou que funciona!</span>
            <br />
            Seus primeiros estudos mostraram o poder da nossa metodologia.
            <br />
            <span className="text-primary font-medium">Continue dominando o mercado com o plano PRO!</span>
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

        <div className="bg-gradient-to-r from-success/10 to-accent/10 rounded-lg p-4 border-l-4 border-success">
          <h5 className="font-semibold mb-3 text-success">💰 RESULTADOS COMPROVADOS EM APENAS 3 ESTUDOS:</h5>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="font-medium">+300% mais profissional</span> que uma apresentação básica
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="font-medium">Clientes impressionados</span> com a qualidade técnica
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="font-medium">Método que fecha mais vendas</span> comprovadamente
            </li>
          </ul>
          <div className="mt-3 p-2 bg-accent/20 rounded text-center">
            <p className="text-sm font-semibold text-accent">
              🔥 Imagine o que você fará com ESTUDOS ILIMITADOS!
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Decidir depois
          </Button>
          <Button 
            onClick={onUpgrade}
            disabled={loading}
            className="bg-gradient-to-r from-success to-accent text-white hover:scale-105 transition-transform shadow-strong font-semibold text-lg px-8 py-6"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <Crown className="h-5 w-5 mr-2" />
            )}
            🚀 EXPLODIR DE VENDER - R$ 49,99/mês
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FreeTrialBlockedModal;