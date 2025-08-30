import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Settings as SettingsIcon,
  Upload,
  Building2,
  User,
  Mail,
  Clock,
  CreditCard
} from "lucide-react";
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppHeader from "@/components/AppHeader";

const Settings = () => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [reminderDays, setReminderDays] = useState("3");
  const [logoUrl, setLogoUrl] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Load user profile settings
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setCompanyName(profile.full_name || "");
          setLogoUrl(profile.avatar_url || "");
        }
      }
      setLoading(false);
    };
    getUser();
  }, []);

  const handleSaveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: companyName,
          avatar_url: logoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "Suas configurações foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload to Supabase Storage com path do usuário
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      
      toast({
        title: "Logo carregado",
        description: "Sua logo foi carregada com sucesso. Salve as configurações para confirmar.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30">
        <div className="animate-pulse text-lg text-muted-foreground">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      <AppHeader showBackButton={true} title="Configurações" subtitle="Personalize seu perfil e preferências" />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Perfil
              </CardTitle>
              <CardDescription>
                Configure suas informações pessoais e da empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyType">Tipo de Pessoa</Label>
                  <Select value={companyType} onValueChange={setCompanyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pf">Pessoa Física (PF)</SelectItem>
                      <SelectItem value="pj">Pessoa Jurídica (PJ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Corretora/Corretor</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Corretora XYZ Ltda ou João da Silva Seguros"
                />
              </div>
            </CardContent>
          </Card>

          {/* Personalization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Personalização
              </CardTitle>
              <CardDescription>
                Personalize seus estudos e propostas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo da Corretora</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Fazer Upload
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Formatos aceitos: PNG, JPG (máx. 2MB)
                  </p>
                </div>
                {logoUrl && (
                  <div className="mt-2">
                    <img 
                      src={logoUrl} 
                      alt="Logo da corretora" 
                      className="h-16 w-auto border rounded-lg"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Lembretes e Notificações
              </CardTitle>
              <CardDescription>
                Configure quando receber alertas sobre leads parados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Lembrete para leads parados</Label>
                <Select value={reminderDays} onValueChange={setReminderDays}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 dia</SelectItem>
                    <SelectItem value="2">2 dias</SelectItem>
                    <SelectItem value="3">3 dias</SelectItem>
                    <SelectItem value="5">5 dias</SelectItem>
                    <SelectItem value="7">1 semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Em breve:</strong> Lembretes automáticos via email e WhatsApp para leads que ficarem parados por mais de {reminderDays} dia(s).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Assinatura
              </CardTitle>
              <CardDescription>
                Gerencie sua assinatura e pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Plano Pro</p>
                  <p className="text-sm text-muted-foreground">Assinatura ativa</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/pricing')}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Gerenciar Assinatura
                </Button>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💳 <strong>Próxima cobrança:</strong> Em 30 dias • <strong>Cancelar:</strong> A qualquer momento sem multa
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;