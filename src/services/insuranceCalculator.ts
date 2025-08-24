import { ClientData } from "@/components/ClientDataForm";
import { ClientAnalysis, CoverageRecommendation } from "@/components/RecommendationDisplay";

// Tabelas de risco simplificadas
const AGE_RISK_TABLE: Record<string, number> = {
  "18-25": 1.0,
  "26-35": 1.1,
  "36-45": 1.3,
  "46-55": 1.6,
  "56-65": 2.2,
  "66+": 3.0
};

const HEALTH_RISK_MULTIPLIER: Record<string, number> = {
  "excelente": 1.0,
  "bom": 1.1,
  "regular": 1.3,
  "precario": 1.8
};

const PROFESSION_RISK_CATEGORIES: Record<string, { multiplier: number; category: string }> = {
  // Baixo risco
  "advogado": { multiplier: 1.0, category: "Baixo risco" },
  "contador": { multiplier: 1.0, category: "Baixo risco" },
  "professor": { multiplier: 1.0, category: "Baixo risco" },
  "engenheiro": { multiplier: 1.1, category: "Baixo risco" },
  "medico": { multiplier: 1.1, category: "Baixo risco" },
  "dentista": { multiplier: 1.1, category: "Baixo risco" },
  
  // Risco médio
  "vendedor": { multiplier: 1.2, category: "Risco médio" },
  "empresario": { multiplier: 1.2, category: "Risco médio" },
  "motorista": { multiplier: 1.4, category: "Risco médio" },
  "tecnico": { multiplier: 1.3, category: "Risco médio" },
  
  // Alto risco
  "policial": { multiplier: 2.0, category: "Alto risco" },
  "bombeiro": { multiplier: 2.2, category: "Alto risco" },
  "soldador": { multiplier: 1.8, category: "Alto risco" },
  "eletricista": { multiplier: 1.7, category: "Alto risco" },
  "construção": { multiplier: 1.9, category: "Alto risco" }
};

export class InsuranceCalculatorService {
  private getAgeRiskFactor(age: number): number {
    if (age <= 25) return AGE_RISK_TABLE["18-25"];
    if (age <= 35) return AGE_RISK_TABLE["26-35"];
    if (age <= 45) return AGE_RISK_TABLE["36-45"];
    if (age <= 55) return AGE_RISK_TABLE["46-55"];
    if (age <= 65) return AGE_RISK_TABLE["56-65"];
    return AGE_RISK_TABLE["66+"];
  }

  private getHealthRiskFactor(healthStatus: string): number {
    return HEALTH_RISK_MULTIPLIER[healthStatus] || 1.3;
  }

  private getProfessionRiskFactor(profession: string): { multiplier: number; category: string } {
    const normalizedProfession = profession.toLowerCase()
      .replace(/[^a-z]/g, "");

    // Busca por palavras-chave na profissão
    for (const [key, value] of Object.entries(PROFESSION_RISK_CATEGORIES)) {
      if (normalizedProfession.includes(key)) {
        return value;
      }
    }

    // Padrão para profissões não categorizadas
    return { multiplier: 1.2, category: "Risco médio" };
  }

  private getDependentsImpactFactor(hasDependents: boolean, count: number): number {
    if (!hasDependents) return 1.0;
    return 1.0 + (count * 0.3); // 30% adicional por dependente
  }

  private calculateLifeInsurance(clientData: ClientData, riskFactors: any): CoverageRecommendation {
    // Metodologia: Income Replacement + Débitos + Despesas Futuras
    const annualIncome = clientData.monthlyIncome * 12;
    
    // Período de substituição de renda (baseado na idade e dependentes)
    const replacementYears = clientData.hasDependents ? 
      Math.max(20 - (clientData.age - 30), 10) : 15;
    
    // Valor presente da renda futura (taxa de desconto simplificada de 4% a.a.)
    const discountRate = 0.04;
    const presentValue = annualIncome * ((1 - Math.pow(1 + discountRate, -replacementYears)) / discountRate);
    
    // Despesas imediatas e futuras
    const immediateExpenses = annualIncome * 0.1; // 10% da renda anual
    const futureCosts = clientData.hasDependents ? 
      clientData.dependentsCount * 50000 : 0; // R$ 50k por dependente (educação/custos)
    
    const totalAmount = presentValue + clientData.currentDebts + immediateExpenses + futureCosts;
    
    const riskFactorsList = [
      `Idade ${clientData.age} anos`,
      `Saúde ${clientData.healthStatus}`,
      riskFactors.professionCategory,
      clientData.hasDependents ? `${clientData.dependentsCount} dependente(s)` : "Sem dependentes"
    ];

    return {
      type: "Morte",
      amount: Math.round(totalAmount),
      justification: `Baseado na metodologia de substituição de renda, calculamos ${replacementYears} anos de cobertura considerando sua renda anual de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualIncome)}. Incluímos quitação de dívidas (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(clientData.currentDebts)}), despesas imediatas e ${clientData.hasDependents ? 'custos educacionais dos dependentes' : 'reservas para gastos futuros'}.`,
      priority: "high" as const,
      riskFactors: riskFactorsList,
      calculationBasis: `${replacementYears} anos de renda`
    };
  }

