import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Briefcase, 
  DollarSign, 
  Shield, 
  Heart, 
  AlertTriangle,
  Calendar,
  FileText
} from "lucide-react";

interface LeadHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: any;
}

const LeadHistoryDialog = ({ isOpen, onClose, analysis }: LeadHistoryDialogProps) => {
  if (!analysis) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCoverageIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'morte':
        return <Heart className="h-4 w-4" />;
      case 'invalidez':
        return <Shield className="h-4 w-4" />;
      case 'doencas_graves':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico do Estudo - {analysis.client_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="font-medium">{analysis.client_name}</p>
                </div>
                {analysis.client_age && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Idade</label>
                    <p className="font-medium">{analysis.client_age} anos</p>
                  </div>
                )}
                {analysis.client_gender && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Gênero</label>
                    <p className="font-medium">{analysis.client_gender === 'M' ? 'Masculino' : 'Feminino'}</p>
                  </div>
                )}
                {analysis.client_profession && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Profissão</label>
                    <p className="font-medium">{analysis.client_profession}</p>
                  </div>
                )}
                {analysis.monthly_income && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Renda Mensal</label>
                    <p className="font-medium">{formatCurrency(Number(analysis.monthly_income))}</p>
                  </div>
                )}
                {analysis.has_dependents !== null && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Dependentes</label>
                    <p className="font-medium">
                      {analysis.has_dependents ? `${analysis.dependents_count || 1} dependente(s)` : 'Não possui'}
                    </p>
                  </div>
                )}
              </div>
              
              {analysis.current_debts && (
                <div className="mt-4 pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground">Dívidas Atuais</label>
                  <p className="font-medium text-destructive">{formatCurrency(Number(analysis.current_debts))}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Risk Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5" />
                Análise de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Perfil de Risco</label>
                  <Badge variant="outline" className="ml-2">{analysis.risk_profile}</Badge>
                </div>
                {analysis.health_status && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado de Saúde</label>
                    <Badge variant="outline" className="ml-2">{analysis.health_status}</Badge>
                  </div>
                )}
                {analysis.existing_insurance !== null && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Seguro Existente</label>
                    <Badge variant={analysis.existing_insurance ? "default" : "secondary"} className="ml-2">
                      {analysis.existing_insurance ? "Sim" : "Não"}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recommended Coverage */}
          {analysis.recommended_coverage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5" />
                  Coberturas Recomendadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(analysis.recommended_coverage).map(([type, coverage]: [string, any]) => (
                    <div key={type} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {getCoverageIcon(type)}
                        <h4 className="font-semibold capitalize">{type.replace('_', ' ')}</h4>
                      </div>
                      
                      {coverage.value && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Valor da Cobertura:</span>
                            <p className="font-medium">{formatCurrency(coverage.value)}</p>
                          </div>
                          {coverage.monthly_premium && (
                            <div>
                              <span className="text-muted-foreground">Prêmio Mensal:</span>
                              <p className="font-medium">{formatCurrency(coverage.monthly_premium)}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {coverage.description && (
                        <p className="text-sm text-muted-foreground mt-2">{coverage.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Justifications */}
          {analysis.justifications && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Justificativas da Análise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analysis.justifications).map(([key, justification]: [string, any]) => (
                    <div key={key} className="border-l-4 border-primary/30 pl-4">
                      <h5 className="font-medium capitalize">{key.replace('_', ' ')}</h5>
                      <p className="text-sm text-muted-foreground">{justification}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <div>
                    <p className="text-sm font-medium">Estudo criado</p>
                    <p className="text-xs text-muted-foreground">{formatDate(analysis.created_at)}</p>
                  </div>
                </div>
                {analysis.updated_at !== analysis.created_at && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
                    <div>
                      <p className="text-sm font-medium">Última atualização</p>
                      <p className="text-xs text-muted-foreground">{formatDate(analysis.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadHistoryDialog;