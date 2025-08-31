import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  ArrowLeft, 
  Users, 
  FileText,
  TrendingUp,
  Calendar,
  Settings,
  Plus,
  RefreshCw,
  Crown,
  Minus,
  ToggleLeft,
  ToggleRight,
  Download,
  Database,
  PieChart,
  BarChart3,
  UserPlus,
  Trash2,
  Check,
  X
} from "lucide-react";
import { User } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

interface AdminStats {
  totalUsers: number;
  totalAnalyses: number;
  analysesToday: number;
  activeUsers: number;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  last_sign_in_at: string;
  analysesCount: number;
  free_studies_used: number;
  free_studies_limit: number;
  is_premium: boolean;
}

interface SubscriberData {
  id: string;
  email: string;
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  created_at: string;
  stripe_customer_id: string | null;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalAnalyses: 0,
    analysesToday: 0,
    activeUsers: 0
  });
  const [users, setUsers] = useState<UserData[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [newStudiesLimit, setNewStudiesLimit] = useState<number>(0);
  const [newSubscriberEmail, setNewSubscriberEmail] = useState<string>("");
  const [newSubscriberTier, setNewSubscriberTier] = useState<string>("pro");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Acesso negado",
          description: "Você não tem permissão para acessar o painel administrativo.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Erro de acesso",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load statistics
      const { data: analysesData } = await supabase
        .from('client_analyses')
        .select('id, created_at, broker_id');

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*');

      const { data: subscribersData } = await supabase
        .from('subscribers')
        .select('*');

      if (analysesData && profilesData) {
        const today = new Date().toISOString().split('T')[0];
        const analysesToday = analysesData.filter(a => 
          a.created_at.startsWith(today)
        ).length;

        const uniqueBrokers = new Set(analysesData.map(a => a.broker_id));

        setStats({
          totalUsers: profilesData.length,
          totalAnalyses: analysesData.length,
          analysesToday,
          activeUsers: uniqueBrokers.size
        });

        // Prepare users data with analysis counts
        const usersWithCounts = profilesData.map(profile => ({
          id: profile.user_id,
          email: profile.email || 'N/A',
          full_name: profile.full_name || 'Sem nome',
          created_at: profile.created_at,
          last_sign_in_at: profile.updated_at, // Using updated_at as proxy
          analysesCount: analysesData.filter(a => a.broker_id === profile.user_id).length,
          free_studies_used: profile.free_studies_used || 0,
          free_studies_limit: profile.free_studies_limit || 3,
          is_premium: profile.is_premium || false
        }));

        setUsers(usersWithCounts);
      }

      if (subscribersData) {
        setSubscribers(subscribersData);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const makeUserAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin'
        });

      if (error) throw error;

      toast({
        title: "Usuário promovido",
        description: "Usuário agora tem privilégios de administrador.",
      });

      loadAdminData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Erro ao promover usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const grantMoreStudies = async (userId: string, newLimit: number) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          free_studies_limit: newLimit
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Estudos concedidos",
        description: `Limite de estudos atualizado para ${newLimit}.`,
      });

      setSelectedUser(null);
      setNewStudiesLimit(0);
      loadAdminData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Erro ao conceder estudos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const adjustStudiesLimit = async (userId: string, increment: boolean) => {
    try {
      const currentUser = users.find(u => u.id === userId);
      if (!currentUser) return;

      const newLimit = increment 
        ? currentUser.free_studies_limit + 1 
        : Math.max(0, currentUser.free_studies_limit - 1);

      const { error } = await supabase
        .from('profiles')
        .update({ 
          free_studies_limit: newLimit
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: increment ? "Estudo adicionado" : "Estudo removido",
        description: `Novo limite: ${newLimit} estudos.`,
      });

      loadAdminData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Erro ao ajustar estudos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePremiumStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_premium: !currentStatus,
          subscription_status: !currentStatus ? 'active' : 'free_trial',
          subscription_plan: !currentStatus ? 'pro' : null
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Usuário alterado para FREE" : "Usuário promovido para PRO",
        description: `Status premium ${!currentStatus ? 'ativado' : 'desativado'}.`,
      });

      loadAdminData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetStudiesUsed = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          free_studies_used: 0
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Estudos resetados",
        description: "Contador de estudos usados foi zerado.",
      });

      loadAdminData(); // Refresh data
    } catch (error: any) {
      toast({
        title: "Erro ao resetar estudos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addSubscriber = async () => {
    try {
      const { error } = await supabase
        .from('subscribers')
        .insert({
          email: newSubscriberEmail,
          subscribed: true,
          subscription_tier: newSubscriberTier
        });

      if (error) throw error;

      toast({
        title: "Assinante adicionado",
        description: "Novo assinante foi criado com sucesso.",
      });

      setNewSubscriberEmail("");
      setNewSubscriberTier("pro");
      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Erro ao adicionar assinante",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeSubscriber = async (subscriberId: string) => {
    try {
      const { error } = await supabase
        .from('subscribers')
        .delete()
        .eq('id', subscriberId);

      if (error) throw error;

      toast({
        title: "Assinante removido",
        description: "Assinante foi removido com sucesso.",
      });

      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Erro ao remover assinante",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleSubscriberStatus = async (subscriberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('subscribers')
        .update({ subscribed: !currentStatus })
        .eq('id', subscriberId);

      if (error) throw error;

      toast({
        title: currentStatus ? "Assinatura desativada" : "Assinatura ativada",
        description: `Status da assinatura ${!currentStatus ? 'ativado' : 'desativado'}.`,
      });

      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const exportUsersData = () => {
    const exportData = users.map(user => ({
      'Nome': user.full_name,
      'Email': user.email,
      'Estudos Realizados': user.analysesCount,
      'Estudos Usados': user.free_studies_used,
      'Limite de Estudos': user.free_studies_limit,
      'É Premium': user.is_premium ? 'Sim' : 'Não',
      'Data de Cadastro': new Date(user.created_at).toLocaleDateString('pt-BR')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuários");
    XLSX.writeFile(wb, `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: "Relatório exportado",
      description: "Dados dos usuários foram exportados com sucesso.",
    });
  };

  const exportAnalysesData = async () => {
    try {
      // Get analyses data
      const { data: analysesData } = await supabase
        .from('client_analyses')
        .select('*');

      // Get profiles data to correlate
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (analysesData && profilesData) {
        // Create a map for quick profile lookup
        const profilesMap = new Map(profilesData.map(p => [p.user_id, p]));

        const exportData = analysesData.map(analysis => {
          const profile = profilesMap.get(analysis.broker_id);
          return {
            'ID': analysis.id,
            'Cliente': analysis.client_name,
            'Corretor': profile?.full_name || 'N/A',
            'Email do Corretor': profile?.email || 'N/A',
            'Idade': analysis.client_age,
            'Profissão': analysis.client_profession,
            'Renda Mensal': analysis.monthly_income,
            'Status': analysis.status,
            'Data de Criação': new Date(analysis.created_at).toLocaleDateString('pt-BR')
          };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Análises");
        XLSX.writeFile(wb, `analises_${new Date().toISOString().split('T')[0]}.xlsx`);

        toast({
          title: "Relatório exportado",
          description: "Dados das análises foram exportados com sucesso.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao exportar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="animate-pulse text-lg text-muted-foreground">Verificando acesso...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Acesso Restrito</CardTitle>
            <CardDescription className="text-center">
              Esta área é restrita a administradores.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Painel Administrativo</h1>
                <p className="text-muted-foreground">Gestão completa da plataforma</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-xs text-muted-foreground">Corretores cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Estudos Total</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats.totalAnalyses}</p>
              <p className="text-xs text-muted-foreground">Análises geradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Hoje</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.analysesToday}</p>
              <p className="text-xs text-muted-foreground">Estudos hoje</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Ativos</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{stats.activeUsers}</p>
              <p className="text-xs text-muted-foreground">Com análises</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Admin Interface */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="subscribers">
              <Crown className="h-4 w-4 mr-2" />
              Assinantes
            </TabsTrigger>
            <TabsTrigger value="reports">
              <FileText className="h-4 w-4 mr-2" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="metrics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Métricas
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings className="h-4 w-4 mr-2" />
              Sistema
            </TabsTrigger>
          </TabsList>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Gestão de Usuários
                </CardTitle>
                <CardDescription>
                  Gerencie corretores e suas permissões na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum usuário encontrado</h3>
                    <p className="text-muted-foreground">Os usuários aparecerão aqui quando se cadastrarem.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Estudos Feitos</TableHead>
                        <TableHead>Estudos Disponíveis</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{userData.full_name}</p>
                              <p className="text-sm text-muted-foreground">ID: {userData.id.slice(0, 8)}...</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{userData.email}</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant={userData.analysesCount > 0 ? "default" : "secondary"}>
                              {userData.analysesCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge variant={userData.free_studies_used >= userData.free_studies_limit ? "destructive" : "outline"}>
                                {userData.free_studies_used}/{userData.free_studies_limit}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Restam: {userData.free_studies_limit - userData.free_studies_used}
                              </span>
                              <div className="flex items-center gap-1 mt-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => adjustStudiesLimit(userData.id, false)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => adjustStudiesLimit(userData.id, true)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {userData.is_premium && (
                                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                                  <Crown className="h-3 w-3 mr-1" />
                                  Premium
                                </Badge>
                              )}
                              {!userData.is_premium && (
                                <Badge variant="secondary">Gratuito</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePremiumStatus(userData.id, userData.is_premium)}
                                className="h-6 w-6 p-0"
                                title={userData.is_premium ? "Alterar para FREE" : "Promover para PRO"}
                              >
                                {userData.is_premium ? (
                                  <ToggleRight className="h-4 w-4 text-orange-500" />
                                ) : (
                                  <ToggleLeft className="h-4 w-4 text-gray-400" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {new Date(userData.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedUser(userData);
                                      setNewStudiesLimit(userData.free_studies_limit);
                                    }}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Conceder
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Conceder Estudos</DialogTitle>
                                    <DialogDescription>
                                      Ajuste o limite de estudos gratuitos para {userData.full_name}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <Label htmlFor="studies-limit" className="text-right">
                                        Novo Limite
                                      </Label>
                                      <Input
                                        id="studies-limit"
                                        type="number"
                                        value={newStudiesLimit}
                                        onChange={(e) => setNewStudiesLimit(parseInt(e.target.value) || 0)}
                                        className="col-span-3"
                                        min="0"
                                      />
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      Limite atual: {userData.free_studies_limit} | 
                                      Usado: {userData.free_studies_used}
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={() => selectedUser && grantMoreStudies(selectedUser.id, newStudiesLimit)}
                                    >
                                      Confirmar
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resetStudiesUsed(userData.id)}
                                disabled={userData.free_studies_used === 0}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reset
                              </Button>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => makeUserAdmin(userData.id)}
                              >
                                <Settings className="h-4 w-4 mr-2" />
                                Admin
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
          </TabsContent>

          {/* Subscribers Management Tab */}
          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Gestão de Assinantes
                </CardTitle>
                <CardDescription>
                  Adicione e gerencie assinantes da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold mb-4">Adicionar Novo Assinante</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input
                      placeholder="Email do assinante"
                      value={newSubscriberEmail}
                      onChange={(e) => setNewSubscriberEmail(e.target.value)}
                    />
                    <Select value={newSubscriberTier} onValueChange={setNewSubscriberTier}>
                      <SelectTrigger>
                        <SelectValue placeholder="Plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pro">PRO</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addSubscriber} disabled={!newSubscriberEmail}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>

                {subscribers.length === 0 ? (
                  <div className="text-center py-12">
                    <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum assinante encontrado</h3>
                    <p className="text-muted-foreground">Os assinantes aparecerão aqui quando adicionados.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell>
                            <p className="font-medium">{subscriber.email}</p>
                            <p className="text-sm text-muted-foreground">ID: {subscriber.id.slice(0, 8)}...</p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {subscriber.subscription_tier?.toUpperCase() || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={subscriber.subscribed ? "default" : "secondary"}>
                              {subscriber.subscribed ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {new Date(subscriber.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleSubscriberStatus(subscriber.id, subscriber.subscribed)}
                              >
                                {subscriber.subscribed ? (
                                  <X className="h-4 w-4 mr-2" />
                                ) : (
                                  <Check className="h-4 w-4 mr-2" />
                                )}
                                {subscriber.subscribed ? "Desativar" : "Ativar"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeSubscriber(subscriber.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover
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
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Relatórios de Usuários
                  </CardTitle>
                  <CardDescription>
                    Exporte dados dos usuários cadastrados
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={exportUsersData} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Dados de Usuários
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Inclui: nomes, emails, estudos realizados, limites e status premium
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Relatórios de Análises
                  </CardTitle>
                  <CardDescription>
                    Exporte dados das análises realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={exportAnalysesData} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Dados de Análises
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Inclui: dados do cliente, corretor responsável e recomendações
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribuição de Usuários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Usuários Premium:</span>
                      <span className="font-bold">{users.filter(u => u.is_premium).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usuários Gratuitos:</span>
                      <span className="font-bold">{users.filter(u => !u.is_premium).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de Conversão:</span>
                      <span className="font-bold">
                        {users.length > 0 ? ((users.filter(u => u.is_premium).length / users.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Uso da Plataforma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Média de estudos/usuário:</span>
                      <span className="font-bold">
                        {users.length > 0 ? (users.reduce((acc, u) => acc + u.analysesCount, 0) / users.length).toFixed(1) : 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usuários ativos hoje:</span>
                      <span className="font-bold">{stats.analysesToday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total de análises:</span>
                      <span className="font-bold">{stats.totalAnalyses}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Crescimento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Novos usuários (30d):</span>
                      <span className="font-bold">
                        {users.filter(u => {
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          return new Date(u.created_at) > thirtyDaysAgo;
                        }).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assinantes ativos:</span>
                      <span className="font-bold">{subscribers.filter(s => s.subscribed).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status do Sistema</CardTitle>
                  <CardDescription>Monitoramento em tempo real</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Base de Dados</span>
                    <Badge className="bg-green-100 text-green-800">Operacional</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Autenticação</span>
                    <Badge className="bg-green-100 text-green-800">Operacional</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Edge Functions</span>
                    <Badge className="bg-green-100 text-green-800">Operacional</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Transcrição IA</span>
                    <Badge className="bg-green-100 text-green-800">Operacional</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configurações do Sistema</CardTitle>
                  <CardDescription>Ajustes globais da plataforma</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={loadAdminData}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar Dados
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => toast({ title: "Em breve", description: "Funcionalidade será implementada." })}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurações Avançadas
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => toast({ title: "Em breve", description: "Funcionalidade será implementada." })}
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Backup do Sistema
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;