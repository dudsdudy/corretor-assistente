import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, FileText, Download, TrendingUp, Heart, Briefcase, Home, Building2, Edit3, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientAnalysis, CoverageRecommendation } from "./RecommendationDisplay";

interface EditableRecommendationDisplayProps {
  analysis: ClientAnalysis;
  onGeneratePDF?: () => void;
  onSaveAnalysis?: () => void;
}

interface EditableCoverage extends CoverageRecommendation {
  monthlyPremium?: number;
  isEditingTitle?: boolean;
  isEditingContent?: boolean;
}

interface BrokerInfo {
  name: string;
  email: string;
  logo?: string;
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
      return "bg-warning text-warning-foreground";
    case "low":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high":
      return "Alta";
    case "medium":
      return "Média";
    case "low":
      return "Baixa";
    default:
      return "Média";
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export default function EditableRecommendationDisplay({ 
  analysis, 
  onGeneratePDF, 
  onSaveAnalysis 
}: EditableRecommendationDisplayProps) {
  const [brokerInfo, setBrokerInfo] = useState<BrokerInfo | null>(null);
  const [coverages, setCoverages] = useState<EditableCoverage[]>([]);
  const [partnerBroker, setPartnerBroker] = useState("");
  const [summaryTitle, setSummaryTitle] = useState("Resumo de Coberturas");
  const [summaryContent, setSummaryContent] = useState("");
  const [isEditingSummaryTitle, setIsEditingSummaryTitle] = useState(false);
  const [isEditingSummaryContent, setIsEditingSummaryContent] = useState(false);

  useEffect(() => {
    const fetchBrokerInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, avatar_url')
            .eq('user_id', user.id)
            .single();

          setBrokerInfo({
            name: profile?.full_name || user.email?.split('@')[0] || 'Corretor',
            email: profile?.email || user.email || '',
            logo: profile?.avatar_url
          });
        }
      } catch (error) {
        console.error('Erro ao carregar informações do corretor:', error);
      }
    };

