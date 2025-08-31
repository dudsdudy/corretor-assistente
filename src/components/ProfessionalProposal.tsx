import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Heart, Briefcase, Home, Building2, Calendar, TrendingUp, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ClientAnalysis, CoverageRecommendation } from "./RecommendationDisplay";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfessionalProposalProps {
  analysis: ClientAnalysis;
  partnerBroker?: string;
  quotationValidity?: string;
  coveragesWithPremiums: Array<CoverageRecommendation & {
    monthlyPremium: number;
    insurer: string;
  }>;
}

interface BrokerInfo {
  name: string;
  email: string;
  phone?: string;
  logo?: string;
  companyName?: string;
}

const getCoverageIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "morte":
      return <Shield className="h-8 w-8 text-white" />;
    case "invalidez":
    case "invalidez permanente (ipta)":
    case "ipta":
      return <Shield className="h-8 w-8 text-white" />;
    case "doenças graves":
    case "dg":
      return <Heart className="h-8 w-8 text-white" />;
    case "diária":
    case "diária por incapacidade (dit)":
    case "dit":
      return <Briefcase className="h-8 w-8 text-white" />;
    case "funeral":
      return <Home className="h-8 w-8 text-white" />;
    default:
      return <Shield className="h-8 w-8 text-white" />;
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
};

