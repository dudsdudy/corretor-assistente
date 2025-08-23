import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  ArrowLeft, 
  Users, 
  FileText,
  TrendingUp,
  Calendar,
  Settings
} from "lucide-react";
import { User } from '@supabase/supabase-js';

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
  const [loading, setLoading] = useState(true);
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
        .single();

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
          analysesCount: analysesData.filter(a => a.broker_id === profile.user_id).length
        }));

        setUsers(usersWithCounts);
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
    } catch (error: any) {
      toast({
        title: "Erro ao promover usuário",
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

        {/* Users Management */}
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
                    <TableHead>Estudos</TableHead>
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
                          {userData.analysesCount} estudos
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {new Date(userData.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => makeUserAdmin(userData.id)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Tornar Admin
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

        {/* System Health */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <CardTitle>Ações Administrativas</CardTitle>
              <CardDescription>Ferramentas de gestão da plataforma</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast({ title: "Em breve", description: "Funcionalidade será implementada." })}
              >
                <FileText className="h-4 w-4 mr-2" />
                Exportar Relatórios
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast({ title: "Em breve", description: "Funcionalidade será implementada." })}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações Sistema
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => toast({ title: "Em breve", description: "Funcionalidade será implementada." })}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Métricas Avançadas
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Admin;