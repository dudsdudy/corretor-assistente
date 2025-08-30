import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  ArrowLeft, 
  Plus,
  ArrowRight,
  Calendar,
  DollarSign,
  Download
} from "lucide-react";
import { User } from '@supabase/supabase-js';
import AppHeader from "@/components/AppHeader";

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

const Sales = () => {
  const [user, setUser] = useState<User | null>(null);
  const [analyses, setAnalyses] = useState<ClientAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
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
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const moveToStatus = async (analysisId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('client_analyses')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', analysisId);

      if (error) throw error;

      setAnalyses(prev => 
        prev.map(analysis => 
          analysis.id === analysisId 
            ? { ...analysis, status: newStatus, updated_at: new Date().toISOString() }
            : analysis
        )
      );

      toast({
        title: "Status atualizado",
        description: `Lead movido para "${getStatusLabel(newStatus)}"`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDragStart = (e: React.DragEvent, analysisId: string) => {
    e.dataTransfer.setData("text/plain", analysisId);
    setDraggedItem(analysisId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const analysisId = e.dataTransfer.getData("text/plain");
    if (analysisId && analysisId !== draggedItem) return;
    
    if (analysisId) {
      moveToStatus(analysisId, newStatus);
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'novo': 'Novo Lead',
      'contato': 'Primeiro Contato',
      'proposta': 'Proposta Enviada',
      'negociacao': 'Em Negociação',
      'fechado': 'Venda Fechada',
      'perdido': 'Perdido'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'novo': 'bg-blue-100 text-blue-800 border-blue-200',
      'contato': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'proposta': 'bg-purple-100 text-purple-800 border-purple-200',
      'negociacao': 'bg-orange-100 text-orange-800 border-orange-200',
      'fechado': 'bg-green-100 text-green-800 border-green-200',
      'perdido': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const kanbanColumns = [
    { id: 'novo', title: 'Novos Leads', color: 'bg-blue-50 border-blue-200' },
    { id: 'contato', title: 'Primeiro Contato', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'proposta', title: 'Proposta Enviada', color: 'bg-purple-50 border-purple-200' },
    { id: 'negociacao', title: 'Em Negociação', color: 'bg-orange-50 border-orange-200' },
    { id: 'fechado', title: 'Vendas Fechadas', color: 'bg-green-50 border-green-200' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="animate-pulse text-lg text-muted-foreground">Carregando pipeline...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <AppHeader showBackButton={true} title="Gestão de Vendas" subtitle="Pipeline comercial e acompanhamento de oportunidades" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Action Bar */}
        <div className="flex items-center justify-end mb-8">

          <Button onClick={() => navigate("/")} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {kanbanColumns.map((column) => {
            const count = analyses.filter(a => a.status === column.id).length;
            return (
              <Card key={column.id} className={column.color}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {kanbanColumns.map((column) => {
            const columnAnalyses = analyses.filter(a => a.status === column.id);
            
            return (
              <Card 
                key={column.id} 
                className={`${column.color} min-h-[500px]`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    {column.title}
                    <Badge variant="secondary">{columnAnalyses.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {columnAnalyses.slice(0, 5).map((analysis) => (
                    <Card 
                      key={analysis.id} 
                      className={`bg-background shadow-sm hover:shadow-md transition-shadow cursor-move ${
                        draggedItem === analysis.id ? 'opacity-50' : ''
                      }`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, analysis.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{analysis.client_name}</CardTitle>
                          <div className="flex gap-1">
                            {/* Download Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                toast({
                                  title: "Download do Estudo",
                                  description: "Funcionalidade em desenvolvimento",
                                });
                              }}
                              className="h-6 w-6 p-0"
                              title="Baixar estudo"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                            
                            {/* Next Status Button */}
                            {column.id !== 'fechado' && column.id !== 'perdido' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const statusFlow: Record<string, string> = {
                                    'novo': 'contato',
                                    'contato': 'proposta',
                                    'proposta': 'negociacao',
                                    'negociacao': 'fechado'
                                  };
                                  const nextStatus = statusFlow[analysis.status];
                                  if (nextStatus) {
                                    moveToStatus(analysis.id, nextStatus);
                                  }
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">{analysis.risk_profile}</Badge>
                          </div>
                          {analysis.client_age && (
                            <p>{analysis.client_age} anos • {analysis.client_profession}</p>
                          )}
                          {analysis.monthly_income && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {new Intl.NumberFormat('pt-BR', { 
                                style: 'currency', 
                                currency: 'BRL' 
                              }).format(analysis.monthly_income)}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Show "Load More" if there are more than 5 items */}
                  {columnAnalyses.length > 5 && (
                    <div className="text-center py-2">
                      <Badge variant="secondary" className="text-xs">
                        +{columnAnalyses.length - 5} mais lead{columnAnalyses.length - 5 > 1 ? 's' : ''}
                      </Badge>
                    </div>
                  )}
                  
                  {columnAnalyses.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg">
                      <p className="text-sm">Arraste leads para esta coluna</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {analyses.length === 0 && (
          <Card className="mt-8">
            <CardContent className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma oportunidade ainda</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando seu primeiro estudo de seguro de vida para alimentar seu pipeline de vendas.
              </p>
              <Button onClick={() => navigate("/")} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Estudo
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Sales;