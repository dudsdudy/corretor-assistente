import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, FileText, Download, TrendingUp, Heart, Briefcase, Home, Building2, Edit3, Save, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientAnalysis, CoverageRecommendation } from "./RecommendationDisplay";
import ProfessionalProposal from "./ProfessionalProposal";

interface EditableRecommendationDisplayProps {
  analysis: ClientAnalysis;
  onGeneratePDF?: () => void;
  onSaveAnalysis?: () => void;
}

interface EditableCoverage extends CoverageRecommendation {
  monthlyPremium?: number;
  insurer?: string;
  isEditingTitle?: boolean;
  isEditingContent?: boolean;
}

const BRAZILIAN_INSURERS = [
  "Bradesco Seguros", "Itaú Seguros", "Porto Seguro", "SulAmérica", "Icatu Seguros",
  "MetLife", "Zurich", "Mapfre", "Liberty Seguros", "Tokio Marine", "Allianz", "HDI Seguros", "AXA", "Chubb", "Generali", "Outros"
];

interface BrokerInfo {
  name: string;
  email: string;
  logo?: string;
}

const getCoverageIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "morte": return <Shield className="h-6 w-6" />;
    case "invalidez": case "invalidez permanente (ipta)": case "ipta": return <Shield className="h-6 w-6" />;
    case "doenças graves": case "dg": return <Heart className="h-6 w-6" />;
    case "diária": case "diária por incapacidade (dit)": case "dit": return <Briefcase className="h-6 w-6" />;
    case "funeral": return <Home className="h-6 w-6" />;
    default: return <Shield className="h-6 w-6" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high": return "bg-destructive text-destructive-foreground";
    case "medium": return "bg-warning text-warning-foreground";
    case "low": return "bg-muted text-muted-foreground";
    default: return "bg-muted text-muted-foreground";
  }
};

const getPriorityLabel = (priority: string) => {
  switch (priority) {
    case "high": return "Alta";
    case "medium": return "Média";
    case "low": return "Baixa";
    default: return "Média";
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export default function EditableRecommendationDisplay({ analysis, onGeneratePDF, onSaveAnalysis }: EditableRecommendationDisplayProps) {
  const [brokerInfo, setBrokerInfo] = useState<BrokerInfo | null>(null);
  const [coverages, setCoverages] = useState<EditableCoverage[]>([]);
  const [partnerBroker, setPartnerBroker] = useState("");
  const [summaryTitle, setSummaryTitle] = useState("Resumo de Coberturas");
  const [summaryContent, setSummaryContent] = useState("");
  const [isEditingSummaryTitle, setIsEditingSummaryTitle] = useState(false);
  const [isEditingSummaryContent, setIsEditingSummaryContent] = useState(false);
  const [quotationValidity, setQuotationValidity] = useState("30 dias");
  const [showProfessionalProposal, setShowProfessionalProposal] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(0);

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
      insurer: "",
      isEditingTitle: false,
      isEditingContent: false
    })));
    setSummaryContent(analysis.summary);
    setHoursSaved(3.5);
  }, [analysis]);

  const updateCoveragePremium = (index: number, premium: number) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, monthlyPremium: premium } : coverage
    ));
  };

  const updateCoverageInsurer = (index: number, insurer: string) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, insurer: insurer } : coverage
    ));
  };

  const totalCoverage = coverages.reduce((sum, coverage) => sum + coverage.amount, 0);
  const totalMonthlyPremium = coverages.reduce((sum, coverage) => sum + (coverage.monthlyPremium || 0), 0);

  return (
    <div id="proposal-content" className="w-full max-w-6xl mx-auto space-y-6 print:space-y-4">
      {/* Header */}
      <Card className="shadow-strong bg-gradient-hero text-primary-foreground print:shadow-none">
        <CardHeader className="text-center pb-6">
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

      {/* Configuration Card */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Configurações da Proposta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="partnerBroker">Corretor Parceiro (opcional)</Label>
              <Input
                id="partnerBroker"
                value={partnerBroker}
                onChange={(e) => setPartnerBroker(e.target.value)}
                placeholder="Nome do corretor parceiro"
              />
            </div>
            <div>
              <Label htmlFor="quotationValidity">Validade da Cotação</Label>
              <Input
                id="quotationValidity"
                value={quotationValidity}
                onChange={(e) => setQuotationValidity(e.target.value)}
                placeholder="Ex: 30 dias"
              />
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 rounded-full p-2">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Tempo Economizado</h4>
                <p className="text-sm text-gray-600">
                  Você economizou aproximadamente <strong className="text-green-600">{hoursSaved} horas</strong> em análise e montagem desta proposta!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 print:hidden">
        <Button 
          onClick={() => setShowProfessionalProposal(!showProfessionalProposal)}
          className="flex items-center gap-2"
          variant={showProfessionalProposal ? "secondary" : "default"}
        >
          <FileText className="h-4 w-4" />
          {showProfessionalProposal ? "Ver Resumo Interno" : "Ver Proposta Profissional"}
        </Button>
        
        {onGeneratePDF && (
          <Button onClick={onGeneratePDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Gerar PDF
          </Button>
        )}
        
        {onSaveAnalysis && (
          <Button onClick={onSaveAnalysis} variant="outline" className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Salvar Estudo
          </Button>
        )}
      </div>

      {/* Render Professional Proposal or Internal Summary */}
      {showProfessionalProposal ? (
        <ProfessionalProposal 
          analysis={analysis}
          partnerBroker={partnerBroker}
          quotationValidity={quotationValidity}
          coveragesWithPremiums={coverages.map(coverage => ({
            ...coverage,
            monthlyPremium: coverage.monthlyPremium || 0,
            insurer: coverage.insurer || ""
          }))}
        />
      ) : (
        <div className="space-y-6">
          {/* Internal Coverage View */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Coberturas Recomendadas (Visão do Corretor)
            </h3>
            
            {coverages.map((coverage, index) => (
              <Card key={index} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          {getCoverageIcon(coverage.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">{coverage.type}</h4>
                          <Badge className={`${getPriorityColor(coverage.priority)} text-xs`}>
                            {getPriorityLabel(coverage.priority)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(coverage.amount)}
                        </p>
                        {coverage.monthlyPremium && coverage.monthlyPremium > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Prêmio: {formatCurrency(coverage.monthlyPremium)}/mês
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="print:hidden grid grid-cols-2 gap-4">
                      <div>
                        <Label>Prêmio Mensal (R$)</Label>
                        <Input
                          type="number"
                          value={coverage.monthlyPremium || ''}
                          onChange={(e) => updateCoveragePremium(index, parseFloat(e.target.value) || 0)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label>Seguradora</Label>
                        <Select
                          value={coverage.insurer || ''}
                          onValueChange={(value) => updateCoverageInsurer(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a seguradora" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRAZILIAN_INSURERS.map((insurer) => (
                              <SelectItem key={insurer} value={insurer}>
                                {insurer}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-sm mb-2">Justificativa:</h5>
                      <p className="text-sm text-muted-foreground">{coverage.justification}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}