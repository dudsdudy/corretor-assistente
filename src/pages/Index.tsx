import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Session } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { useIsMobile } from "@/hooks/use-mobile";
import { insuranceCalculator } from "@/services/insuranceCalculator";
import { 
  Mic, 
  Edit, 
  Shield, 
  LogOut, 
  Database, 
  Kanban, 
  Settings,
  TrendingUp,
  FileBarChart,
  Menu,
  X
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationBadge from "@/components/NotificationBadge";
import FreeTrialCounter from "@/components/FreeTrialCounter";
import FreeTrialBlockedModal from "@/components/FreeTrialBlockedModal";
import heroImage from "@/assets/hero-insurance.jpg";
import ClientDataForm, { ClientData } from "@/components/ClientDataForm";
import VoiceInput from "@/components/VoiceInput";
import RecommendationDisplay, { ClientAnalysis } from "@/components/RecommendationDisplay";
import EditableRecommendationDisplay from "@/components/EditableRecommendationDisplay";
import AppHeader from "@/components/AppHeader";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputMode, setInputMode] = useState<"choice" | "voice" | "form" | "results">("choice");
  const [analysis, setAnalysis] = useState<ClientAnalysis | null>(null);
  const [originalClientData, setOriginalClientData] = useState<ClientData | null>(null);
  const [processingAnalysis, setProcessingAnalysis] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Free trial hook
  const freeTrialStatus = useFreeTrial(user);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !session) {
      navigate("/auth");
    }
  }, [session, loading, navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const generateMockAnalysis = (clientData: ClientData): ClientAnalysis => {
    return insuranceCalculator.calculateInsuranceRecommendations(clientData);
  };

  const handleFormSubmit = async (clientData: ClientData) => {
    // Check if user can create more studies
    if (!freeTrialStatus.canCreateStudy) {
      setShowUpgradeModal(true);
      return;
    }

    setProcessingAnalysis(true);
    
    // Store the client data for later use
    setOriginalClientData(clientData);
    console.log("Processando análise para cliente:", clientData);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysisResult = generateMockAnalysis(clientData);
    console.log("Análise gerada:", analysisResult);
    
    // Increment study count
    const canContinue = await freeTrialStatus.incrementStudyCount();
    
    if (!canContinue && !freeTrialStatus.isPremium) {
      // This will trigger the upgrade modal after showing results
      setTimeout(() => setShowUpgradeModal(true), 3000);
    }
    
    setAnalysis(analysisResult);
    setInputMode("results");
    setProcessingAnalysis(false);
    
    toast({
      title: "Análise concluída!",
      description: "Recomendações personalizadas geradas com sucesso.",
    });
  };

  const extractClientDataFromTranscript = (transcript: string): ClientData => {
    // Extract name - improved pattern to catch names in various contexts
    let name = "Cliente";
    
    // Try multiple patterns to extract names
    const namePatterns = [
      // Pattern 1: "para [Nome]" (most common)
      /(?:para|de)\s+([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+(?:\s+[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+)*)/i,
      // Pattern 2: "cliente [Nome]" or "chama [Nome]" 
      /(?:cliente|nome|chama)\s+([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+(?:\s+[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+)*)/i,
      // Pattern 3: Look for capitalized words that look like names (2+ capital letters)
      /([A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+\s+[A-ZÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ][a-záéíóúàèìòùâêîôûãõç]+)/
    ];
    
    for (const pattern of namePatterns) {
      const match = transcript.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        const extractedName = match[1].trim();
        // Verify it's not common words
        if (!extractedName.toLowerCase().match(/^(ele|ela|anos|trabalha|ganha|reais|possui|tem)$/)) {
          name = extractedName;
          break;
        }
      }
    }
    
    // Extract age
    const ageMatch = transcript.match(/(\d+)\s*anos?/i) || transcript.match(/idade\s+(\d+)/i);
    const age = ageMatch ? parseInt(ageMatch[1]) : 30;
    
    // Extract profession
    const professionMatch = transcript.match(/(?:trabalha|profissão|é|atua)\s+(?:como\s+)?([A-Za-záéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ\s]+?)(?:\s*[,.]|\s+(?:ganha|renda|tem|possui|idade))/i);
    const profession = professionMatch ? professionMatch[1].trim() : "Não informado";
    
    // Extract income
    const incomeMatch = transcript.match(/(?:ganha|renda|salário).*?(\d+(?:\.\d+)?)\s*(?:mil|reais|R\$)?/i) ||
                       transcript.match(/R\$\s*(\d+(?:\.\d+)?)/i) ||
                       transcript.match(/(\d+)\s*mil/i);
    let monthlyIncome = 5000;
    if (incomeMatch) {
      const value = parseFloat(incomeMatch[1]);
      monthlyIncome = transcript.toLowerCase().includes('mil') ? value * 1000 : value;
    }
    
    // Extract dependents
    const dependentsMatch = transcript.match(/(\d+)\s*filhos?/i) || 
                           transcript.match(/tem\s+(\d+)\s+(?:dependentes|filhos)/i) ||
                           transcript.match(/possui\s+(\d+)/i);
    const dependentsCount = dependentsMatch ? parseInt(dependentsMatch[1]) : 0;
    const hasDependents = dependentsCount > 0;
    
    // Extract health status
    let healthStatus = "boa";
    if (transcript.toLowerCase().includes("excelente") || transcript.toLowerCase().includes("ótima")) {
      healthStatus = "excelente";
    } else if (transcript.toLowerCase().includes("problema") || transcript.toLowerCase().includes("ruim")) {
      healthStatus = "problemas";
    }
    
    // Extract gender
    let gender = "masculino";
    if (transcript.toLowerCase().includes("mulher") || transcript.toLowerCase().includes("feminino") || 
        transcript.toLowerCase().includes("ela")) {
      gender = "feminino";
    }
    
    return {
      name: name || "Cliente",
      age,
      gender,
      profession,
      monthlyIncome,
      hasDependents,
      dependentsCount,
      currentDebts: 0, // Default
      healthStatus,
      existingInsurance: transcript.toLowerCase().includes("seguro") && 
                        !transcript.toLowerCase().includes("não tem seguro")
    };
  };

  const handleVoiceTranscript = (transcript: string) => {
    console.log("Transcrição recebida:", transcript);
    const clientData = extractClientDataFromTranscript(transcript);
    console.log("Dados extraídos do cliente:", clientData);
    
    toast({
      title: "Dados extraídos da voz",
      description: `Cliente: ${clientData.name}, ${clientData.age} anos, ${clientData.profession}`,
    });
    
    handleFormSubmit(clientData);
  };

  const handleSaveAnalysis = async () => {
    if (!analysis || !user || !originalClientData) return;
    
    try {
      // Use the actual client data that was used to generate the analysis

      const { error } = await supabase
        .from('client_analyses')
        .insert({
          broker_id: user.id,
          client_name: analysis.clientName,
          client_age: originalClientData.age,
          monthly_income: originalClientData.monthlyIncome,
          risk_profile: analysis.riskProfile,
          client_gender: originalClientData.gender,
          client_profession: originalClientData.profession,
          health_status: originalClientData.healthStatus,
          has_dependents: originalClientData.hasDependents,
          dependents_count: originalClientData.dependentsCount,
          current_debts: originalClientData.currentDebts,
          existing_insurance: originalClientData.existingInsurance,
          recommended_coverage: analysis.recommendedCoverages as any,
          justifications: { summary: analysis.summary } as any,
          status: 'novo'
        });
      
      if (error) throw error;
      
      toast({
        title: "Estudo salvo!",
        description: "O estudo foi salvo no seu painel de leads.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDF = async () => {
    const element = document.getElementById('proposal-content');
    if (!element) return;
    
    try {
      // Adiciona classe para PDF antes de capturar
      element.classList.add('print-layout');
      document.body.classList.add('printing');
      
      // Aguarda um pouco para que os estilos sejam aplicados
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Configurações otimizadas para PDF com melhor qualidade
      const canvas = await html2canvas(element, { 
        scale: 2, // Aumenta a qualidade
        useCORS: true, 
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: 1200,
        windowHeight: element.scrollHeight,
        logging: false, // Remove logs desnecessários
        removeContainer: true,
        imageTimeout: 10000
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0); // Qualidade máxima
      
      // Configuração do PDF otimizada
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8; // Margens menores para melhor aproveitamento
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);
      
      const imgProps = { width: canvas.width, height: canvas.height };
      const ratio = Math.min(availableWidth / (imgProps.width * 0.264583), availableHeight / (imgProps.height * 0.264583));
      const imgWidth = (imgProps.width * 0.264583) * ratio; // Converte px para mm
      const imgHeight = (imgProps.height * 0.264583) * ratio;
      
      // Se a imagem for muito alta, dividir em páginas
      if (imgHeight > availableHeight) {
        let currentY = 0;
        let pageNumber = 1;
        const pagesNeeded = Math.ceil(imgHeight / availableHeight);
        
        while (currentY < imgHeight && pageNumber <= pagesNeeded) {
          if (pageNumber > 1) {
            pdf.addPage();
          }
          
          const remainingHeight = Math.min(availableHeight, imgHeight - currentY);
          const sourceY = (currentY / ratio) / 0.264583; // Converte de volta para px
          const sourceHeight = (remainingHeight / ratio) / 0.264583;
          
          // Cria um canvas temporário para a parte atual
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = sourceHeight;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
            const tempImgData = tempCanvas.toDataURL('image/png', 1.0);
            
            pdf.addImage(
              tempImgData, 
              'PNG', 
              margin, 
              margin, 
              availableWidth, 
              remainingHeight
            );
          }
          
          currentY += availableHeight;
          pageNumber++;
        }
      } else {
        // Centralizar na página se couber
        const xPos = (pageWidth - imgWidth) / 2;
        const yPos = margin;
        
        pdf.addImage(imgData, 'PNG', xPos, yPos, imgWidth, imgHeight);
      }
      
      // Remove classes após captura
      element.classList.remove('print-layout');
      document.body.classList.remove('printing');
      
      const fileName = `proposta_${analysis?.clientName?.replace(/[^a-zA-Z0-9]/g, '_') || 'cliente'}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF gerado com sucesso!",
        description: `Arquivo ${fileName} baixado com formatação otimizada.`,
      });
      
    } catch (e: any) {
      // Remove classes em caso de erro
      element?.classList.remove('print-layout');
      document.body.classList.remove('printing');
      
      console.error('Erro ao gerar PDF:', e);
      toast({ 
        title: 'Erro ao gerar PDF', 
        description: 'Tente novamente ou use o botão direito do mouse para imprimir como PDF.', 
        variant: 'destructive' 
      });
    }
  };

  const resetToChoice = () => {
    setInputMode("choice");
    setAnalysis(null);
    setShowUpgradeModal(false);
  };

  const handleUpgradeRedirect = () => {
    // TODO: Redirect to plans landing page
    window.open("https://example.com/plans", "_blank");
    setShowUpgradeModal(false);
  };

  const handleStartNewStudy = () => {
    if (!freeTrialStatus.canCreateStudy) {
      setShowUpgradeModal(true);
      return;
    }
    setInputMode("choice");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="animate-pulse text-lg text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <AppHeader />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {inputMode === "choice" && (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Free Trial Status */}
            {!freeTrialStatus.isPremium && (
              <div className="flex justify-center">
                <FreeTrialCounter 
                  studiesUsed={freeTrialStatus.studiesUsed}
                  studiesRemaining={freeTrialStatus.studiesRemaining}
                  studiesLimit={freeTrialStatus.studiesLimit}
                  isPremium={freeTrialStatus.isPremium}
                  variant="detailed"
                />
              </div>
            )}

            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden shadow-strong">
              <img 
                src={heroImage} 
                alt="Corretor Consultor" 
                className="w-full h-64 md:h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-success/80 flex items-center">
                <div className="container mx-auto px-8">
                  <div className="max-w-2xl text-primary-foreground">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      Bem-vindo, {user?.user_metadata?.full_name || 'Corretor'}!
                    </h2>
                    <p className="text-lg mb-6 opacity-90">
                      Gere estudos de forma simples, prática e inteligente.
                      Escolha como deseja coletar os dados do seu cliente.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Input Method Selection */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                Como você deseja seguir?
              </h3>
              <p className="text-muted-foreground">
                Escolha o método para coletar informações do cliente
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <Card 
                className={`cursor-pointer hover:shadow-glow transition-all duration-300 transform hover:scale-105 bg-gradient-card ${
                  !freeTrialStatus.canCreateStudy ? 'opacity-50' : ''
                }`}
                onClick={() => {
                  if (!freeTrialStatus.canCreateStudy) {
                    setShowUpgradeModal(true);
                  } else {
                    setInputMode("voice");
                  }
                }}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto p-4 bg-gradient-primary rounded-full w-fit mb-4">
                    <Mic className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">Falar</CardTitle>
                  <CardDescription>
                    Descreva o perfil do cliente usando sua voz
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">✨ Mais rápido e natural</p>
                    <p className="text-sm text-muted-foreground">🎤 Powered by IA</p>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer hover:shadow-glow transition-all duration-300 transform hover:scale-105 bg-gradient-card ${
                  !freeTrialStatus.canCreateStudy ? 'opacity-50' : ''
                }`}
                onClick={() => {
                  if (!freeTrialStatus.canCreateStudy) {
                    setShowUpgradeModal(true);
                  } else {
                    setInputMode("form");
                  }
                }}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto p-4 bg-gradient-success rounded-full w-fit mb-4">
                    <Edit className="h-8 w-8 text-success-foreground" />
                  </div>
                  <CardTitle className="text-xl">Digitar informações</CardTitle>
                  <CardDescription>
                    Preencha um formulário detalhado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">📋 Controle total</p>
                    <p className="text-sm text-muted-foreground">✅ Dados precisos</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {inputMode === "voice" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Button 
              variant="ghost" 
              onClick={resetToChoice}
              className="mb-4"
            >
              ← Voltar
            </Button>
            <VoiceInput 
              onTranscript={handleVoiceTranscript}
              loading={processingAnalysis}
            />
          </div>
        )}

        {inputMode === "form" && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Button 
              variant="ghost" 
              onClick={resetToChoice}
              className="mb-4"
            >
              ← Voltar
            </Button>
            <ClientDataForm 
              onSubmit={handleFormSubmit}
              loading={processingAnalysis}
            />
          </div>
        )}

        {inputMode === "results" && analysis && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={handleStartNewStudy}
              >
                ← Nova Análise
              </Button>
              <div className="flex items-center gap-4">
                <FreeTrialCounter 
                  studiesUsed={freeTrialStatus.studiesUsed}
                  studiesRemaining={freeTrialStatus.studiesRemaining}
                  studiesLimit={freeTrialStatus.studiesLimit}
                  isPremium={freeTrialStatus.isPremium}
                />
                <div className="flex items-center gap-2">
                  <FileBarChart className="h-5 w-5 text-success" />
                  <span className="text-sm font-medium text-success">Análise Concluída</span>
                </div>
              </div>
            </div>
            <div id="proposal-content">
            <EditableRecommendationDisplay 
              analysis={analysis} 
              onGeneratePDF={handleGeneratePDF}
              onSaveAnalysis={handleSaveAnalysis}
            />
            </div>
          </div>
        )}

        {/* Free Trial Blocked Modal */}
        <FreeTrialBlockedModal 
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          user={user}
        />
      </main>
    </div>
  );
};

export default Index;