  private calculateDisabilityInsurance(clientData: ClientData, riskFactors: any): CoverageRecommendation {
    const lifeAmount = clientData.monthlyIncome * 120; // Valor base da vida
    const disabilityAmount = lifeAmount * 0.75 * riskFactors.totalMultiplier;
    
    // Custos de adaptação baseados na renda
    const adaptationCosts = clientData.monthlyIncome * 24; // 2 anos de renda para adaptações

    const riskFactorsList = [
      `Profissão: ${riskFactors.professionCategory}`,
      `Idade ${clientData.age} anos`,
      `Fatores físicos da profissão`
    ];

    return {
      type: "Invalidez Permanente (IPTA)",
      amount: Math.round(disabilityAmount + adaptationCosts),
      justification: `Calculado considerando 75% do valor da cobertura de vida mais custos de adaptação. Como ${clientData.profession.toLowerCase()}, avaliamos os riscos ocupacionais específicos. A cobertura inclui recursos para modificações necessárias no estilo de vida e manutenção da qualidade de vida.`,
      priority: "high" as const,
      riskFactors: riskFactorsList,
      calculationBasis: "75% da vida + adaptações"
    };
  }

  private calculateCriticalIllnessInsurance(clientData: ClientData, riskFactors: any): CoverageRecommendation {
    // Baseado em custos médicos + perda de renda durante tratamento
    const treatmentCosts = clientData.monthlyIncome * 18; // 18 meses de renda para tratamentos
    const medicalExpenses = Math.max(100000, clientData.monthlyIncome * 12); // Mínimo R$ 100k
    
    const totalAmount = treatmentCosts + medicalExpenses;
    
    const priority = clientData.healthStatus !== "excelente" || clientData.age > 40 ? 
      "high" as const : "medium" as const;

    const riskFactorsList = [
      `Estado de saúde: ${clientData.healthStatus}`,
      `Idade ${clientData.age} anos`,
      `Histórico familiar considerado`,
      "Custos de tratamentos especializados"
    ];

    return {
      type: "Doenças Graves",
      amount: Math.round(totalAmount),
      justification: `Calculada para cobrir 18 meses de substituição de renda durante tratamento, mais despesas médicas não cobertas por planos de saúde. Com seu perfil de saúde ${clientData.healthStatus} e idade ${clientData.age} anos, esta proteção oferece tranquilidade financeira durante momentos críticos.`,
      priority,
      riskFactors: riskFactorsList,
      calculationBasis: "18 meses renda + tratamentos"
    };
  }

  private calculateDailyIncapacityInsurance(clientData: ClientData): CoverageRecommendation {
    // Diária baseada em 80% da renda diária por até 365 dias
    const dailyIncome = clientData.monthlyIncome / 30;
    const dailyBenefit = dailyIncome * 0.8;
    const maxDays = 365;
    const totalAmount = dailyBenefit * maxDays;

    const riskFactorsList = [
      `Renda diária: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dailyIncome)}`,
      "Cobertura por até 365 dias",
      "80% da renda diária"
    ];

    return {
      type: "Diária por Incapacidade (DIT)",
      amount: Math.round(totalAmount),
      justification: `Garante 80% da sua renda diária (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dailyBenefit)}) durante afastamentos temporários por doença ou acidente, por até 365 dias. Mantém a estabilidade financeira durante o período de recuperação.`,
      priority: "medium" as const,
      riskFactors: riskFactorsList,
      calculationBasis: "80% renda diária x 365 dias"
    };
  }

