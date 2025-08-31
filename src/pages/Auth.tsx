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
import { Shield, TrendingUp, Check, X, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [insuranceCompany, setInsuranceCompany] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [personType, setPersonType] = useState<"pf" | "pj" | "">("");
  const [insuranceTypes, setInsuranceTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation states
  const [emailValidation, setEmailValidation] = useState<{
    isValid: boolean;
    message: string;
    isChecking: boolean;
  }>({ isValid: true, message: "", isChecking: false });
  
  const [passwordValidation, setPasswordValidation] = useState<{
    hasMinLength: boolean;
    hasUpperCase: boolean;
    hasLowerCase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    isStrong: boolean;
  }>({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    isStrong: false
  });
  
  const [emailsMatch, setEmailsMatch] = useState(true);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/app");
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

  // Email validation function
  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailValidation({ isValid: false, message: "Email inválido", isChecking: false });
      return;
    }

    setEmailValidation(prev => ({ ...prev, isChecking: true }));

    try {
      // Check if email already exists by trying to sign up (this will return an error if email exists)
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'temp_password_for_check_only',
        options: {
          data: { check_only: true }
        }
      });

      // If no error and user exists, email is already registered
      if (error?.message?.includes('User already registered')) {
        setEmailValidation({ 
          isValid: false, 
          message: "Email já cadastrado. Use a aba 'Entrar' para fazer login.", 
          isChecking: false 
        });
      } else if (error?.message?.includes('Invalid email')) {
        setEmailValidation({ 
          isValid: false, 
          message: "Formato de email inválido", 
          isChecking: false 
        });
      } else {
        setEmailValidation({ 
          isValid: true, 
          message: "Email válido e disponível", 
          isChecking: false 
        });
      }
    } catch (error) {
      // Alternative method: check profiles table
      try {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', email)
          .limit(1);

        if (profileError) {
          setEmailValidation({ 
            isValid: true, 
            message: "Email validado", 
            isChecking: false 
          });
        } else if (profiles && profiles.length > 0) {
          setEmailValidation({ 
            isValid: false, 
            message: "Email já cadastrado. Use a aba 'Entrar' para fazer login.", 
            isChecking: false 
          });
        } else {
          setEmailValidation({ 
            isValid: true, 
            message: "Email válido e disponível", 
            isChecking: false 
          });
        }
      } catch (err) {
        setEmailValidation({ 
          isValid: true, 
          message: "Email validado", 
          isChecking: false 
        });
      }
    }
  };

  // Password validation function
  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const isStrong = hasMinLength && hasUpperCase && hasLowerCase && hasNumber;

    setPasswordValidation({
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar,
      isStrong
    });
  };

  // Email validation effect
  useEffect(() => {
    if (email && email.length > 0) {
      const timeoutId = setTimeout(() => {
        checkEmailExists(email);
      }, 800);
      return () => clearTimeout(timeoutId);
    } else {
      setEmailValidation({ isValid: true, message: "", isChecking: false });
    }
  }, [email]);

  // Password validation effect
  useEffect(() => {
    if (password) {
      validatePassword(password);
    }
  }, [password]);

  // Email matching effect
  useEffect(() => {
    if (confirmEmail && email) {
      setEmailsMatch(email === confirmEmail);
    } else {
      setEmailsMatch(true);
    }
  }, [email, confirmEmail]);

  // Password matching effect
  useEffect(() => {
    if (confirmPassword && password) {
      setPasswordsMatch(password === confirmPassword);
    } else {
      setPasswordsMatch(true);
    }
  }, [password, confirmPassword]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validações robustas
      if (!emailValidation.isValid || emailValidation.isChecking) {
        throw new Error("Aguarde a validação do email ou corrija os erros");
      }

      if (!emailsMatch) {
        throw new Error("Os emails não coincidem");
      }
      
      if (!passwordsMatch) {
        throw new Error("As senhas não coincidem");
      }

      if (!passwordValidation.isStrong) {
        throw new Error("A senha não atende aos critérios de segurança. Use pelo menos 8 caracteres com maiúscula, minúscula e número.");
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

      if (error) {
        // Handle specific Supabase errors
        if (error.message.includes('User already registered')) {
          throw new Error("Este email já está cadastrado. Use a aba 'Entrar' para fazer login.");
        } else if (error.message.includes('Invalid email')) {
          throw new Error("Email inválido. Verifique o formato do email.");
        } else if (error.message.includes('Password should be at least')) {
          throw new Error("Senha muito fraca. Use pelo menos 6 caracteres.");
        }
        throw error;
      }

        // Salvar dados adicionais do perfil e disparar webhook
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update({
              phone_number: phoneNumber,
              insurance_company: insuranceCompany,
              cpf_cnpj: cpfCnpj,
              birth_date: birthDate,
              insurance_types: insuranceTypes
            })
            .eq('user_id', data.user.id);

          if (profileError) {
            console.error('Error updating profile:', profileError);
          } else {
            // Disparar webhook de usuário registrado
            try {
              const { error: webhookError } = await supabase.functions.invoke('user-registered-webhook', {
                body: {
                  userId: data.user.id,
                  userEmail: data.user.email,
                  fullName: fullName,
                  phoneNumber: phoneNumber,
                  insuranceCompany: insuranceCompany
                }
              });

              if (webhookError) {
                console.error('Webhook error:', webhookError);
              }
            } catch (error) {
              console.error('Error invoking webhook:', error);
            }
          }
        }

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar sua conta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
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

      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('Invalid login credentials')) {
          throw new Error("Email ou senha incorretos. Verifique suas credenciais.");
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error("Email não confirmado. Verifique sua caixa de entrada e confirme seu email.");
        } else if (error.message.includes('Too many requests')) {
          throw new Error("Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.");
        }
        throw error;
      }

      navigate("/app");
    } catch (error: any) {
      toast({
        title: "Erro no login",
        description: error.message || "Ocorreu um erro inesperado. Tente novamente.",
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
                    <Label htmlFor="phoneNumber">WhatsApp (com DDD)</Label>
                    <Input
                      id="phoneNumber"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      💬 Usado para notificações automáticas e suporte via WhatsApp
                    </p>
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
                    <div className="relative">
                      <Input
                        id="signupEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`pr-10 ${
                          email && !emailValidation.isValid ? 'border-destructive' : 
                          email && emailValidation.isValid && emailValidation.message ? 'border-success' : ''
                        }`}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {emailValidation.isChecking ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        ) : email && emailValidation.message ? (
                          emailValidation.isValid ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <X className="h-4 w-4 text-destructive" />
                          )
                        ) : null}
                      </div>
                    </div>
                    {email && emailValidation.message && (
                      <p className={`text-xs ${emailValidation.isValid ? 'text-success' : 'text-destructive'}`}>
                        {emailValidation.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmEmail">Confirme seu e-mail</Label>
                    <div className="relative">
                      <Input
                        id="confirmEmail"
                        type="email"
                        placeholder="seu@email.com"
                        value={confirmEmail}
                        onChange={(e) => setConfirmEmail(e.target.value)}
                        className={`pr-10 ${
                          confirmEmail && !emailsMatch ? 'border-destructive' : 
                          confirmEmail && emailsMatch && email ? 'border-success' : ''
                        }`}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        {confirmEmail && email ? (
                          emailsMatch ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <X className="h-4 w-4 text-destructive" />
                          )
                        ) : null}
                      </div>
                    </div>
                    {confirmEmail && !emailsMatch && (
                      <p className="text-xs text-destructive">
                        Os emails não coincidem
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signupPassword">Senha</Label>
                    <div className="relative">
                      <Input
                        id="signupPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {password && (
                      <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                        <p className="text-xs font-medium text-muted-foreground">Força da senha:</p>
                        <div className="space-y-1">
                          <div className={`flex items-center gap-2 text-xs ${passwordValidation.hasMinLength ? 'text-success' : 'text-muted-foreground'}`}>
                            {passwordValidation.hasMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            Mínimo 8 caracteres
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${passwordValidation.hasUpperCase ? 'text-success' : 'text-muted-foreground'}`}>
                            {passwordValidation.hasUpperCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            Uma letra maiúscula
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${passwordValidation.hasLowerCase ? 'text-success' : 'text-muted-foreground'}`}>
                            {passwordValidation.hasLowerCase ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            Uma letra minúscula
                          </div>
                          <div className={`flex items-center gap-2 text-xs ${passwordValidation.hasNumber ? 'text-success' : 'text-muted-foreground'}`}>
                            {passwordValidation.hasNumber ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            Um número
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`text-xs font-medium ${
                            passwordValidation.isStrong ? 'text-success' : 
                            passwordValidation.hasMinLength ? 'text-warning' : 'text-destructive'
                          }`}>
                            {passwordValidation.isStrong ? '🔒 Senha forte' : 
                             passwordValidation.hasMinLength ? '⚠️ Senha fraca' : '❌ Senha muito fraca'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirme sua senha</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`pr-10 ${
                          confirmPassword && !passwordsMatch ? 'border-destructive' : 
                          confirmPassword && passwordsMatch && password ? 'border-success' : ''
                        }`}
                        required
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
                        {confirmPassword && password && (
                          passwordsMatch ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <X className="h-4 w-4 text-destructive" />
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-muted-foreground hover:text-foreground ml-1"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {confirmPassword && !passwordsMatch && (
                      <p className="text-xs text-destructive">
                        As senhas não coincidem
                      </p>
                    )}
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
                    disabled={
                      loading || 
                      !personType || 
                      !emailValidation.isValid || 
                      emailValidation.isChecking || 
                      !emailsMatch || 
                      !passwordValidation.isStrong || 
                      !passwordsMatch
                    }
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