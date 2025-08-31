import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, AlertTriangle, Zap, Target } from "lucide-react";

interface FreeTrialCounterProps {
  studiesUsed: number;
  studiesRemaining: number;
  studiesLimit: number;
  isPremium: boolean;
  variant?: "compact" | "detailed" | "header";
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
      <Badge variant="default" className="bg-gradient-primary text-primary-foreground animate-pulse">
        <Crown className="h-3 w-3 mr-1" />
        Premium - Estudos Ilimitados
      </Badge>
    );
  }

  const percentage = (studiesUsed / studiesLimit) * 100;
  const isWarning = studiesRemaining <= 1;
  const isAtLimit = studiesRemaining === 0;

  if (variant === "compact") {
    return (
      <Badge 
        variant={isAtLimit ? "destructive" : isWarning ? "secondary" : "outline"}
        className="flex items-center gap-1 animate-in fade-in-50"
      >
        {isAtLimit && <AlertTriangle className="h-3 w-3 animate-pulse" />}
        {!isAtLimit && <Target className="h-3 w-3" />}
        {studiesRemaining} estudos restantes
      </Badge>
    );
  }

  if (variant === "header") {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-center gap-1">
          {isAtLimit ? (
            <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
          ) : (
            <Zap className="h-4 w-4 text-primary" />
          )}
          <span className="text-sm font-medium">
            {isAtLimit ? "Limite Atingido" : `${studiesRemaining} estudos restantes`}
          </span>
        </div>
        {!isAtLimit && (
          <div className="flex-1 min-w-16">
            <Progress value={percentage} className="h-2" />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-muted/50 to-accent/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Teste Grátis
          </span>
          <Badge 
            variant={isAtLimit ? "destructive" : isWarning ? "secondary" : "outline"}
            className="text-xs"
          >
            {studiesUsed}/{studiesLimit} estudos
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        <Progress 
          value={percentage} 
          className="h-3"
        />
        
        <div className="text-xs">
          {isAtLimit ? (
            <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20">
              <AlertTriangle className="h-4 w-4 text-destructive animate-pulse" />
              <div className="text-destructive font-medium">
                Limite atingido! Assine para continuar gerando estudos profissionais.
              </div>
            </div>
          ) : isWarning ? (
            <div className="flex items-center gap-2 p-2 rounded-md bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/30">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <div className="text-orange-700 dark:text-orange-300 font-medium">
                Atenção! Apenas {studiesRemaining} estudo restante.
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground">
              Você tem <span className="font-medium text-primary">{studiesRemaining} estudos gratuitos</span> para descobrir o poder do Corretor Consultor!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FreeTrialCounter;