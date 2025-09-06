import { ClientData, DependentInfo } from "@/components/ClientDataForm";
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

// Custos educacionais por tipo (valores atuais em R$)
const EDUCATION_COSTS: Record<string, number> = {
  "medio": 25000,     // Ensino médio particular
  "tecnico": 35000,   // Curso técnico
  "superior": 120000  // Ensino superior particular
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
  // Tabelas biométricas brasileiras simplificadas (baseadas em BR-EMS)
  private readonly MORTALITY_RATES_BR = {
    male: { base: 0.008, ageMultiplier: 1.08 },
    female: { base: 0.006, ageMultiplier: 1.07 }
  };

  private readonly MORBIDITY_RATES_BR = {
    critical_illness: { base: 0.012, ageMultiplier: 1.09 },
    disability: { base: 0.015, ageMultiplier: 1.06 }
  };

  // Implementação de metodologias atuariais internacionais
  
  // Human Life Value (HLV) - Valor presente da renda futura
  private calculateHumanLifeValue(clientData: ClientData, yearsToRetirement: number): number {
    const annualIncome = clientData.monthlyIncome * 12;
    const growthRate = 0.02; // 2% crescimento salarial anual padrão (pode ser parametrizado futuramente)
    const discountRate = 0.04; // 4% taxa de desconto atuarial
    const taxRate = 0.25; // 25% impostos
    const consumptionRate = 0.30; // 30% consumo pessoal
    
    let hlv = 0;
    for (let year = 1; year <= yearsToRetirement; year++) {
      const futureIncome = annualIncome * Math.pow(1 + growthRate, year - 1);
      const netIncome = futureIncome * (1 - taxRate) * (1 - consumptionRate);
      const presentValue = netIncome / Math.pow(1 + discountRate, year);
      hlv += presentValue;
    }
    
    return hlv;
  }

  // Cálculo de prêmio puro baseado em tábuas de mortalidade
  private calculatePurePremium(amount: number, age: number, gender: string, type: 'death' | 'disability' | 'critical'): number {
    let rate = 0;
    const isMale = gender.toLowerCase() === 'm' || gender.toLowerCase() === 'masculino';
    
    switch (type) {
      case 'death':
        const mortalityData = isMale ? this.MORTALITY_RATES_BR.male : this.MORTALITY_RATES_BR.female;
        rate = mortalityData.base * Math.pow(mortalityData.ageMultiplier, age - 30);
        break;
      case 'disability':
        rate = this.MORBIDITY_RATES_BR.disability.base * Math.pow(this.MORBIDITY_RATES_BR.disability.ageMultiplier, age - 30);
        break;
      case 'critical':
        rate = this.MORBIDITY_RATES_BR.critical_illness.base * Math.pow(this.MORBIDITY_RATES_BR.critical_illness.ageMultiplier, age - 30);
        break;
    }
    
    // Prêmio puro mensal = (Soma Segurada * Taxa de Mortalidade/Morbidade) / 12
    return (amount * rate) / 12;
  }
  
  // Metodologia DIME Aprimorada (Debts, Income, Mortgage, Education)
  private calculateDIMEMethod(clientData: ClientData): number {
    const debts = clientData.currentDebts || 0;
    const incomeReplacement = this.calculateIncomeReplacement(clientData);
    const mortgageDebt = 0; // Campo futuro para hipoteca/financiamento
    const educationCosts = this.calculateEducationCosts(clientData);
    const existingAssets = (clientData.valorInvestimento || 0) + (clientData.reservasFinanceiras || 0);
    const existingInsurance = clientData.premioSeguroExistente ? clientData.premioSeguroExistente * 120 : 0; // Estimativa baseada no prêmio
    
    const totalNeed = debts + incomeReplacement + mortgageDebt + educationCosts;
    const totalAssets = existingAssets + existingInsurance;
    
    return Math.max(0, totalNeed - totalAssets);
  }

  // Método auxiliar para obter breakdown detalhado do DIME (para relatórios)
  private getDIMEBreakdown(clientData: ClientData): any {
    const debts = clientData.currentDebts || 0;
    const incomeReplacement = this.calculateIncomeReplacement(clientData);
    const mortgageDebt = 0;
    const educationCosts = this.calculateEducationCosts(clientData);
    const existingAssets = (clientData.valorInvestimento || 0) + (clientData.reservasFinanceiras || 0);
    const existingInsurance = clientData.premioSeguroExistente ? clientData.premioSeguroExistente * 120 : 0;
    
    return {
      debts,
      incomeReplacement,
      mortgageDebt,
      educationCosts,
      existingAssets,
      existingInsurance,
      totalNeed: debts + incomeReplacement + mortgageDebt + educationCosts,
      netNeed: Math.max(0, (debts + incomeReplacement + mortgageDebt + educationCosts) - (existingAssets + existingInsurance))
    };
  }
  
  // Cálculo de substituição de renda para dependentes (Metodologia aprimorada)
  private calculateIncomeReplacement(clientData: ClientData): number {
    const annualIncome = clientData.monthlyIncome * 12;
    const replacementRate = 0.70; // 70% da renda (limite atuarial padrão)
    let yearsOfSupport = 0;
    
    if (clientData.hasDependents && clientData.dependentsData?.length) {
      // Cálculo preciso baseado nos dependentes reais
      const maxYearsToIndependence = Math.max(...clientData.dependentsData.map(dep => {
        // Independência financeira = idade de conclusão dos estudos + período de estabelecimento
        const ageAtEducationComplete = dep.age + dep.yearsUntilEducationComplete;
        const establishmentPeriod = dep.educationType === 'superior' ? 3 : 2;
        const ageAtIndependence = ageAtEducationComplete + establishmentPeriod;
        return Math.max(ageAtIndependence - dep.age, 5); // Mínimo 5 anos
      }));
      
      yearsOfSupport = Math.min(maxYearsToIndependence, 25); // Máximo 25 anos de suporte
    } else if (clientData.hasDependents) {
      // Estimativa baseada na quantidade de dependentes
      const avgSupportYears = 18 - (clientData.age > 40 ? 3 : 0); // Ajuste por idade do segurado
      yearsOfSupport = Math.max(avgSupportYears, 10);
    } else if (clientData.estadoCivil === 'casado' || clientData.estadoCivil === 'uniao_estavel') {
      // Suporte ao cônjuge até aposentadoria ou recolocação profissional
      yearsOfSupport = Math.min(15, Math.max(65 - clientData.age, 5));
    }
    
    if (yearsOfSupport === 0) return 0;
    
    const replacementIncome = annualIncome * replacementRate;
    const discountRate = 0.04; // Taxa de desconto atuarial
    const growthRate = 0.02; // 2% crescimento salarial padrão
    
    // Valor presente da anuidade crescente (considera inflação salarial)
    let presentValue = 0;
    for (let year = 1; year <= yearsOfSupport; year++) {
      const futureIncome = replacementIncome * Math.pow(1 + growthRate, year - 1);
      presentValue += futureIncome / Math.pow(1 + discountRate, year);
    }
    
    return presentValue;
  }
  
  // Cálculo de custos educacionais baseado em dados detalhados dos dependentes
  private calculateEducationCosts(clientData: ClientData): number {
    if (!clientData.hasDependents) return 0;
    
    // Se temos dados detalhados dos dependentes, usar cálculo preciso
    if (clientData.dependentsData?.length) {
      const educationInflation = 0.06; // 6% ao ano
      let totalEducationCosts = 0;
      
      clientData.dependentsData.forEach(dependent => {
        const baseCost = EDUCATION_COSTS[dependent.educationType] || EDUCATION_COSTS.superior;
        const yearsUntilEducation = dependent.yearsUntilEducationComplete;
        
        // Valor futuro ajustado pela inflação educacional
        const inflatedCost = baseCost * Math.pow(1 + educationInflation, yearsUntilEducation);
        
        // Valor presente do custo futuro (desconto de 4% ao ano)
        const discountRate = 0.04;
        const presentValue = inflatedCost / Math.pow(1 + discountRate, yearsUntilEducation);
        
        totalEducationCosts += presentValue;
      });
      
      return totalEducationCosts;
    }
    
    // Fallback para método anterior quando não há dados detalhados
    const costPerChild = 120000; // R$ 120k por filho (ensino superior)
    const educationInflation = 0.06; // 6% ao ano
    const yearsToCollege = 8; // Média de anos até faculdade
    
    return clientData.dependentsCount * costPerChild * Math.pow(1 + educationInflation, yearsToCollege);
  }
  
  // Capital Retention Method (Metodologia de Preservação de Capital)
  private calculateCapitalRetention(clientData: ClientData): number {
    const annualIncome = clientData.monthlyIncome * 12;
    const requiredReturn = 0.04; // 4% retorno real anual (acima da inflação)
    const replacementRate = 0.70; // 70% da renda necessária para dependentes
    
    // Capital necessário para gerar renda perpétua
    const capitalNeeded = (annualIncome * replacementRate) / requiredReturn;
    
    // Ajuste para qualidade de vida dos dependentes
    const lifestyleAdjustment = clientData.despesasMensais 
      ? (clientData.despesasMensais * 12 * 0.8) / requiredReturn 
      : capitalNeeded * 0.2;
    
    return capitalNeeded + lifestyleAdjustment;
  }

  // Stress Testing - Análise de cenários
  private performStressTests(baseAmount: number, clientData: ClientData): any {
    const scenarios = {
      conservative: baseAmount * 1.2,  // +20% para cenário conservador
      moderate: baseAmount,           // Cenário base
      optimistic: baseAmount * 0.8,   // -20% para cenário otimista
      inflationStress: baseAmount * 1.15, // +15% para stress de inflação
      interestRateStress: baseAmount * 1.1 // +10% para stress de taxa de juros
    };

    return {
      scenarios,
      recommendation: scenarios.conservative, // Sempre recomendar o cenário mais conservador
      reasoning: "Recomendação baseada em cenário conservador para maior segurança"
    };
  }

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
    // Implementação das metodologias HLV, DIME e Capital Retention
    const retirementAge = 65;
    const yearsToRetirement = Math.max(retirementAge - clientData.age, 5);
    const annualIncome = clientData.monthlyIncome * 12;
    
    // Calcular pelos três métodos
    const hlvAmount = this.calculateHumanLifeValue(clientData, yearsToRetirement);
    const dimeAmount = this.calculateDIMEMethod(clientData);
    const capitalRetentionAmount = this.calculateCapitalRetention(clientData);
    
    // Usar o maior valor entre as metodologias, mas considerar 80% do HLV como mínimo
    const minHlvAmount = hlvAmount * 0.8;
    const totalAmount = Math.max(minHlvAmount, dimeAmount, capitalRetentionAmount);
    
    // Aplicar multiplicadores de risco
    const adjustedAmount = totalAmount * riskFactors.totalMultiplier;
    
    // Considerar ativos existentes (reduzem a necessidade)
    const existingAssets = (clientData.valorInvestimento || 0) + 
                          (clientData.reservasFinanceiras || 0) * 0.8; // 80% das reservas
    
    // Determinar período de cobertura baseado no perfil
    let replacementYears = yearsToRetirement;
    if (clientData.hasDependents) {
      replacementYears = Math.max(20 - Math.floor((clientData.age - 30) / 5), 12);
    } else if (clientData.estadoCivil === 'casado' || clientData.estadoCivil === 'uniao_estavel') {
      replacementYears = 12;
    } else {
      replacementYears = Math.min(yearsToRetirement, 15);
    }
    
    const riskFactorsList = [
      `Idade ${clientData.age} anos`,
      `Saúde ${clientData.healthStatus}`,
      riskFactors.professionCategory,
      clientData.hasDependents ? `${clientData.dependentsCount} dependente(s)` : "Sem dependentes",
      ...(clientData.fumante ? ["Fumante"] : []),
      ...(clientData.praticaEsportesRisco ? ["Esportes de risco"] : []),
      ...(clientData.historicoDoencasGravesFamilia ? ["Histórico familiar"] : [])
    ];

    let justification = `Baseado na metodologia de substituição de renda, calculamos ${replacementYears} anos de cobertura considerando sua renda anual de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(annualIncome)}. `;
    
    if (clientData.currentDebts > 0) {
      justification += `Incluímos quitação de dívidas (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(clientData.currentDebts)}), `;
    }
    
    if (clientData.hasDependents && clientData.dependentsData?.length) {
      const educationCosts = this.calculateEducationCosts(clientData);
      const dependentsInfo = clientData.dependentsData.map(dep => 
        `${dep.age} anos (${dep.educationType}, ${dep.yearsUntilEducationComplete} anos restantes)`
      ).join(', ');
      justification += `custos educacionais detalhados para dependentes (${dependentsInfo}) no valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(educationCosts)}, `;
    } else if (clientData.hasDependents) {
      justification += `custos educacionais estimados para ${clientData.dependentsCount} dependente(s), `;
    } else {
      justification += `reservas para gastos futuros, `;
    }
    
    if (existingAssets > 0) {
      justification += `Consideramos seus investimentos e reservas existentes de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(existingAssets)} no cálculo.`;
    }

    return {
      type: "Morte",
      amount: Math.round(Math.max(100000, adjustedAmount - existingAssets)),
      justification,
      priority: "high" as const,
      riskFactors: riskFactorsList,
      calculationBasis: `Baseado em metodologias atuariais HLV/DIME`
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
    const monthlyExpenses = clientData.despesasMensais || (clientData.monthlyIncome * 0.7);
    const treatmentCosts = monthlyExpenses * 24; // 24 meses de despesas durante tratamento
    const medicalExpenses = Math.max(80000, clientData.monthlyIncome * 8); // Mínimo R$ 80k ou 8x renda mensal
    
    const totalAmount = treatmentCosts + medicalExpenses;
    
    // Avaliar prioridade baseada em fatores de risco
    let priority: "high" | "medium" | "low" = "medium";
    if (clientData.healthStatus === "precario" || clientData.healthStatus === "regular" ||
        clientData.historicoDoencasGravesFamilia || clientData.fumante || clientData.age > 45) {
      priority = "high";
    }

    const riskFactorsList = [
      `Estado de saúde: ${clientData.healthStatus}`,
      `Idade ${clientData.age} anos`,
      ...(clientData.historicoDoencasGravesFamilia ? ["Histórico familiar de doenças graves"] : []),
      ...(clientData.fumante ? ["Fumante - alto risco cardiovascular"] : []),
      "Custos de tratamentos especializados"
    ];

    let justification = `Calculada para cobrir 24 meses de despesas mensais (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monthlyExpenses)}) durante tratamento, mais despesas médicas não cobertas por planos de saúde. `;
    
    if (clientData.historicoDoencasGravesFamilia) {
      justification += `Com histórico familiar de doenças graves, esta proteção é fundamental. `;
    }
    
    if (clientData.fumante) {
      justification += `Como fumante, o risco de doenças cardiovasculares e câncer é significativamente maior. `;
    }
    
    justification += `Esta cobertura oferece tranquilidade financeira durante momentos críticos.`;

    return {
      type: "Doenças Graves",
      amount: Math.round(totalAmount),
      justification,
      priority,
      riskFactors: riskFactorsList,
      calculationBasis: "24 meses despesas + tratamentos"
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
    // Calcular fatores de risco aprimorados
    const ageRiskFactor = this.getAgeRiskFactor(clientData.age);
    let healthRiskFactor = this.getHealthRiskFactor(clientData.healthStatus);
    const professionRisk = this.getProfessionRiskFactor(clientData.profession);
    const dependentsImpact = this.getDependentsImpactFactor(clientData.hasDependents, clientData.dependentsCount);
    
    // Aplicar fatores de estilo de vida
    let lifestyleMultiplier = 1.0;
    if (clientData.fumante) lifestyleMultiplier *= 1.8;
    if (clientData.praticaEsportesRisco) lifestyleMultiplier *= 1.3;
    if (clientData.historicoDoencasGravesFamilia) {
      healthRiskFactor *= 1.2; // Aumenta o risco de saúde
    }
    
    const riskFactors = {
      ageRiskFactor,
      healthRiskFactor,
      professionRiskFactor: professionRisk.multiplier,
      professionCategory: professionRisk.category,
      dependentsImpact,
      lifestyleMultiplier,
      totalMultiplier: ageRiskFactor * healthRiskFactor * professionRisk.multiplier * dependentsImpact * lifestyleMultiplier
    };

    // Calcular coberturas
    let coverages: CoverageRecommendation[] = [
      this.calculateLifeInsurance(clientData, riskFactors),
      this.calculateDisabilityInsurance(clientData, riskFactors),
      this.calculateCriticalIllnessInsurance(clientData, riskFactors),
      this.calculateDailyIncapacityInsurance(clientData),
      this.calculateFuneralInsurance(clientData)
    ];

    // Regra: Jovens (<25) sem dependentes não recebem "Morte" automaticamente
    if (clientData.age < 25 && !clientData.hasDependents) {
      coverages = coverages.filter(c => c.type.toLowerCase() !== 'morte');
    }

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
        ageRiskFactor: ageRiskFactor - 1,
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
    
    let summary = `**ANÁLISE COMPLETA DE SEGUROS DE VIDA**\n\n`;
    
    // Perfil do cliente
    summary += `👤 **Perfil do Cliente:**\n`;
    summary += `• ${clientData.name}, ${clientData.age} anos, ${clientData.profession.toLowerCase()}\n`;
    summary += `• Estado civil: ${clientData.estadoCivil || 'Não informado'}\n`;
    summary += `• Renda mensal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(clientData.monthlyIncome)}\n`;
    if (clientData.patrimonio) {
      summary += `• Patrimônio: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(clientData.patrimonio)}\n`;
    }
    summary += `• Dependentes: ${clientData.hasDependents ? `${clientData.dependentsCount} pessoa(s)` : 'Nenhum'}\n`;
    
    // Fatores de risco identificados
    summary += `\n⚠️ **Fatores de Risco Identificados:**\n`;
    if (clientData.fumante) summary += `• Fumante - risco cardiovascular e oncológico elevado\n`;
    if (clientData.praticaEsportesRisco) summary += `• Esportes de risco - maior exposição a acidentes\n`;
    if (clientData.historicoDoencasGravesFamilia) summary += `• Histórico familiar - predisposição genética\n`;
    if (clientData.age > 50) summary += `• Idade avançada - maior probabilidade de problemas de saúde\n`;
    summary += `• Multiplicador de risco total: ${riskFactors.totalMultiplier.toFixed(2)}x\n`;
    
    // Coberturas recomendadas
    summary += `\n📋 **Coberturas Recomendadas:**\n`;
    coverages.forEach(coverage => {
      const priority = coverage.priority === 'high' ? '🔴 ALTA' : 
                     coverage.priority === 'medium' ? '🟡 MÉDIA' : '🟢 BAIXA';
      summary += `${priority} - ${coverage.type}: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(coverage.amount)}\n`;
    });
    
    summary += `\n💰 **Investimento Total:** ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCoverage)}\n`;
    summary += `🎯 **Coberturas Prioritárias:** ${highPriorityCoverages} de ${coverages.length}\n\n`;
    
    // Justificativa
    if (clientData.hasDependents) {
      summary += `**Por que é essencial:** Com ${clientData.dependentsCount} dependente(s), sua família depende de sua renda para manter o padrão de vida. `;
    } else {
      summary += `**Por que é importante:** Mesmo sem dependentes diretos, ter proteção evita ser um encargo financeiro para sua família. `;
    }
    summary += `As coberturas recomendadas seguem metodologias atuariais reconhecidas e garantem tranquilidade financeira.\n\n`;
    
    // Próximos passos
    summary += `**Próximos Passos:**\n`;
    summary += `1. Revisar e ajustar valores conforme orçamento disponível\n`;
    summary += `2. Comparar produtos de diferentes seguradoras\n`;
    summary += `3. Priorizar contratação das coberturas de alta prioridade (🔴)\n`;
    summary += `4. Considerar parcelamento e condições de pagamento\n`;
    
    if (clientData.corretorParceiro) {
      summary += `\n🤝 **Corretor Parceiro:** ${clientData.corretorParceiro}`;
    }
    
    return summary;
  }
}

export const insuranceCalculator = new InsuranceCalculatorService();