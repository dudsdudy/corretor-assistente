import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, FileText, Download, TrendingUp, Heart, Briefcase, Home, Building2, Edit3, Save, X, Clock, GripVertical, DollarSign, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientAnalysis, CoverageRecommendation } from "./RecommendationDisplay";
import ProfessionalProposal from "./ProfessionalProposal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EditableRecommendationDisplayProps {
  analysis: ClientAnalysis;
  onGeneratePDF?: () => void;
  onSaveAnalysis?: (extendedData?: any) => void;
}

interface EditableCoverage extends CoverageRecommendation {
  id: string;
  monthlyPremium?: number;
  insurer?: string;
  customInsurerName?: string;
  isEditingTitle?: boolean;
  isEditingContent?: boolean;
  isEditingPriority?: boolean;
  isEditingPremium?: boolean;
  isCustom?: boolean;
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

// Sortable Coverage Card Component
function SortableCoverageCard({ 
  coverage, 
  index, 
  updateCoveragePremium, 
  updateCoverageField, 
  updateCoverageInsurer, 
  updateCoveragePriority, 
  toggleCoverageEdit, 
  togglePriorityEdit, 
  togglePremiumEdit,
  removeCoverage 
}: {
  coverage: EditableCoverage;
  index: number;
  updateCoveragePremium: (index: number, premium: number) => void;
  updateCoverageField: (index: number, field: 'type' | 'justification', value: string) => void;
  updateCoverageInsurer: (index: number, insurer: string, customName?: string) => void;
  updateCoveragePriority: (index: number, priority: "high" | "medium" | "low") => void;
  toggleCoverageEdit: (index: number, field: 'title' | 'content') => void;
  togglePriorityEdit: (index: number) => void;
  togglePremiumEdit: (index: number) => void;
  removeCoverage: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: coverage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="shadow-soft">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="cursor-grab active:cursor-grabbing print:hidden"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                {getCoverageIcon(coverage.type)}
              </div>
              <div className="flex-1">
                {coverage.isEditingTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={coverage.type}
                      onChange={(e) => updateCoverageField(index, 'type', e.target.value)}
                      className="font-semibold text-lg"
                    />
                    <Button 
                      size="sm" 
                      onClick={() => toggleCoverageEdit(index, 'title')}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{coverage.type}</h4>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => toggleCoverageEdit(index, 'title')}
                      className="print:hidden"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {coverage.isEditingPriority ? (
                  <div className="flex items-center gap-2 mt-1">
                     <Select
                       value={coverage.priority}
                       onValueChange={(value: "high" | "medium" | "low") => updateCoveragePriority(index, value)}
                     >
                      <SelectTrigger className="w-24 h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="low">Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      size="sm" 
                      onClick={() => togglePriorityEdit(index)}
                      className="h-6 px-2"
                    >
                      <Save className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getPriorityColor(coverage.priority)} text-xs`}>
                      {getPriorityLabel(coverage.priority)}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => togglePriorityEdit(index)}
                      className="print:hidden h-6 px-1"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <div>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(coverage.amount)}
                  </p>
                  {coverage.monthlyPremium && coverage.monthlyPremium > 0 && (
                    <div className="flex items-center gap-1">
                      <p className="text-sm text-muted-foreground">
                        Prêmio: {formatCurrency(coverage.monthlyPremium)}/mês
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => togglePremiumEdit(index)}
                        className="print:hidden h-5 px-1"
                      >
                        <DollarSign className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  {coverage.insurer && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {coverage.insurer === "Outros" ? coverage.customInsurerName : coverage.insurer}
                    </p>
                  )}
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive print:hidden"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Cobertura</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a cobertura "{coverage.type}"? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeCoverage(index)}>
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <div className="print:hidden grid grid-cols-2 gap-4">
            <div>
              <Label>Prêmio Mensal (R$)</Label>
              {coverage.isEditingPremium ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={coverage.monthlyPremium || ''}
                    onChange={(e) => updateCoveragePremium(index, parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => togglePremiumEdit(index)}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={coverage.monthlyPremium || ''}
                    onChange={(e) => updateCoveragePremium(index, parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    disabled
                  />
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => togglePremiumEdit(index)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div>
              <Label>Seguradora</Label>
              <div className="space-y-2">
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
                {coverage.insurer === "Outros" && (
                  <Input
                    placeholder="Nome da seguradora"
                    value={coverage.customInsurerName || ''}
                    onChange={(e) => updateCoverageInsurer(index, "Outros", e.target.value)}
                  />
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-sm">Justificativa:</h5>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => toggleCoverageEdit(index, 'content')}
                className="print:hidden"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            </div>
            {coverage.isEditingContent ? (
              <div className="space-y-2">
                <Textarea
                  value={coverage.justification}
                  onChange={(e) => updateCoverageField(index, 'justification', e.target.value)}
                  rows={4}
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => toggleCoverageEdit(index, 'content')}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => toggleCoverageEdit(index, 'content')}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{coverage.justification}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [pdfGenerationTime, setPdfGenerationTime] = useState(0);
  const [hoursSaved, setHoursSaved] = useState(0);
  const [clientSalary, setClientSalary] = useState(0);
  const [newCoverageType, setNewCoverageType] = useState("");
  const [newCoverageAmount, setNewCoverageAmount] = useState(0);
  const [newCoverageJustification, setNewCoverageJustification] = useState("");

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
    let timer: NodeJS.Timeout | null = null;
    if (isGeneratingPDF) {
      timer = setInterval(() => {
        setPdfGenerationTime(prev => prev + 1);
      }, 1000);
    } else {
      setPdfGenerationTime(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGeneratingPDF]);

  const handleGeneratePDF = async () => {
    if (!onGeneratePDF) return;
    
    setIsGeneratingPDF(true);
    try {
      await onGeneratePDF();
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const updateCoveragePremium = (index: number, premium: number) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, monthlyPremium: premium } : coverage
    ));
  };

  const toggleTitleEdit = () => {
    setIsEditingSummaryTitle(!isEditingSummaryTitle);
  };

  const saveTitleEdit = () => {
    setIsEditingSummaryTitle(false);
  };

  const toggleContentEdit = () => {
    setIsEditingSummaryContent(!isEditingSummaryContent);
  };

  const saveContentEdit = () => {
    setIsEditingSummaryContent(false);
  };

  const toggleCoverageEdit = (index: number, field: 'title' | 'content') => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { 
        ...coverage, 
        [`isEditing${field === 'title' ? 'Title' : 'Content'}`]: !coverage[`isEditing${field === 'title' ? 'Title' : 'Content'}`]
      } : coverage
    ));
  };

  const updateCoverageField = (index: number, field: 'type' | 'justification', value: string) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, [field]: value } : coverage
    ));
  };

  const updateCoverageInsurer = (index: number, insurer: string, customName?: string) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { 
        ...coverage, 
        insurer: insurer,
        customInsurerName: customName || coverage.customInsurerName
      } : coverage
    ));
  };

  const updateCoveragePriority = (index: number, priority: "high" | "medium" | "low") => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, priority: priority } : coverage
    ));
  };

  const togglePriorityEdit = (index: number) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, isEditingPriority: !coverage.isEditingPriority } : coverage
    ));
  };

  const togglePremiumEdit = (index: number) => {
    setCoverages(prev => prev.map((coverage, i) => 
      i === index ? { ...coverage, isEditingPremium: !coverage.isEditingPremium } : coverage
    ));
  };

  const addCustomCoverage = () => {
    if (!newCoverageType || !newCoverageAmount) return;
    
    const customCoverage: EditableCoverage = {
      id: `custom-coverage-${Date.now()}`,
      type: newCoverageType,
      amount: newCoverageAmount,
      justification: newCoverageJustification,
      priority: "medium" as const,
      calculationBasis: "Personalizada",
      riskFactors: [],
      monthlyPremium: 0,
      insurer: "",
      customInsurerName: "",
      isEditingTitle: false,
      isEditingContent: false,
      isEditingPriority: false,
      isEditingPremium: false,
      isCustom: true
    };

    setCoverages(prev => [...prev, customCoverage]);
    setNewCoverageType("");
    setNewCoverageAmount(0);
    setNewCoverageJustification("");
  };

  const removeCoverage = (index: number) => {
    setCoverages(prev => prev.filter((_, i) => i !== index));
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setCoverages((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const totalCoverage = coverages.reduce((sum, coverage) => sum + coverage.amount, 0);
  const totalMonthlyPremium = coverages.reduce((sum, coverage) => sum + (coverage.monthlyPremium || 0), 0);

  const handleSaveWithExtendedData = () => {
    if (onSaveAnalysis) {
      const extendedData = {
        coverages: coverages,
        clientSalary: clientSalary,
        totalMonthlyPremium: totalMonthlyPremium,
        partnerBroker: partnerBroker,
        quotationValidity: quotationValidity
      };
      onSaveAnalysis(extendedData);
    }
  };

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
          
          <div className="mt-4">
            <Label htmlFor="clientSalary">Salário do Cliente (R$)</Label>
            <Input
              id="clientSalary"
              type="number"
              value={clientSalary}
              onChange={(e) => setClientSalary(parseFloat(e.target.value) || 0)}
              placeholder="Salário mensal"
            />
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
          <Button 
            onClick={handleGeneratePDF} 
            disabled={isGeneratingPDF}
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            {isGeneratingPDF ? (
              <>
                Gerando PDF... {pdfGenerationTime}s
              </>
            ) : (
              "Gerar PDF"
            )}
          </Button>
        )}
        
        {onSaveAnalysis && (
          <Button onClick={handleSaveWithExtendedData} variant="outline" className="flex items-center gap-2">
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
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                {isEditingSummaryTitle ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={summaryTitle}
                      onChange={(e) => setSummaryTitle(e.target.value)}
                      className="text-xl font-semibold"
                    />
                    <Button size="sm" onClick={saveTitleEdit}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={toggleTitleEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>{summaryTitle}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={toggleTitleEdit}
                      className="print:hidden"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </h3>
            </div>

            {/* Summary Content with Edit Functionality */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Resumo Executivo</CardTitle>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={toggleContentEdit}
                    className="print:hidden"
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isEditingSummaryContent ? (
                  <div className="space-y-4">
                    <Textarea
                      value={summaryContent}
                      onChange={(e) => setSummaryContent(e.target.value)}
                      rows={8}
                      className="min-h-[200px]"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveContentEdit}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                      <Button size="sm" variant="outline" onClick={toggleContentEdit}>
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {summaryContent}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <h4 className="text-lg font-medium text-gray-800 mb-4">Coberturas Individuais (Visão do Corretor)</h4>
            
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={coverages.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {coverages.map((coverage, index) => (
                    <SortableCoverageCard
                      key={coverage.id}
                      coverage={coverage}
                      index={index}
                      updateCoveragePremium={updateCoveragePremium}
                      updateCoverageField={updateCoverageField}
                      updateCoverageInsurer={updateCoverageInsurer}
                      updateCoveragePriority={updateCoveragePriority}
                      toggleCoverageEdit={toggleCoverageEdit}
                      togglePriorityEdit={togglePriorityEdit}
                      togglePremiumEdit={togglePremiumEdit}
                      removeCoverage={removeCoverage}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add Custom Coverage Card - Moved to end */}
            <Card className="print:hidden mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Adicionar Cobertura Personalizada
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newCoverageType">Tipo de Cobertura</Label>
                    <Input
                      id="newCoverageType"
                      value={newCoverageType}
                      onChange={(e) => setNewCoverageType(e.target.value)}
                      placeholder="Ex: Cobertura Adicional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newCoverageAmount">Valor da Cobertura (R$)</Label>
                    <Input
                      id="newCoverageAmount"
                      type="number"
                      value={newCoverageAmount}
                      onChange={(e) => setNewCoverageAmount(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="newCoverageJustification">Justificativa</Label>
                  <Textarea
                    id="newCoverageJustification"
                    value={newCoverageJustification}
                    onChange={(e) => setNewCoverageJustification(e.target.value)}
                    placeholder="Por que esta cobertura é importante..."
                    rows={3}
                  />
                </div>
                <div className="mt-4">
                  <Button 
                    onClick={addCustomCoverage}
                    disabled={!newCoverageType || !newCoverageAmount}
                    className="w-full"
                  >
                    Adicionar Cobertura
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}