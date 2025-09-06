import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import FreeTrialCounter from "./FreeTrialCounter";
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
  User2,
  Bell,
  ChevronDown
} from "lucide-react";
import NotificationBadge from "@/components/NotificationBadge";

interface MenuItem {
  icon: any;
  label: string;
  path: string;
  badge?: boolean;
  isPro?: boolean;
  category?: 'navigation' | 'business' | 'admin' | 'user';
  priority?: number;
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
    try {
      // Clear any local storage data
      localStorage.removeItem('recoveredAnalysis');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Sign out error:", error);
        throw error;
      }
      
      // Force navigation to auth page
      navigate("/auth", { replace: true });
    } catch (error) {
      console.error("Error during sign out:", error);
      // Force navigation even if there's an error
      navigate("/auth", { replace: true });
    }
  };

  // Organizar itens por categoria e prioridade
  const navigationItems = [
    { 
      icon: Home, 
      label: "Início", 
      path: "/",
      category: 'navigation' as const,
      priority: 1
    }
  ];

  const businessItems = [
    { 
      icon: Database, 
      label: "Leads", 
      path: "/leads",
      badge: true,
      category: 'business' as const,
      priority: 2
    },
    { 
      icon: Kanban, 
      label: "Vendas", 
      path: "/sales",
      category: 'business' as const,
      priority: 3
    }
  ];

  const adminItems = isAdmin ? [
    {
      icon: User2,
      label: "Admin",
      path: "/admin",
      category: 'admin' as const,
      priority: 5
    }
  ] : [];

  const userItems = [
    ...(freeTrialStatus.isPremium ? [
      {
        icon: Crown,
        label: "PRO",
        path: "/settings",
        isPro: true,
        category: 'user' as const,
        priority: 6
      }
    ] : [
      {
        icon: CreditCard, 
        label: "Upgrade", 
        path: "/pricing",
        category: 'user' as const,
        priority: 6
      }
    ]),
    { 
      icon: Settings, 
      label: "Config", 
      path: "/settings",
      category: 'user' as const,
      priority: 7
    }
  ];

  const allMenuItems = [...navigationItems, ...businessItems, ...adminItems, ...userItems];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className={`${isMobile ? 'flex flex-col gap-2 py-3' : 'flex items-center justify-between py-4'}`}>
          <div className="flex items-center justify-between w-full">
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
            
            {!isMobile && (
              <div className="flex items-center gap-4">
                {/* Contador de estudos */}
                {!freeTrialStatus.loading && user && (
                  <FreeTrialCounter
                    studiesUsed={freeTrialStatus.studiesUsed}
                    studiesRemaining={freeTrialStatus.studiesRemaining}
                    studiesLimit={freeTrialStatus.studiesLimit}
                    isPremium={freeTrialStatus.isPremium}
                    variant="header"
                  />
                )}
                
                {/* Navegação principal */}
                <div className="flex items-center gap-1">
                  {navigationItems.map((item) => (
                    <Button 
                      key={item.path}
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleNavigation(item.path)}
                      className="flex items-center gap-1 px-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Ferramentas de negócio */}
                <div className="flex items-center gap-1 border-l pl-3 border-border/50">
                  {businessItems.map((item) => (
                    <Button 
                      key={item.path}
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleNavigation(item.path)}
                      className="flex items-center gap-1 px-3 relative"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden lg:inline">{item.label}</span>
                      {item.badge && <NotificationBadge />}
                    </Button>
                  ))}
                </div>

                {/* Admin e usuário */}
                <div className="flex items-center gap-1 border-l pl-3 border-border/50">
                  {adminItems.map((item) => (
                    <Button 
                      key={item.path}
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleNavigation(item.path)}
                      className="flex items-center gap-1 px-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </Button>
                  ))}
                  
                  {userItems.map((item) => (
                    <Button 
                      key={item.path}
                      variant={item.isPro ? "default" : "ghost"} 
                      size="sm" 
                      onClick={() => handleNavigation(item.path)}
                      className={`flex items-center gap-1 px-3 ${item.isPro ? 'bg-gradient-primary text-primary-foreground hover:opacity-90' : ''}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </Button>
                  ))}

                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="ml-2">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden xl:inline ml-1">Sair</span>
                  </Button>
                </div>
              </div>
            )}
            
            {isMobile && (
              <div className="flex items-center gap-2">
                <NotificationBadge />
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] max-w-[92vw]">
                    <div className="flex flex-col space-y-6 mt-8">
                      
                      {/* Navegação Principal */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground px-2">Navegação</h3>
                        {navigationItems.map((item) => (
                          <Button 
                            key={item.path}
                            variant="ghost" 
                            onClick={() => handleNavigation(item.path)}
                            className="flex items-center gap-3 justify-start w-full h-11 px-3"
                          >
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                          </Button>
                        ))}
                      </div>

                      {/* Ferramentas de Negócio */}
                      <div className="space-y-2 border-t pt-4">
                        <h3 className="text-sm font-medium text-muted-foreground px-2">Ferramentas</h3>
                        {businessItems.map((item) => (
                          <Button 
                            key={item.path}
                            variant="ghost" 
                            onClick={() => handleNavigation(item.path)}
                            className="flex items-center gap-3 justify-start w-full h-11 px-3 relative"
                          >
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                            {item.badge && (
                              <div className="absolute right-3">
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              </div>
                            )}
                          </Button>
                        ))}
                      </div>

                      {/* Administração */}
                      {adminItems.length > 0 && (
                        <div className="space-y-2 border-t pt-4">
                          <h3 className="text-sm font-medium text-muted-foreground px-2">Administração</h3>
                          {adminItems.map((item) => (
                            <Button 
                              key={item.path}
                              variant="secondary" 
                              onClick={() => handleNavigation(item.path)}
                              className="flex items-center gap-3 justify-start w-full h-11 px-3"
                            >
                              <item.icon className="h-5 w-5" />
                              <span className="font-medium">{item.label}</span>
                            </Button>
                          ))}
                        </div>
                      )}

                      {/* Configurações do Usuário */}
                      <div className="space-y-2 border-t pt-4">
                        <h3 className="text-sm font-medium text-muted-foreground px-2">Conta</h3>
                        {userItems.map((item) => (
                          <Button 
                            key={item.path}
                            variant={item.isPro ? "default" : "ghost"} 
                            onClick={() => handleNavigation(item.path)}
                            className={`flex items-center gap-3 justify-start w-full h-11 px-3 ${item.isPro ? 'bg-gradient-primary text-primary-foreground hover:opacity-90' : ''}`}
                          >
                            <item.icon className="h-5 w-5" />
                            <span className="font-medium">{item.label}</span>
                            {item.isPro && (
                              <Crown className="h-4 w-4 ml-auto" />
                            )}
                          </Button>
                        ))}
                        
                        <Button 
                          variant="ghost" 
                          onClick={() => {
                            handleSignOut();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 justify-start w-full h-11 px-3 text-destructive hover:text-destructive"
                        >
                          <LogOut className="h-5 w-5" />
                          <span className="font-medium">Sair</span>
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            )}
          </div>
          
          {/* Contador mobile em linha separada */}
          {isMobile && !freeTrialStatus.loading && user && (
            <div className="w-full flex justify-center">
              <FreeTrialCounter
                studiesUsed={freeTrialStatus.studiesUsed}
                studiesRemaining={freeTrialStatus.studiesRemaining}
                studiesLimit={freeTrialStatus.studiesLimit}
                isPremium={freeTrialStatus.isPremium}
                variant="header"
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;