    fetchBrokerInfo();
  }, []);

  useEffect(() => {
    setCoverages(analysis.recommendedCoverages.map(coverage => ({
      ...coverage,
      monthlyPremium: 0,
      isEditingTitle: false,
      isEditingContent: false
    })));
    setSummaryContent(analysis.summary);
  }, [analysis]);

  const updateCoveragePremium = (index: number, premium: number) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, monthlyPremium: premium } : coverage
    ));
  };

  const toggleEditCoverageTitle = (index: number) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, isEditingTitle: !coverage.isEditingTitle } : coverage
    ));
  };

  const toggleEditCoverageContent = (index: number) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, isEditingContent: !coverage.isEditingContent } : coverage
    ));
  };

  const updateCoverageTitle = (index: number, newTitle: string) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, type: newTitle } : coverage
    ));
  };

  const updateCoverageJustification = (index: number, newJustification: string) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, justification: newJustification } : coverage
    ));
  };

  const totalCoverage = coverages.reduce((sum, coverage) => sum + coverage.amount, 0);
  const totalMonthlyPremium = coverages.reduce((sum, coverage) => sum + (coverage.monthlyPremium || 0), 0);

  const formatSummary = (summary: string) => {
    const sections = summary.split(/\*\*([^*]+)\*\*/g);
    const elements = [];
    
    for (let i = 0; i < sections.length; i += 2) {
      const content = sections[i];
      const title = sections[i + 1];
      
      if (content && content.trim()) {
        elements.push(
          <div key={i} className="mb-3">
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {content.trim()}
            </p>
          </div>
        );
      }
      
      if (title) {
        elements.push(
          <div key={i + 1} className="mb-2">
            <h4 className="font-semibold text-primary flex items-center gap-2 text-base">
              <span className="text-lg">📋</span>
              {title}
            </h4>
          </div>
        );
      }
    }
    
    return elements;
  };

  return (
    <div id="proposal-content" className="w-full max-w-6xl mx-auto space-y-6 print:space-y-4">
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
            {totalMonthlyPremium > 0 && (
              <p className="text-sm mt-1">
                <strong>Prêmio Total Mensal:</strong> {formatCurrency(totalMonthlyPremium)}
              </p>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Campo para Corretor Parceiro */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Configurações do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="partnerBroker">Corretor Parceiro (opcional)</Label>
              <Input
                id="partnerBroker"
                value={partnerBroker}
                onChange={(e) => setPartnerBroker(e.target.value)}
                placeholder="Nome do corretor parceiro"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Profile */}
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

      {/* Coverage Recommendations */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2 print:text-lg">
          <FileText className="h-6 w-6 text-primary" />
          Coberturas Recomendadas
        </h3>
        
        <div className="grid gap-4 print:gap-3">
          {coverages.map((coverage, index) => (
            <Card key={index} className="shadow-soft hover:shadow-medium transition-shadow print:shadow-none print:border print:break-inside-avoid">
              <CardContent className="p-4 print:p-3">
                <div className="space-y-4">
                  {/* Coverage header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary flex-shrink-0">
                        {getCoverageIcon(coverage.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {coverage.isEditingTitle ? (
                            <div className="flex items-center gap-2 print:hidden">
                              <Input
                                value={coverage.type}
                                onChange={(e) => updateCoverageTitle(index, e.target.value)}
                                className="text-lg font-semibold"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleEditCoverageTitle(index)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-lg print:text-base">{coverage.type}</h4>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleEditCoverageTitle(index)}
                                className="print:hidden h-6 w-6 p-0"
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                          <Badge className={`${getPriorityColor(coverage.priority)} text-xs`}>
                            {getPriorityLabel(coverage.priority)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {coverage.calculationBasis}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary print:text-xl">
                        {formatCurrency(coverage.amount)}
                      </p>
                      {coverage.monthlyPremium && coverage.monthlyPremium > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Prêmio: {formatCurrency(coverage.monthlyPremium)}/mês
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Premium input - hidden in print */}
                  <div className="print:hidden">
                    <Label htmlFor={`premium-${index}`}>Prêmio Mensal (R$)</Label>
                    <Input
                      id={`premium-${index}`}
                      type="number"
                      value={coverage.monthlyPremium || ''}
                      onChange={(e) => updateCoveragePremium(index, parseFloat(e.target.value) || 0)}
                      placeholder="0,00"
                      className="w-32"
                    />
                  </div>

                  {/* Justification */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h5 className="font-medium text-sm">Justificativa:</h5>
                      {!coverage.isEditingContent && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleEditCoverageContent(index)}
                          className="print:hidden h-6 w-6 p-0"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    {coverage.isEditingContent ? (
                      <div className="space-y-2 print:hidden">
                        <Textarea
                          value={coverage.justification}
                          onChange={(e) => updateCoverageJustification(index, e.target.value)}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => toggleEditCoverageContent(index)}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            Salvar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEditCoverageContent(index)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {coverage.justification}
                      </p>
                    )}
                  </div>

                  {coverage.riskFactors && coverage.riskFactors.length > 0 && (
                    <div>
                      <h5 className="font-medium text-sm mb-2">Fatores de Risco Considerados:</h5>
                      <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                        {coverage.riskFactors.map((factor, factorIndex) => (
                          <li key={factorIndex}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Executive Summary */}
      <Card className="shadow-medium print:shadow-none print:border">
        <CardHeader>
          <div className="flex items-center gap-2">
            {isEditingSummaryTitle ? (
              <div className="flex items-center gap-2 flex-1 print:hidden">
                <Input
                  value={summaryTitle}
                  onChange={(e) => setSummaryTitle(e.target.value)}
                  className="text-xl font-semibold"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingSummaryTitle(false)}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <FileText className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">{summaryTitle}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingSummaryTitle(true)}
                  className="print:hidden h-6 w-6 p-0"
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingSummaryContent ? (
            <div className="space-y-4 print:hidden">
              <Textarea
                value={summaryContent}
                onChange={(e) => setSummaryContent(e.target.value)}
                rows={10}
                className="min-h-[200px]"
              />
              <div className="flex gap-2">
                <Button onClick={() => setIsEditingSummaryContent(false)}>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSummaryContent(analysis.summary);
                    setIsEditingSummaryContent(false);
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end mb-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingSummaryContent(true)}
                  className="print:hidden"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
              <div className="prose prose-sm max-w-none">
                {formatSummary(summaryContent)}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Broker Info */}
      {partnerBroker && (
        <Card className="shadow-medium print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              🤝 Corretor Parceiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">{partnerBroker}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {(onGeneratePDF || onSaveAnalysis) && (
        <div className="flex flex-col sm:flex-row gap-4 pt-6 print:hidden border-t border-border">
          {onGeneratePDF && (
            <Button onClick={onGeneratePDF} size="lg" className="flex-1">
              <Download className="mr-2 h-5 w-5" />
              Gerar PDF
            </Button>
          )}
          {onSaveAnalysis && (
            <Button onClick={onSaveAnalysis} variant="outline" size="lg" className="flex-1">
              <FileText className="mr-2 h-5 w-5" />
              Salvar Análise
            </Button>
          )}
        </div>
      )}

      {/* Hidden elements for print footer */}
      <div className="hidden print:block print:fixed print:bottom-0 print:left-0 print:right-0 print:p-4 print:text-center print:text-xs print:bg-white print:border-t">
        <p>Este relatório foi gerado automaticamente e deve ser usado apenas como orientação inicial. Consulte sempre um corretor especializado.</p>
        <p>Data: {new Date().toLocaleDateString('pt-BR')} | Documento confidencial</p>
      </div>
    </div>
  );
}