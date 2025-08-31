import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Calculator, Users, Plus, Trash2 } from "lucide-react";
import ProfessionAutocomplete from "./ProfessionAutocomplete";

export interface ClientData {
  name: string;
  age: number;
  gender: string;
  profession: string;
  monthlyIncome: number;
  hasDependents: boolean;
  dependentsCount: number;
  dependentsData?: DependentInfo[];
  currentDebts: number;
  healthStatus: string;
  existingInsurance: boolean;
  // Novos campos para análise mais completa
  patrimonio?: number;
  despesasMensais?: number;
  reservasFinanceiras?: number;
  estadoCivil?: string;
  fumante?: boolean;
  praticaEsportesRisco?: boolean;
  condicoesMedicasPreExistentes?: string[];
  historicoDoencasGravesFamilia?: boolean;
  // Campos para seguros/investimentos existentes
  coberturasExistentes?: string;
  premioSeguroExistente?: number;
  valorInvestimento?: number;
  // Campo para corretor parceiro
  corretorParceiro?: string;
}

export interface DependentInfo {
  age: number;
  yearsUntilEducationComplete: number;
  educationType: 'superior' | 'medio' | 'tecnico';
  name?: string;
}

interface ClientDataFormProps {
  onSubmit: (data: ClientData) => void;
  loading?: boolean;
}

