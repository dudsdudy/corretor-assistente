import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, FileText, Download, TrendingUp, Heart, Briefcase, Home } from "lucide-react";

export interface CoverageRecommendation {
  type: string;
  amount: number;
  premium: number;
  justification: string;
  priority: "high" | "medium" | "low";
}

export interface ClientAnalysis {
  clientName: string;
  riskProfile: string;
  recommendedCoverages: CoverageRecommendation[];
  totalPremium: number;
  summary: string;
}

interface RecommendationDisplayProps {
  analysis: ClientAnalysis;
  onGeneratePDF?: () => void;
  onSaveAnalysis?: () => void;
}

const getCoverageIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "morte":
      return <Shield className="h-5 w-5" />;
    case "invalidez":
    case "ipta":
      return <Shield className="h-5 w-5" />;
    case "doenças graves":
    case "dg":
      return <Heart className="h-5 w-5" />;
    case "diária":
    case "dit":
      return <Briefcase className="h-5 w-5" />;
    case "funeral":
      return <Home className="h-5 w-5" />;
    default:
      return <Shield className="h-5 w-5" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "bg-destructive text-destructive-foreground";
    case "medium":
      return "bg-accent text-accent-foreground";
    case "low":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high":
      return "Alta Prioridade";
    case "medium":
      return "Prioridade Média";
    case "low":
      return "Baixa Prioridade";
    default:
      return "Prioridade Média";
  }
};

const RecommendationDisplay = ({ 
  analysis, 
  onGeneratePDF, 
  onSaveAnalysis 
}: RecommendationDisplayProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="shadow-strong bg-gradient-hero text-primary-foreground">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <TrendingUp className="h-7 w-7" />
            Análise Personalizada de Seguro de Vida
          </CardTitle>
          <CardDescription className="text-primary-foreground/80 text-lg">
            Recomendações para <strong>{analysis.clientName}</strong>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Risk Profile */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Perfil de Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div />
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Prêmio Total Estimado</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(analysis.totalPremium)}/mês
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Recommendations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Coberturas Recomendadas
        </h3>
        
        {analysis.recommendedCoverages.map((coverage, index) => (
          <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {getCoverageIcon(coverage.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg">{coverage.type}</h4>
                    <Badge className={getPriorityColor(coverage.priority)}>
                      {getPriorityLabel(coverage.priority)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-success">
                    {formatCurrency(coverage.amount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(coverage.premium)}/mês
                  </p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="bg-muted/30 p-4 rounded-lg">
                <h5 className="font-medium mb-2 text-primary">Por que recomendamos:</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {coverage.justification}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card className="shadow-medium bg-gradient-card">
        <CardHeader>
          <CardTitle className="text-primary">Resumo da Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            {analysis.summary}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          onClick={onGeneratePDF}
          variant="hero"
          size="lg"
          className="flex-1 min-w-[200px]"
        >
          <Download className="h-5 w-5 mr-2" />
          Gerar PDF da Proposta
        </Button>
        <Button
          onClick={onSaveAnalysis}
          variant="premium"
          size="lg"
          className="flex-1 min-w-[200px]"
        >
          <FileText className="h-5 w-5 mr-2" />
          Salvar Análise
        </Button>
      </div>
    </div>
  );
};

export default RecommendationDisplay;