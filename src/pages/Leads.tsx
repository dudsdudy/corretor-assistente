import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  ArrowLeft, 
  FileText, 
  Calendar,
  Eye,
  Trash2,
  Filter,
  Download
} from "lucide-react";
import * as XLSX from "xlsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from '@supabase/supabase-js';
import AppHeader from "@/components/AppHeader";
import LeadHistoryDialog from "@/components/LeadHistoryDialog";

interface ClientAnalysis {
  id: string;
  client_name: string;
  risk_profile: string;
  status: string;
  created_at: string;
  updated_at: string;
  client_age?: number;
  monthly_income?: number;
  client_profession?: string;
  recommended_coverage?: any;
}

const Leads = () => {
  const [user, setUser] = useState<User | null>(null);
  const [analyses, setAnalyses] = useState<ClientAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selectedAnalysis, setSelectedAnalysis] = useState<ClientAnalysis | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchAnalyses();
      }
    };
    getUser();
  }, []);

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('client_analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar leads",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (analysisId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('client_analyses')
        .update({ status: newStatus })
        .eq('id', analysisId);

      if (error) throw error;

      // Update local state
      setAnalyses(prev => 
        prev.map(analysis => 
          analysis.id === analysisId 
            ? { ...analysis, status: newStatus }
            : analysis
        )
      );

      toast({
        title: "Status atualizado",
        description: `Lead marcado como "${getStatusLabel(newStatus)}"`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteAnalysis = async (analysisId: string) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;

    try {
      const { error } = await supabase
        .from('client_analyses')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;

      setAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));

      toast({
        title: "Lead excluído",
        description: "Lead removido com sucesso",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir lead",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'novo': 'Novo',
      'contato': 'Em Contato',
      'proposta': 'Proposta Enviada',
      'negociacao': 'Em Negociação',
      'fechado': 'Fechado',
      'perdido': 'Perdido'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'novo': 'bg-blue-500',
      'contato': 'bg-yellow-500',
      'proposta': 'bg-purple-500',
      'negociacao': 'bg-orange-500',
      'fechado': 'bg-green-500',
      'perdido': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  // Calcula o prêmio total mensal somando os prêmios das coberturas armazenadas
  const computeTotalMonthlyPremium = (analysis: ClientAnalysis): number => {
    const rc = analysis.recommended_coverage as any;
    let total = 0;
    if (!rc) return 0;
    if (Array.isArray(rc)) {
      for (const c of rc) {
        const v = (c as any).monthly_premium ?? (c as any).monthlyPremium ?? 0;
        total += Number(v) || 0;
      }
    } else if (typeof rc === 'object') {
      for (const key of Object.keys(rc)) {
        const item: any = rc[key];
        const v = item?.monthly_premium ?? item?.monthlyPremium ?? 0;
        total += Number(v) || 0;
      }
    }
    return total;
  };

  // Exporta relatório Excel com resumo por prêmio
  const exportToExcel = () => {
    const rows = (statusFilter === "todos" ? analyses : filteredAnalyses).map(a => {
      const totalPremium = computeTotalMonthlyPremium(a);
      return {
        Cliente: a.client_name,
        Status: getStatusLabel(a.status),
        Data: new Date(a.created_at).toLocaleDateString('pt-BR'),
        PremioTotalMensal: Number(totalPremium.toFixed(2))
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads");
    XLSX.writeFile(wb, `leads_premios_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const filteredAnalyses = statusFilter === "todos" 
    ? analyses 
    : analyses.filter(analysis => analysis.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="animate-pulse text-lg text-muted-foreground">Carregando leads...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <AppHeader showBackButton={true} title="Painel de Leads" subtitle="Gerencie suas oportunidades de negócio" />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Filters */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="novo">Novos</SelectItem>
                <SelectItem value="contato">Em Contato</SelectItem>
                <SelectItem value="proposta">Proposta Enviada</SelectItem>
                <SelectItem value="negociacao">Em Negociação</SelectItem>
                <SelectItem value="fechado">Fechados</SelectItem>
                <SelectItem value="perdido">Perdidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel (Prêmios)
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{analyses.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Novos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {analyses.filter(a => a.status === 'novo').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fechados</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {analyses.filter(a => a.status === 'fechado').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                {analyses.length > 0 
                  ? Math.round((analyses.filter(a => a.status === 'fechado').length / analyses.length) * 100)
                  : 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Leads e Oportunidades
            </CardTitle>
            <CardDescription>
              {filteredAnalyses.length} lead(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredAnalyses.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum lead encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === "todos" 
                    ? "Comece criando seu primeiro estudo de seguro de vida."
                    : `Nenhum lead com status "${getStatusLabel(statusFilter)}" encontrado.`
                  }
                </p>
                <Button onClick={() => navigate("/")} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Criar Novo Estudo
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Prêmio Mensal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnalyses.map((analysis) => (
                    <TableRow key={analysis.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{analysis.client_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {analysis.client_age && `${analysis.client_age} anos`}
                            {analysis.client_profession && ` • ${analysis.client_profession}`}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(computeTotalMonthlyPremium(analysis))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={analysis.status}
                          onValueChange={(value) => updateStatus(analysis.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(analysis.status)}`} />
                              <span className="text-xs">{getStatusLabel(analysis.status)}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="novo">Novo</SelectItem>
                            <SelectItem value="contato">Em Contato</SelectItem>
                            <SelectItem value="proposta">Proposta Enviada</SelectItem>
                            <SelectItem value="negociacao">Em Negociação</SelectItem>
                            <SelectItem value="fechado">Fechado</SelectItem>
                            <SelectItem value="perdido">Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(analysis.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedAnalysis(analysis);
                              setIsHistoryDialogOpen(true);
                            }}
                            title="Ver histórico do estudo"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteAnalysis(analysis.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <LeadHistoryDialog
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
        analysis={selectedAnalysis}
      />
    </div>
  );
};

export default Leads;