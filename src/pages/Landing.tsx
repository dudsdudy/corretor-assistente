import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Users, 
  TrendingUp, 
  Shield, 
  Star, 
  CheckCircle,
  ArrowRight,
  Zap,
  BookOpen,
  MessageCircle,
  BarChart3,
  UserPlus,
  Lightbulb,
  Award,
  Target,
  Rocket
} from "lucide-react";
import heroImage from "@/assets/hero-insurance.jpg";

const Landing = () => {
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  const features = [
    {
      icon: Clock,
      title: "Economize até 80% do seu tempo",
      description: "Gere estudos completos em menos de 2 minutos ao invés de horas",
      color: "text-primary"
    },
    {
      icon: Users,
      title: "Foque na captação de clientes",
      description: "Dedique mais tempo para encontrar novos prospects enquanto a IA trabalha para você",
      color: "text-success"
    },
    {
      icon: TrendingUp,
      title: "Aumente suas vendas",
      description: "Propostas técnicas e precisas que convertem mais clientes",
      color: "text-warning"
    },
    {
      icon: Shield,
      title: "Credibilidade profissional",
      description: "Apresente estudos atuariais detalhados e impressione seus clientes",
      color: "text-info"
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Análise Instantânea por Voz",
      description: "Fale sobre o cliente e nossa IA extrai automaticamente todas as informações necessárias"
    },
    {
      icon: BookOpen,
      title: "Metodologias Atuariais",
      description: "Cálculos baseados em HLV, DIME e tabelas biométricas profissionais"
    },
    {
      icon: MessageCircle,
      title: "Comunidade Exclusiva",
      description: "Conecte-se com outros corretores, compartilhe experiências e aprenda técnicas avançadas"
    },
    {
      icon: BarChart3,
      title: "Relatórios Profissionais",
      description: "PDFs otimizados e propostas que demonstram seu conhecimento técnico"
    },
    {
      icon: UserPlus,
      title: "Gestão de Leads",
      description: "Organize todos seus estudos em um painel intuitivo e nunca perca uma oportunidade"
    },
    {
      icon: Award,
      title: "Cursos e Capacitação",
      description: "Acesso a conteúdos exclusivos para se tornar um corretor de elite"
    }
  ];

  const testimonials = [
    {
      name: "Carlos Eduardo",
      role: "Corretor Sênior",
      content: "Revolucionou minha forma de trabalhar. Agora consigo atender 3x mais clientes com a mesma qualidade.",
      rating: 5
    },
    {
      name: "Ana Maria Santos",
      role: "Corretora Empresarial",
      content: "Os estudos são impressionantes. Meus clientes ficam admirados com o nível de detalhamento.",
      rating: 5
    },
    {
      name: "Roberto Lima",
      role: "Corretor Autônomo",
      content: "Em 1 mês aumentei minhas vendas em 150%. A ferramenta me deu credibilidade que eu não tinha.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "Gratuito",
      period: "Para sempre",
      description: "Perfeito para começar",
      features: [
        "3 estudos por mês",
        "Análise por voz e formulário",
        "Relatórios básicos",
        "Suporte por email"
      ],
      popular: false,
      cta: "Começar Grátis"
    },
    {
      name: "Professional",
      price: "R$ 97",
      period: "/mês",
      description: "Para corretores sérios",
      features: [
        "Estudos ilimitados",
        "Acesso à comunidade exclusiva",
        "Cursos de capacitação",
        "Relatórios premium",
        "Gestão avançada de leads",
        "Suporte prioritário",
        "Templates personalizados"
      ],
      popular: true,
      cta: "Assinar Agora"
    },
    {
      name: "Enterprise",
      price: "Sob consulta",
      period: "Personalizado",
      description: "Para equipes e empresas",
      features: [
        "Tudo do Professional",
        "Múltiplos usuários",
        "API personalizada",
        "Treinamento da equipe",
        "Suporte dedicado",
        "Customização completa"
      ],
      popular: false,
      cta: "Falar com Vendas"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                IA Seguros Pro
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Entrar
              </Button>
              <Button onClick={() => navigate("/auth")}>
                Começar Grátis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Corretor profissional" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-success/10" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <Badge variant="secondary" className="mb-4">
                🚀 A revolução dos estudos de seguro chegou
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold">
                Seja o <span className="bg-gradient-primary bg-clip-text text-transparent">Corretor do Futuro</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Gere estudos atuariais profissionais em minutos, impressione clientes e 
                <strong className="text-foreground"> multiplique suas vendas</strong> com o poder da Inteligência Artificial
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate("/auth")}>
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Ver Demonstração
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="text-center space-y-2 cursor-pointer transition-all duration-300 hover:scale-105"
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className={`mx-auto p-3 rounded-full bg-gradient-to-br from-background to-muted ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por que escolher nossa plataforma?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Desenvolvida especialmente para corretores que querem se destacar no mercado
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="hover:shadow-glow transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className="p-3 bg-gradient-primary rounded-lg w-fit">
                    <benefit.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Como funciona?
            </h2>
            <p className="text-xl text-muted-foreground">
              Simples, rápido e eficiente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="mx-auto p-6 bg-gradient-to-br from-primary/10 to-success/10 rounded-full w-24 h-24 flex items-center justify-center">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold">Fale ou Digite</h3>
              <p className="text-muted-foreground">
                Descreva o perfil do cliente usando voz ou formulário. Nossa IA extrai automaticamente todas as informações.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto p-6 bg-gradient-to-br from-success/10 to-warning/10 rounded-full w-24 h-24 flex items-center justify-center">
                <span className="text-3xl font-bold text-success">2</span>
              </div>
              <h3 className="text-xl font-semibold">IA Processa</h3>
              <p className="text-muted-foreground">
                Cálculos atuariais complexos são realizados em segundos usando metodologias profissionais reconhecidas.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="mx-auto p-6 bg-gradient-to-br from-warning/10 to-info/10 rounded-full w-24 h-24 flex items-center justify-center">
                <span className="text-3xl font-bold text-warning">3</span>
              </div>
              <h3 className="text-xl font-semibold">Proposta Pronta</h3>
              <p className="text-muted-foreground">
                Receba um estudo completo, profissional e personalizado que impressiona qualquer cliente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              O que nossos corretores dizem
            </h2>
            <p className="text-xl text-muted-foreground">
              Histórias reais de sucesso
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Escolha seu plano
            </h2>
            <p className="text-xl text-muted-foreground">
              Comece grátis e evolua conforme cresce
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative hover:shadow-glow transition-all duration-300 ${
                  plan.popular ? 'ring-2 ring-primary shadow-glow scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    Mais Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">{plan.price}</div>
                    <div className="text-muted-foreground">{plan.period}</div>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate("/auth")}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-primary/90 to-success/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">
              Pronto para revolucionar seu trabalho?
            </h2>
            <p className="text-xl opacity-90">
              Junte-se a centenas de corretores que já estão usando IA para 
              gerar mais vendas e impressionar clientes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary" 
                className="text-lg px-8 py-6"
                onClick={() => navigate("/auth")}
              >
                <Rocket className="mr-2 h-5 w-5" />
                Começar Agora - É Grátis
              </Button>
            </div>
            <p className="text-sm opacity-75">
              ✅ Sem cartão de crédito • ✅ Sem compromisso • ✅ Suporte incluso
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">IA Seguros Pro</span>
            </div>
            <p className="text-muted-foreground">
              Transformando a forma como corretores trabalham desde 2024
            </p>
            <div className="flex justify-center gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary">Termos de Uso</a>
              <a href="#" className="hover:text-primary">Política de Privacidade</a>
              <a href="#" className="hover:text-primary">Suporte</a>
              <a href="#" className="hover:text-primary">Contato</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;