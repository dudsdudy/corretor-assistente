import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Session } from '@supabase/supabase-js';
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  Edit, 
  Shield, 
  LogOut, 
  Database, 
  Kanban, 
  Settings,
  TrendingUp,
  FileBarChart
} from "lucide-react";
import heroImage from "@/assets/hero-insurance.jpg";
import ClientDataForm, { ClientData } from "@/components/ClientDataForm";
import VoiceInput from "@/components/VoiceInput";
import RecommendationDisplay, { ClientAnalysis } from "@/components/RecommendationDisplay";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [inputMode, setInputMode] = useState<"choice" | "voice" | "form" | "results">("choice");
  const [analysis, setAnalysis] = useState<ClientAnalysis | null>(null);
  const [processingAnalysis, setProcessingAnalysis] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    const baseAmount = clientData.monthlyIncome * 120; // 10 years of income
    const dependentsFactor = clientData.hasDependents ? 1.5 : 1;
    const ageFactor = clientData.age > 45 ? 1.2 : 1;
    const healthFactor = clientData.healthStatus === "precario" ? 1.4 : 
                        clientData.healthStatus === "regular" ? 1.2 : 1;
    
    const totalMultiplier = dependentsFactor * ageFactor * healthFactor;
    
    return {
      clientName: clientData.name,
      riskProfile: clientData.age > 50 || clientData.healthStatus === "precario" ? 
                   "Alto Risco" : clientData.age > 35 ? "Risco Médio" : "Baixo Risco",
      recommendedCoverages: [
        {
          type: "Morte",
          amount: baseAmount * totalMultiplier,
          premium: (baseAmount * totalMultiplier) * 0.002,
          justification: `Com base na sua renda mensal de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(clientData.monthlyIncome)} e ${clientData.hasDependents ? `${clientData.dependentsCount} dependente(s)` : 'sem dependentes'}, recomendamos uma cobertura que garanta a segurança financeira ${clientData.hasDependents ? 'da família' : 'pessoal'} por pelo menos 10 anos.`,
          priority: "high"
        },
        {
          type: "Invalidez Permanente (IPTA)",
          amount: baseAmount * 0.8 * totalMultiplier,
          premium: (baseAmount * 0.8 * totalMultiplier) * 0.0015,
          justification: `Como ${clientData.profession.toLowerCase()}, existe o risco de acidentes que podem causar invalidez. Esta cobertura garante recursos para adaptação e manutenção do padrão de vida.`,
          priority: "high"
        },
        {
          type: "Doenças Graves",
          amount: clientData.monthlyIncome * 60,
          premium: (clientData.monthlyIncome * 60) * 0.003,
          justification: `O tratamento de doenças graves pode ser custoso. Esta cobertura oferece recursos imediatos para tratamento e recuperação, considerando seu perfil de saúde ${clientData.healthStatus}.`,
          priority: clientData.healthStatus !== "excelente" ? "high" : "medium"
        },
        {
          type: "Diária por Incapacidade (DIT)",
          amount: clientData.monthlyIncome * 0.03 * 30, // 3% da renda por dia, 30 dias
          premium: clientData.monthlyIncome * 0.0008,
          justification: "Oferece renda diária durante período de afastamento por doença ou acidente, mantendo a estabilidade financeira durante a recuperação.",
          priority: "medium"
        },
        {
          type: "Funeral",
          amount: 15000,
          premium: 12,
          justification: "Cobertura para despesas de funeral, evitando gastos inesperados para a família em momento difícil.",
          priority: "low"
        }
      ],
      totalPremium: 0,
      summary: `Baseado no perfil de ${clientData.name}, ${clientData.age} anos, ${clientData.profession.toLowerCase()}, com renda mensal de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(clientData.monthlyIncome)}, recomendamos um conjunto de coberturas que oferece proteção abrangente. ${clientData.hasDependents ? `Com ${clientData.dependentsCount} dependente(s), priorizamos coberturas que garantam a segurança financeira da família.` : 'Focamos em coberturas que protegem sua estabilidade financeira pessoal.'} O perfil de risco foi avaliado considerando idade, profissão e estado de saúde.`
    };
  };

  const handleFormSubmit = async (clientData: ClientData) => {
    setProcessingAnalysis(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const analysisResult = generateMockAnalysis(clientData);
    analysisResult.totalPremium = analysisResult.recommendedCoverages.reduce(
      (total, coverage) => total + coverage.premium, 0
    );
    
    setAnalysis(analysisResult);
    setInputMode("results");
    setProcessingAnalysis(false);
    
    toast({
      title: "Análise concluída!",
      description: "Recomendações personalizadas geradas com sucesso.",
    });
  };

  const handleVoiceTranscript = (transcript: string) => {
    // For demo purposes, extract mock data from transcript
    const mockClientData: ClientData = {
      name: "João Silva",
      age: 35,
      gender: "masculino",
      profession: "Engenheiro",
      monthlyIncome: 8000,
      hasDependents: true,
      dependentsCount: 2,
      currentDebts: 0,
      healthStatus: "excelente",
      existingInsurance: false
    };
    
    handleFormSubmit(mockClientData);
  };

  const handleSaveAnalysis = async () => {
    if (!analysis || !user) return;
    
    try {
      const { error } = await supabase
        .from('client_analyses')
        .insert({
          broker_id: user.id,
          client_name: analysis.clientName,
          risk_profile: analysis.riskProfile,
          recommended_coverage: analysis.recommendedCoverages as any,
          justifications: { summary: analysis.summary } as any
        });
      
      if (error) throw error;
      
      toast({
        title: "Análise salva!",
        description: "A análise foi salva no seu banco de dados.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleGeneratePDF = () => {
    toast({
      title: "Gerando PDF...",
      description: "Funcionalidade de PDF será implementada em breve.",
    });
  };

  const resetToChoice = () => {
    setInputMode("choice");
    setAnalysis(null);
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
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-hero rounded-lg">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Corretor Consultor</h1>
              <p className="text-xs text-muted-foreground">Inteligência em Seguros de Vida</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Database className="h-4 w-4 mr-2" />
              Banco de Dados
            </Button>
            <Button variant="ghost" size="sm">
              <Kanban className="h-4 w-4 mr-2" />
              Kanban
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Personalizar
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {inputMode === "choice" && (
          <div className="max-w-4xl mx-auto space-y-8">
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
                      Gere recomendações personalizadas de seguro de vida com inteligência artificial. 
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
                className="cursor-pointer hover:shadow-glow transition-all duration-300 transform hover:scale-105 bg-gradient-card"
                onClick={() => setInputMode("voice")}
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
                className="cursor-pointer hover:shadow-glow transition-all duration-300 transform hover:scale-105 bg-gradient-card"
                onClick={() => setInputMode("form")}
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
                onClick={resetToChoice}
              >
                ← Nova Análise
              </Button>
              <div className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-success">Análise Concluída</span>
              </div>
            </div>
            <RecommendationDisplay 
              analysis={analysis}
              onGeneratePDF={handleGeneratePDF}
              onSaveAnalysis={handleSaveAnalysis}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;