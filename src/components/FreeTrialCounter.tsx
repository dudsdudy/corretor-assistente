import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, AlertTriangle } from "lucide-react";

interface FreeTrialCounterProps {
  studiesUsed: number;
  studiesRemaining: number;
  studiesLimit: number;
  isPremium: boolean;
  variant?: "compact" | "detailed";
}

const FreeTrialCounter = ({ 
  studiesUsed, 
  studiesRemaining, 
  studiesLimit, 
  isPremium,
  variant = "compact"
}: FreeTrialCounterProps) => {
  if (isPremium) {
    return (
      <Badge variant="default" className="bg-gradient-primary text-primary-foreground">
        <Crown className="h-3 w-3 mr-1" />
        Premium
      </Badge>
    );
  }

  const percentage = (studiesUsed / studiesLimit) * 100;
  const isWarning = studiesRemaining <= 1;

  if (variant === "compact") {
    return (
      <Badge 
        variant={studiesRemaining === 0 ? "destructive" : isWarning ? "secondary" : "outline"}
        className="flex items-center gap-1"
      >
        {studiesRemaining === 0 && <AlertTriangle className="h-3 w-3" />}
        {studiesRemaining} estudos restantes
      </Badge>
    );
  }

  return (
    <Card className="bg-muted/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Teste Grátis</h4>
          <Badge 
            variant={studiesRemaining === 0 ? "destructive" : isWarning ? "secondary" : "outline"}
          >
            {studiesUsed}/{studiesLimit} estudos
          </Badge>
        </div>
        
        <Progress 
          value={percentage} 
          className="h-2"
        />
        
        <div className="text-xs text-muted-foreground">
          {studiesRemaining === 0 ? (
            <div className="flex items-center gap-1 text-destructive font-medium">
              <AlertTriangle className="h-3 w-3" />
              Limite atingido - Assine para continuar
            </div>
          ) : (
            `${studiesRemaining} ${studiesRemaining === 1 ? 'estudo restante' : 'estudos restantes'}`
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FreeTrialCounter;