import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { User } from "@supabase/supabase-js";
import { 
  Shield, 
  LogOut, 
  Database, 
  Kanban, 
  Settings,
  Menu,
  Home,
  CreditCard,
  Crown,
  User2
} from "lucide-react";
import NotificationBadge from "@/components/NotificationBadge";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badge?: boolean;
  isPro?: boolean;
}

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  backPath?: string;
}

const AppHeader = ({ 
  title = "Corretor Consultor", 
  subtitle = "Inteligência em Seguros de Vida",
  showBackButton = false,
  backPath = "/"
}: AppHeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const freeTrialStatus = useFreeTrial(user);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Check if user is admin
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        
        setIsAdmin(!!roleData);
      }
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        // Check admin status when session changes
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin')
          .single()
          .then(({ data }) => setIsAdmin(!!data));
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const menuItems = [
    { 
      icon: Home, 
      label: "Início", 
      path: "/" 
    },
    { 
      icon: Database, 
      label: "Painel de Leads", 
      path: "/leads",
      badge: true
    },
    { 
      icon: Kanban, 
      label: "Gestão de Vendas", 
      path: "/sales" 
    },
    ...(freeTrialStatus.isPremium ? [
      {
        icon: Crown,
        label: "Usuário PRO",
        path: "/settings",
        isPro: true
      }
    ] : [
      {
        icon: CreditCard, 
        label: "Preços", 
        path: "/pricing"
      }
    ]),
    ...(isAdmin ? [
      {
        icon: User2,
        label: "Administração",
        path: "/admin"
      }
    ] : []),
    { 
      icon: Settings, 
      label: "Configurações", 
      path: "/settings" 
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(backPath)}
              className="mr-2"
            >
              ← Voltar
            </Button>
          )}
          <div className="p-2 bg-gradient-hero rounded-lg">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isMobile ? (
            <div className="flex items-center gap-3">
              <NotificationBadge />
              {menuItems.map((item) => (
                <Button 
                  key={item.path}
                  variant={item.isPro ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => handleNavigation(item.path)} 
                  className={`flex items-center gap-2 ${item.isPro ? 'bg-gradient-primary text-primary-foreground hover:opacity-90' : ''}`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          ) : (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px]">
                <div className="flex flex-col space-y-4 mt-8">
                  {menuItems.map((item) => (
                    <Button 
                      key={item.path}
                      variant={item.isPro ? "default" : "ghost"} 
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center gap-2 justify-start w-full ${item.isPro ? 'bg-gradient-primary text-primary-foreground hover:opacity-90' : ''}`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Button>
                  ))}
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 justify-start w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;