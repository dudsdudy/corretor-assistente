import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, FileText, Download, TrendingUp, Heart, Briefcase, Home, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface CoverageRecommendation {
  type: string;
  amount: number;
  justification: string;
  priority: "high" | "medium" | "low";
  riskFactors: string[];
  calculationBasis: string;
}

export interface ClientAnalysis {
  clientName: string;
  riskProfile: string;
  recommendedCoverages: CoverageRecommendation[];
  summary: string;
  analysisDetails: {
    ageRiskFactor: number;
    healthRiskFactor: number;
    professionRiskFactor: number;
    dependentsImpact: number;
  };
}

interface RecommendationDisplayProps {
  analysis: ClientAnalysis;
  onGeneratePDF?: () => void;
  onSaveAnalysis?: () => void;
}

const getCoverageIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "morte":
      return <Shield className="h-6 w-6" />;
    case "invalidez":
    case "invalidez permanente (ipta)":
    case "ipta":
      return <Shield className="h-6 w-6" />;
    case "doenças graves":
    case "dg":
      return <Heart className="h-6 w-6" />;
    case "diária":
    case "diária por incapacidade (dit)":
    case "dit":
      return <Briefcase className="h-6 w-6" />;
    case "funeral":
      return <Home className="h-6 w-6" />;
    default:
      return <Shield className="h-6 w-6" />;
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
      return "🔴 ALTA PRIORIDADE";
    case "medium":
      return "🟡 PRIORIDADE MÉDIA";
    case "low":
      return "🟢 BAIXA PRIORIDADE";
    default:
      return "🟡 PRIORIDADE MÉDIA";
  }
};