  private calculateFuneralInsurance(clientData: ClientData): CoverageRecommendation {
    // Valor baseado no padrão de vida (renda)
    const baseAmount = 15000;
    const lifestyleAdjustment = Math.min(clientData.monthlyIncome * 0.3, 15000);
    const totalAmount = baseAmount + lifestyleAdjustment;

    return {
      type: "Funeral",
      amount: Math.round(totalAmount),
      justification: "Cobertura para despesas de funeral e sepultamento, ajustada ao padrão de vida familiar. Evita gastos inesperados em momento de grande sensibilidade.",
      priority: "low" as const,
      riskFactors: ["Valor fixo ajustado à renda"],
      calculationBasis: "Valor fixo + ajuste padrão"
    };
  }

  public calculateInsuranceRecommendations(clientData: ClientData): ClientAnalysis {
    // Calcular fatores de risco
    const ageRiskFactor = this.getAgeRiskFactor(clientData.age);
    const healthRiskFactor = this.getHealthRiskFactor(clientData.healthStatus);
    const professionRisk = this.getProfessionRiskFactor(clientData.profession);
    const dependentsImpact = this.getDependentsImpactFactor(clientData.hasDependents, clientData.dependentsCount);
    
    const riskFactors = {
      ageRiskFactor,
      healthRiskFactor,
      professionRiskFactor: professionRisk.multiplier,
      professionCategory: professionRisk.category,
      dependentsImpact,
      totalMultiplier: ageRiskFactor * healthRiskFactor * professionRisk.multiplier * dependentsImpact
    };

    // Calcular coberturas
    const coverages: CoverageRecommendation[] = [
      this.calculateLifeInsurance(clientData, riskFactors),
      this.calculateDisabilityInsurance(clientData, riskFactors),
      this.calculateCriticalIllnessInsurance(clientData, riskFactors),
      this.calculateDailyIncapacityInsurance(clientData),
      this.calculateFuneralInsurance(clientData)
    ];

    // Determinar perfil de risco geral
    const riskProfile = this.determineRiskProfile(riskFactors);

    // Gerar resumo da análise
    const summary = this.generateAnalysisSummary(clientData, riskFactors, coverages);

    return {
      clientName: clientData.name,
      riskProfile,
      recommendedCoverages: coverages,
      summary,
      analysisDetails: {
        ageRiskFactor: ageRiskFactor - 1, // Normalizado para mostrar incremento
        healthRiskFactor: healthRiskFactor - 1,
        professionRiskFactor: professionRisk.multiplier - 1,
        dependentsImpact: dependentsImpact - 1
      }
    };
  }

  private determineRiskProfile(riskFactors: any): string {
    const totalRisk = riskFactors.totalMultiplier;
    
    if (totalRisk >= 3.5) return "Alto Risco";
    if (totalRisk >= 2.0) return "Risco Elevado";
    if (totalRisk >= 1.5) return "Risco Médio";
    return "Perfil Adequado";
  }

  private generateAnalysisSummary(clientData: ClientData, riskFactors: any, coverages: CoverageRecommendation[]): string {
    const totalCoverage = coverages.reduce((sum, coverage) => sum + coverage.amount, 0);
    const highPriorityCoverages = coverages.filter(c => c.priority === "high").length;
    
    return `Análise completa para ${clientData.name}, ${clientData.age} anos, ${clientData.profession.toLowerCase()}. 
    
    Com base na metodologia atuarial aplicada, seu perfil apresenta multiplicador de risco de ${riskFactors.totalMultiplier.toFixed(2)}x, considerando fatores de idade, saúde, profissão e dependentes.
    
    Recomendamos proteção total de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCoverage)}, distribuída em ${highPriorityCoverages} coberturas prioritárias.
    
    ${clientData.hasDependents ? 
      `Com ${clientData.dependentsCount} dependente(s), priorizamos a segurança financeira familiar através de coberturas robustas de morte e invalidez.` : 
      'O foco está na proteção individual e manutenção do padrão de vida.'
    }
    
    A análise considera custos de substituição de renda, despesas médicas, adaptações necessárias e quitação de dívidas existentes.`;
  }
}

export const insuranceCalculator = new InsuranceCalculatorService();