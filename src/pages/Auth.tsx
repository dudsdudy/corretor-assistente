import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Shield, TrendingUp } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [personType, setPersonType] = useState<"pf" | "pj" | "">("");
  const [insuranceTypes, setInsuranceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate]);

  const handleInsuranceTypeChange = (type: string, checked: boolean) => {
    setInsuranceTypes(prev => 
      checked 
        ? [...prev, type]
        : prev.filter(t => t !== type)
    );
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações
      if (email !== confirmEmail) {
        throw new Error("Os emails não coincidem");
      }
      
      if (password !== confirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      if (password.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres");
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          }
        }
      });

      if (error) throw error;

      // Salvar dados adicionais do perfil
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            insurance_company: insuranceCompany,
            cpf_cnpj: cpfCnpj,
            birth_date: birthDate,
            insurance_types: insuranceTypes
          })
          .eq('user_id', data.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar sua conta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-primary/5 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-hero rounded-lg">
              <Shield className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Corretor Consultor</h1>
              <p className="text-sm text-muted-foreground">Inteligência em Seguros de Vida</p>
            </div>
          </div>
        </div>

        <Card className="shadow-strong bg-gradient-card border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Acesso à Plataforma
            </CardTitle>
            <CardDescription>
              Entre na sua conta ou crie uma nova para começar
            </CardDescription>
            <div className="bg-primary/10 rounded-lg p-4 mt-4">
              <p className="text-sm font-medium text-primary">
                ⏰ Outros corretores de seguros já economizaram mais de 10.000 horas!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cada estudo economiza até 4 horas de trabalho manual
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loading}
                      variant="hero"
                      size="lg"
                    >
                      {loading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nome do Responsável</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Nome do responsável"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="insuranceCompany">Corretora de Seguros</Label>
                    <Input
                      id="insuranceCompany"
                      type="text"
                      placeholder="Nome da sua corretora"
                      value={insuranceCompany}
                      onChange={(e) => setInsuranceCompany(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Tipo de Pessoa</Label>
                    <RadioGroup
                      value={personType}
                      onValueChange={(value) => {
                        setPersonType(value as "pf" | "pj");
                        setCpfCnpj(""); // Limpar campo quando trocar tipo
                        setBirthDate(""); // Limpar data quando trocar tipo
                      }}
                      className="flex gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pf" id="pf" />
                        <Label htmlFor="pf">Pessoa Física (CPF)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pj" id="pj" />
                        <Label htmlFor="pj">Pessoa Jurídica (CNPJ)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Campos condicionais baseados no tipo de pessoa */}
                  {personType === "pf" && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cpfCnpj">CPF</Label>
                        <Input
                          id="cpfCnpj"
                          type="text"
                          placeholder="000.000.000-00"
                          value={cpfCnpj}
                          onChange={(e) => setCpfCnpj(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Data de Nascimento</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={birthDate}
                          onChange={(e) => setBirthDate(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                  
                  {personType === "pj" && (
                    <div className="space-y-2">
                      <Label htmlFor="cpfCnpj">CNPJ</Label>
                      <Input
                        id="cpfCnpj"
                        type="text"
                        placeholder="00.000.000/0001-00"
                        value={cpfCnpj}
                        onChange={(e) => setCpfCnpj(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="signupEmail">E-mail</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirme seu e-mail</Label>
                    <Input
                      id="confirmEmail"
                      type="email"
                      placeholder="seu@email.com"
                      value={confirmEmail}
                      onChange={(e) => setConfirmEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword">Senha</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirme sua senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Selecione os seguros que você já atua:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {['AUTO', 'MASSIFICADOS', 'VIDA', 'PRODUTOS PJ'].map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={insuranceTypes.includes(type)}
                            onCheckedChange={(checked) => handleInsuranceTypeChange(type, checked as boolean)}
                          />
                          <Label htmlFor={type} className="text-sm font-normal">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !personType}
                    variant="hero"
                    size="lg"
                  >
                    {loading ? "Cadastrando..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;