export default function ProfessionalProposal({ 
  analysis, 
  partnerBroker, 
  quotationValidity,
  coveragesWithPremiums 
}: ProfessionalProposalProps) {
  const [brokerInfo, setBrokerInfo] = useState<BrokerInfo | null>(null);

  useEffect(() => {
    const fetchBrokerInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, phone_number, avatar_url')
            .eq('user_id', user.id)
            .single();

          setBrokerInfo({
            name: profile?.full_name || user.email?.split('@')[0] || 'Corretor',
            email: profile?.email || user.email || '',
            phone: profile?.phone_number,
            logo: profile?.avatar_url,
            companyName: 'Seguros e Consultoria' // TODO: Adicionar campo no perfil
          });
        }
      } catch (error) {
        console.error('Erro ao carregar informações do corretor:', error);
      }
    };

    fetchBrokerInfo();
  }, []);

  const totalCoverage = coveragesWithPremiums.reduce((sum, coverage) => sum + coverage.amount, 0);
  const totalMonthlyPremium = coveragesWithPremiums.reduce((sum, coverage) => sum + coverage.monthlyPremium, 0);

  return (
    <div id="professional-proposal" className="bg-white text-gray-900 min-h-screen">
      {/* Header/Capa */}
      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-transparent"></div>
        <div className="relative z-10">
          {/* Logo e informações do corretor */}
          <div className="flex justify-between items-start mb-12">
            <div className="flex items-center gap-6">
              {brokerInfo?.logo && (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <img 
                    src={brokerInfo.logo} 
                    alt="Logo" 
                    className="h-16 w-16 object-contain"
                  />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold mb-2">{brokerInfo?.companyName || "Consultoria em Seguros"}</h1>
                <p className="text-blue-100 text-lg">{brokerInfo?.name}</p>
                <p className="text-blue-200 text-sm">{brokerInfo?.email}</p>
                {brokerInfo?.phone && (
                  <p className="text-blue-200 text-sm">{brokerInfo.phone}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm text-blue-100">Proposta gerada em</p>
                <p className="font-semibold">{formatDate(new Date())}</p>
              </div>
            </div>
          </div>

          {/* Título principal */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-bold mb-4">PROPOSTA DE CONSULTORIA</h2>
            <h3 className="text-3xl font-light mb-2">EM SEGUROS DE VIDA</h3>
            <div className="w-32 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 mx-auto rounded-full"></div>
            <p className="text-xl mt-6 text-blue-100">
              Análise personalizada para <strong>{analysis.clientName}</strong>
            </p>
          </div>

          {/* Resumo executivo */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-yellow-400" />
                <h4 className="text-lg font-semibold mb-2">Perfil Analisado</h4>
                <p className="text-blue-100">{analysis.riskProfile}</p>
              </div>
              <div>
                <Shield className="h-12 w-12 mx-auto mb-3 text-green-400" />
                <h4 className="text-lg font-semibold mb-2">Cobertura Total</h4>
                <p className="text-blue-100 text-xl font-bold">{formatCurrency(totalCoverage)}</p>
              </div>
              <div>
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-blue-400" />
                <h4 className="text-lg font-semibold mb-2">Prêmio Mensal</h4>
                <p className="text-blue-100 text-xl font-bold">{formatCurrency(totalMonthlyPremium)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="p-12 space-y-12">
        {/* Introdução */}
        <section>
          <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-blue-600 to-blue-800 rounded-full"></div>
            Prezado(a) {analysis.clientName},
          </h3>
          <div className="bg-gray-50 rounded-2xl p-8">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Com base em nossa análise detalhada de seu perfil pessoal e financeiro, apresentamos esta 
              proposta de consultoria em seguros de vida, elaborada especificamente para suas necessidades 
              e objetivos de proteção familiar.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Nossa metodologia utiliza as melhores práticas atuariais internacionais para garantir que 
              você tenha a proteção adequada pelo menor custo possível.
            </p>
          </div>
        </section>

        {/* Análise do Perfil */}
        <section>
          <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-green-600 to-green-800 rounded-full"></div>
            Análise do Seu Perfil
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-800">Informações Pessoais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Nome:</span>
                  <span className="text-gray-900">{analysis.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Perfil de Risco:</span>
                  <Badge className="bg-blue-600 text-white">{analysis.riskProfile}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <CardTitle className="text-green-800">Fatores Considerados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <p className="text-sm text-gray-600">Idade</p>
                    <p className="text-lg font-bold text-green-700">
                      {(analysis.analysisDetails.ageRiskFactor * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-white/60 rounded-lg">
                    <p className="text-sm text-gray-600">Saúde</p>
                    <p className="text-lg font-bold text-green-700">
                      {(analysis.analysisDetails.healthRiskFactor * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Coberturas Recomendadas */}
        <section>
          <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-purple-600 to-purple-800 rounded-full"></div>
            Resumo de Coberturas
          </h3>
          <div className="grid gap-6">
            {coveragesWithPremiums.map((coverage, index) => (
              <Card key={index} className="shadow-lg border-0 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                        {getCoverageIcon(coverage.type)}
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold">{coverage.type}</h4>
                        <p className="text-blue-100">{coverage.calculationBasis}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold">{formatCurrency(coverage.amount)}</p>
                      {coverage.monthlyPremium > 0 && (
                        <p className="text-blue-200">
                          Prêmio: {formatCurrency(coverage.monthlyPremium)}/mês
                        </p>
                      )}
                      {coverage.insurer && (
                        <p className="text-blue-200 text-sm mt-1">
                          Seguradora: {coverage.insurer}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-semibold text-gray-800 mb-2">Por que é importante:</h5>
                      <p className="text-gray-700 leading-relaxed">{coverage.justification}</p>
                    </div>
                    {coverage.riskFactors && coverage.riskFactors.length > 0 && (
                      <div>
                        <h5 className="font-semibold text-gray-800 mb-2">Fatores considerados:</h5>
                        <div className="flex flex-wrap gap-2">
                          {coverage.riskFactors.map((factor, factorIndex) => (
                            <Badge 
                              key={factorIndex} 
                              variant="outline" 
                              className="text-xs bg-gray-50"
                            >
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Resumo Financeiro */}
        <section>
          <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-orange-600 to-red-600 rounded-full"></div>
            Resumo Financeiro
          </h3>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-red-50">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-gray-800">Cobertura Total</h4>
                  <p className="text-4xl font-bold text-orange-600">{formatCurrency(totalCoverage)}</p>
                  <p className="text-gray-600">Valor total das coberturas recomendadas</p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-xl font-bold text-gray-800">Prêmio Mensal Total</h4>
                  <p className="text-4xl font-bold text-red-600">{formatCurrency(totalMonthlyPremium)}</p>
                  <p className="text-gray-600">Soma de todos os prêmios mensais</p>
                </div>
              </div>
              
              {totalMonthlyPremium > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>Custo anual estimado:</span>
                    <span className="font-semibold text-lg text-gray-800">
                      {formatCurrency(totalMonthlyPremium * 12)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mt-2">
                    <span>Proteção familiar:</span>
                    <span className="font-semibold">
                      {(totalCoverage / totalMonthlyPremium).toFixed(0)}x o valor do prêmio mensal
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Próximos Passos */}
        <section>
          <h3 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <div className="w-2 h-8 bg-gradient-to-b from-green-600 to-teal-600 rounded-full"></div>
            Próximos Passos
          </h3>
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-teal-50">
            <CardContent className="p-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-xl font-bold text-green-800 mb-4">Recomendações</h4>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Revisar e ajustar valores conforme seu orçamento</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Priorizar coberturas de alta importância</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Avaliar condições de pagamento disponíveis</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Definir beneficiários e documentação</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-teal-800 mb-4">Validade</h4>
                  <div className="bg-white/60 rounded-xl p-6 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-3 text-teal-600" />
                    <p className="text-gray-700 mb-2">Esta cotação é válida por:</p>
                    <p className="text-2xl font-bold text-teal-600">
                      {quotationValidity || '30 dias'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer com informações do corretor */}
        <section className="border-t-2 border-gray-200 pt-8">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-2">Seu Consultor</h4>
              <p className="text-lg font-semibold text-blue-600">{brokerInfo?.name}</p>
              <p className="text-gray-600">{brokerInfo?.email}</p>
              {brokerInfo?.phone && (
                <p className="text-gray-600">{brokerInfo.phone}</p>
              )}
              {partnerBroker && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500">Em parceria com:</p>
                  <p className="font-semibold text-gray-700">{partnerBroker}</p>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white rounded-2xl p-6">
                <Building2 className="h-12 w-12 mx-auto mb-2" />
                <p className="font-bold text-lg">{brokerInfo?.companyName || "Consultoria"}</p>
                <p className="text-blue-100 text-sm">Seguros de Vida</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}