const RecommendationDisplay = ({ 
  analysis, 
  onGeneratePDF, 
  onSaveAnalysis 
}: RecommendationDisplayProps) => {
  const [brokerInfo, setBrokerInfo] = useState<any>(null);

  useEffect(() => {
    const getBrokerInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setBrokerInfo({
          name: profile?.full_name || user?.user_metadata?.full_name || "Corretor Consultor",
          email: user.email,
          logo: profile?.avatar_url
        });
      }
    };
    getBrokerInfo();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatSummary = (summary: string) => {
    // Remove asteriscos e formatação markdown inadequada
    let formatted = summary
      .replace(/\*\*/g, '') // Remove asteriscos duplos
      .replace(/\*/g, '') // Remove asteriscos simples
      .replace(/#{1,6}\s*/g, '') // Remove markdown headers
      .replace(/^\s*[\•\-\*]\s*/gm, '• ') // Normaliza bullets
      .trim();
    
    // Quebra em seções mais legíveis
    const sections = formatted.split(/\n\n+/);
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) return null;
      
      // Identifica se é uma seção com título
      const firstLine = lines[0];
      const isSection = firstLine.includes(':') && !firstLine.startsWith('•');
      
      if (isSection) {
        const [title, ...content] = firstLine.split(':');
        const restLines = lines.slice(1);
        
        return (
          <div key={index} className="mb-6">
            <h4 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
              {getIconForSection(title.trim())}
              {title.trim()}
            </h4>
            {content.length > 0 && (
              <p className="text-muted-foreground mb-2 leading-relaxed">
                {content.join(':').trim()}
              </p>
            )}
            {restLines.map((line, idx) => (
              <p key={idx} className="text-muted-foreground mb-1 leading-relaxed">
                {line.trim()}
              </p>
            ))}
          </div>
        );
      } else {
        return (
          <div key={index} className="mb-4">
            {lines.map((line, idx) => (
              <p key={idx} className="text-muted-foreground mb-2 leading-relaxed">
                {line.trim()}
              </p>
            ))}
          </div>
        );
      }
    }).filter(Boolean);
  };

  const getIconForSection = (title: string) => {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('perfil') || titleLower.includes('cliente')) return "👤";
    if (titleLower.includes('risco') || titleLower.includes('fator')) return "⚠️";
    if (titleLower.includes('cobertura') || titleLower.includes('recomenda')) return "📋";
    if (titleLower.includes('investimento') || titleLower.includes('total')) return "💰";
    if (titleLower.includes('essencial') || titleLower.includes('importante')) return "🎯";
    if (titleLower.includes('próximo') || titleLower.includes('passo')) return "📝";
    if (titleLower.includes('corretor') || titleLower.includes('parceiro')) return "🤝";
    return "📄";
  };

  const totalCoverage = analysis.recommendedCoverages.reduce((sum, coverage) => sum + coverage.amount, 0);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 print:space-y-4">
      {/* Header com informações do corretor */}
      <Card className="shadow-strong bg-gradient-hero text-primary-foreground print:shadow-none">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {brokerInfo?.logo && (
                <img 
                  src={brokerInfo.logo} 
                  alt="Logo" 
                  className="h-12 w-12 rounded-lg object-contain bg-white/10 p-1"
                />
              )}
              <div className="text-left">
                <p className="text-sm opacity-90">Apresentado por:</p>
                <p className="font-semibold">{brokerInfo?.name || "Carregando..."}</p>
                <p className="text-xs opacity-75">{brokerInfo?.email}</p>
              </div>
            </div>
            <div className="text-right">
              <Building2 className="h-8 w-8 mx-auto mb-1" />
              <p className="text-xs opacity-75">Estudo Personalizado</p>
            </div>
          </div>
          
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <TrendingUp className="h-8 w-8" />
            Análise de Seguro de Vida
          </CardTitle>
          <CardDescription className="text-primary-foreground/90 text-xl font-medium">
            Recomendações personalizadas para <strong>{analysis.clientName}</strong>
          </CardDescription>
          <div className="mt-4 bg-white/10 rounded-lg p-3">
            <p className="text-sm">
              <strong>Perfil de Risco:</strong> {analysis.riskProfile} | 
              <strong> Total Recomendado:</strong> {formatCurrency(totalCoverage)}
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Risk Profile - Mais compacto */}
      <Card className="shadow-medium print:shadow-none print:border">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-primary" />
            Análise de Fatores de Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium">Idade</p>
              <p className="text-xl font-bold text-primary">
                {(analysis.analysisDetails.ageRiskFactor * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium">Saúde</p>
              <p className="text-xl font-bold text-primary">
                {(analysis.analysisDetails.healthRiskFactor * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium">Profissão</p>
              <p className="text-xl font-bold text-primary">
                {(analysis.analysisDetails.professionRiskFactor * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground font-medium">Dependentes</p>
              <p className="text-xl font-bold text-primary">
                +{(analysis.analysisDetails.dependentsImpact * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coverage Recommendations - Layout otimizado */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2 print:text-lg">
          <FileText className="h-6 w-6 text-primary" />
          Coberturas Recomendadas
        </h3>
        
        <div className="grid gap-4 print:gap-3">
          {analysis.recommendedCoverages.map((coverage, index) => (
            <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow print:shadow-none print:border print:break-inside-avoid">
              <CardContent className="p-4 print:p-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left side - Coverage info */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                      {getCoverageIcon(coverage.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-lg print:text-base">{coverage.type}</h4>
                        <Badge className={`${getPriorityColor(coverage.priority)} text-xs`}>
                          {getPriorityLabel(coverage.priority)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {coverage.calculationBasis}
                      </p>
                    </div>
                  </div>
                  
                  {/* Right side - Amount */}
                  <div className="text-center md:text-right flex-shrink-0">
                    <p className="text-2xl md:text-3xl font-bold text-success print:text-xl">
                      {formatCurrency(coverage.amount)}
                    </p>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                {/* Justification */}
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium mb-2 text-primary text-sm">Por que recomendamos:</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {coverage.justification}
                    </p>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2 text-primary text-sm">Fatores considerados:</h5>
                    <div className="flex flex-wrap gap-1">
                      {coverage.riskFactors.map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary - Formatação melhorada */}
      <Card className="shadow-medium bg-gradient-card print:shadow-none print:border print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="text-primary text-xl">Resumo Executivo da Análise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none text-muted-foreground">
            {formatSummary(analysis.summary)}
          </div>
        </CardContent>
      </Card>

      {/* Actions - Só na tela, não no PDF */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
        <Button
          onClick={onGeneratePDF}
          variant="hero"
          size="lg"
          className="flex-1 max-w-xs"
        >
          <Download className="h-5 w-5 mr-2" />
          Gerar PDF
        </Button>
        <Button
          onClick={onSaveAnalysis}
          variant="premium"
          size="lg"
          className="flex-1 max-w-xs"
        >
          <FileText className="h-5 w-5 mr-2" />
          Salvar Análise
        </Button>
      </div>

      {/* Footer para PDF */}
      <div className="hidden print:block text-center pt-6 border-t">
        <p className="text-xs text-muted-foreground">
          Estudo gerado em {new Date().toLocaleDateString('pt-BR')} por {brokerInfo?.name} | {brokerInfo?.email}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Este é um estudo orientativo. Valores e condições podem variar conforme seguradora e análise médica.
        </p>
      </div>
    </div>
  );
};

export default RecommendationDisplay;