const ClientDataForm = ({ onSubmit, loading = false }: ClientDataFormProps) => {
  const [formData, setFormData] = useState<ClientData>({
    name: "",
    age: 0,
    gender: "",
    profession: "",
    monthlyIncome: 0,
    hasDependents: false,
    dependentsCount: 0,
    dependentsData: [],
    currentDebts: 0,
    healthStatus: "",
    existingInsurance: false,
  });

  const [showDependentNames, setShowDependentNames] = useState<boolean[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (field: keyof ClientData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addDependent = () => {
    const newDependent: DependentInfo = {
      age: 0,
      yearsUntilEducationComplete: 0,
      educationType: 'superior'
    };
    
    setFormData(prev => ({
      ...prev,
      dependentsData: [...(prev.dependentsData || []), newDependent]
    }));
    
    setShowDependentNames(prev => [...prev, false]);
  };

  const removeDependent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      dependentsData: prev.dependentsData?.filter((_, i) => i !== index) || []
    }));
    
    setShowDependentNames(prev => prev.filter((_, i) => i !== index));
  };

  const updateDependent = (index: number, field: keyof DependentInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      dependentsData: prev.dependentsData?.map((dep, i) => 
        i === index ? { ...dep, [field]: value } : dep
      ) || []
    }));
  };

  const toggleDependentNameField = (index: number) => {
    setShowDependentNames(prev => 
      prev.map((show, i) => i === index ? !show : show)
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-medium bg-gradient-card mobile-form-card">
      <CardHeader className="text-center px-3 sm:px-6">
        <CardTitle className="flex items-center justify-center gap-2 text-base sm:text-xl">
          <FileText className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
          Dados do Cliente
        </CardTitle>
        <CardDescription className="text-xs sm:text-base">
          Preencha as informações para gerar uma recomendação personalizada
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6">
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Nome Completo</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nome do cliente"
                required
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age" className="text-sm font-medium">Idade</Label>
              <Input
                id="age"
                type="number"
                min="18"
                max="85"
                value={formData.age || ""}
                onChange={(e) => handleInputChange("age", parseInt(e.target.value) || 0)}
                placeholder="32"
                required
                className="h-10 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm font-medium">Sexo</Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
                className="flex flex-row gap-4 sm:flex-col sm:gap-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="masculino" id="male" className="h-4 w-4" />
                  <Label htmlFor="male" className="text-sm">Masculino</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="feminino" id="female" className="h-4 w-4" />
                  <Label htmlFor="female" className="text-sm">Feminino</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <ProfessionAutocomplete
                value={formData.profession}
                onChange={(value) => handleInputChange("profession", value)}
              />
            </div>
          </div>

          {/* Financial Information */}
          <div className="border-t pt-3 sm:pt-6">
            <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
              Informações Financeiras
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome" className="text-sm font-medium">Renda Mensal (R$)</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.monthlyIncome || ""}
                  onChange={(e) => handleInputChange("monthlyIncome", parseFloat(e.target.value) || 0)}
                  placeholder="5000.00"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentDebts" className="text-sm font-medium">Dívidas Atuais (R$)</Label>
                <Input
                  id="currentDebts"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.currentDebts || ""}
                  onChange={(e) => handleInputChange("currentDebts", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="h-10 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Family Information */}
          <div className="border-t pt-3 sm:pt-6">
            <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Informações da Família
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasDependents"
                  checked={formData.hasDependents}
                  onCheckedChange={(checked) => {
                    handleInputChange("hasDependents", checked);
                    if (!checked) {
                      handleInputChange("dependentsData", []);
                      handleInputChange("dependentsCount", 0);
                    }
                  }}
                />
                <Label htmlFor="hasDependents">Possui dependentes</Label>
              </div>
              
              {formData.hasDependents && (
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-medium">Dados dos Dependentes</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDependent}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar Dependente
                    </Button>
                  </div>
                  
                   {formData.dependentsData?.map((dependent, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Dependente {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDependent(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {showDependentNames[index] && (
                        <div className="mb-4">
                          <Label>Nome do Dependente</Label>
                          <Input
                            type="text"
                            value={dependent.name || ""}
                            onChange={(e) => updateDependent(index, 'name', e.target.value)}
                            placeholder="Nome do dependente"
                          />
                        </div>
                      )}
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Idade Atual</Label>
                          <Input
                            type="number"
                            min="0"
                            max="30"
                            value={dependent.age || ""}
                            onChange={(e) => updateDependent(index, 'age', parseInt(e.target.value) || 0)}
                            placeholder="10"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Anos até completar estudos</Label>
                          <Input
                            type="number"
                            min="0"
                            max="25"
                            value={dependent.yearsUntilEducationComplete || ""}
                            onChange={(e) => updateDependent(index, 'yearsUntilEducationComplete', parseInt(e.target.value) || 0)}
                            placeholder="8"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Tipo de Educação</Label>
                          <Select
                            value={dependent.educationType}
                            onValueChange={(value) => updateDependent(index, 'educationType', value as DependentInfo['educationType'])}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="medio">Ensino Médio</SelectItem>
                              <SelectItem value="tecnico">Ensino Técnico</SelectItem>
                              <SelectItem value="superior">Ensino Superior</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDependentNameField(index)}
                          className="flex items-center gap-2"
                        >
                          <Users className="h-3 w-3" />
                          {showDependentNames[index] ? "Ocultar Nome" : "Incluir Nome"}
                        </Button>
                      </div>
                    </Card>
                  )) || []}
                  
                  {(!formData.dependentsData || formData.dependentsData.length === 0) && (
                    <div className="text-center p-4 text-muted-foreground">
                      Clique em "Adicionar Dependente" para incluir informações sobre educação
                    </div>
                  )}
                  
                  {formData.dependentsData && formData.dependentsData.length > 0 && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium text-primary">
                        📚 Resumo dos dependentes: {formData.dependentsData.length} dependente(s) cadastrado(s)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total estimado de custos educacionais será calculado com base nas idades e tipos de educação informados
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Health Information */}
          <div className="space-y-2">
            <Label>Estado de Saúde</Label>
            <Select
              value={formData.healthStatus}
              onValueChange={(value) => handleInputChange("healthStatus", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado de saúde" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excelente">Excelente</SelectItem>
                <SelectItem value="bom">Bom</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="precario">Precário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Additional Information */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Informações Adicionais</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado Civil</Label>
                <Select
                  value={formData.estadoCivil || ""}
                  onValueChange={(value) => handleInputChange("estadoCivil", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="uniao_estavel">União Estável</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patrimonio">Patrimônio Total (R$)</Label>
                <Input
                  id="patrimonio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.patrimonio || ""}
                  onChange={(e) => handleInputChange("patrimonio", parseFloat(e.target.value) || 0)}
                  placeholder="100000.00"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="despesasMensais">Despesas Mensais (R$)</Label>
                <Input
                  id="despesasMensais"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.despesasMensais || ""}
                  onChange={(e) => handleInputChange("despesasMensais", parseFloat(e.target.value) || 0)}
                  placeholder="3000.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reservasFinanceiras">Reservas de Emergência (R$)</Label>
                <Input
                  id="reservasFinanceiras"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.reservasFinanceiras || ""}
                  onChange={(e) => handleInputChange("reservasFinanceiras", parseFloat(e.target.value) || 0)}
                  placeholder="10000.00"
                />
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fumante"
                  checked={formData.fumante || false}
                  onCheckedChange={(checked) => handleInputChange("fumante", checked)}
                />
                <Label htmlFor="fumante">É fumante</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="praticaEsportesRisco"
                  checked={formData.praticaEsportesRisco || false}
                  onCheckedChange={(checked) => handleInputChange("praticaEsportesRisco", checked)}
                />
                <Label htmlFor="praticaEsportesRisco">Pratica esportes de risco</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="historicoDoencasGravesFamilia"
                  checked={formData.historicoDoencasGravesFamilia || false}
                  onCheckedChange={(checked) => handleInputChange("historicoDoencasGravesFamilia", checked)}
                />
                <Label htmlFor="historicoDoencasGravesFamilia">Histórico familiar de doenças graves</Label>
              </div>
            </div>
          </div>

          {/* Existing Insurance */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Seguros e Investimentos Existentes</h3>
            
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox
                id="existingInsurance"
                checked={formData.existingInsurance}
                onCheckedChange={(checked) => handleInputChange("existingInsurance", checked)}
              />
              <Label htmlFor="existingInsurance">Já possui seguro de vida</Label>
            </div>

            {formData.existingInsurance && (
              <div className="space-y-4 mb-4">
                <div>
                  <Label className="text-base font-medium">Coberturas Existentes (marque as que possui):</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {[
                      { key: "morte", label: "Morte" },
                      { key: "ipta", label: "IPTA (invalidez)" },
                      { key: "dg", label: "Doenças Graves" },
                      { key: "dit", label: "Diárias" },
                      { key: "funeral", label: "Auxílio Funeral" },
                      { key: "dmh", label: "DMH" }
                    ].map((coverage) => (
                      <div key={coverage.key} className="flex items-center space-x-2">
                        <Checkbox
                          id={`coverage-${coverage.key}`}
                          checked={(formData.coberturasExistentes || "").includes(coverage.key)}
                          onCheckedChange={(checked) => {
                            const existingCoverages = formData.coberturasExistentes || "";
                            const coveragesArray = existingCoverages.split(",").filter(c => c.trim());
                            
                            if (checked) {
                              if (!coveragesArray.includes(coverage.key)) {
                                coveragesArray.push(coverage.key);
                              }
                            } else {
                              const index = coveragesArray.indexOf(coverage.key);
                              if (index > -1) {
                                coveragesArray.splice(index, 1);
                              }
                            }
                            
                            handleInputChange("coberturasExistentes", coveragesArray.join(","));
                          }}
                        />
                        <Label htmlFor={`coverage-${coverage.key}`} className="text-sm">
                          {coverage.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="premioSeguroExistente">Prêmio Atual (R$/mês)</Label>
                  <Input
                    id="premioSeguroExistente"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.premioSeguroExistente || ""}
                    onChange={(e) => handleInputChange("premioSeguroExistente", parseFloat(e.target.value) || 0)}
                    placeholder="150.00"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="valorInvestimento">Investimentos Atuais (R$)</Label>
              <Input
                id="valorInvestimento"
                type="number"
                min="0"
                step="0.01"
                value={formData.valorInvestimento || ""}
                onChange={(e) => handleInputChange("valorInvestimento", parseFloat(e.target.value) || 0)}
                placeholder="50000.00"
              />
            </div>
          </div>

          {/* Corretor Parceiro */}
          <div className="border-t pt-6">
            <div className="space-y-2">
              <Label htmlFor="corretorParceiro">Corretor Parceiro (opcional)</Label>
              <Input
                id="corretorParceiro"
                value={formData.corretorParceiro || ""}
                onChange={(e) => handleInputChange("corretorParceiro", e.target.value)}
                placeholder="Nome e contato do corretor parceiro"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="hero"
            size="xl"
            disabled={loading}
          >
            {loading ? "Gerando Análise..." : "Gerar Recomendação"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClientDataForm;
