import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const NotificationBadge = () => {
  const [untreatedLeads, setUntreatedLeads] = useState(0);

  useEffect(() => {
    fetchUntreatedLeads();
    // Check for updates every 30 seconds
    const interval = setInterval(fetchUntreatedLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUntreatedLeads = async () => {
    try {
      // Get leads that are "novo" or haven't been updated in 3+ days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const { data, error } = await supabase
        .from('client_analyses')
        .select('id, status, updated_at')
        .or(`status.eq.novo,and(updated_at.lt.${threeDaysAgo.toISOString()},status.neq.fechado,status.neq.perdido)`);

      if (error) throw error;
      setUntreatedLeads(data?.length || 0);
    } catch (error) {
      console.error("Error fetching untreated leads:", error);
    }
  };

  if (untreatedLeads === 0) return null;

  return (
    <div className="relative group">
      <div className="relative p-2 rounded-lg bg-warning/10 border border-warning/20 hover:bg-warning/15 transition-colors">
        <Bell className="h-5 w-5 text-warning" />
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {untreatedLeads > 9 ? "9+" : untreatedLeads}
        </Badge>
      </div>
      
      {/* Tooltip */}
      <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-popover text-popover-foreground border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
        <p className="text-sm font-medium mb-1">Leads que precisam de atenção:</p>
        <p className="text-xs text-muted-foreground">
          • {untreatedLeads} lead{untreatedLeads > 1 ? 's' : ''} necessita{untreatedLeads > 1 ? 'm' : ''} atenção
          <br />
          • Novos leads sem contato
          <br />
          • Leads parados há mais de 3 dias
          <br />
          • Vá para "Gestão de Vendas" para visualizar
        </p>
      </div>
    </div>
  );
};

export default NotificationBadge;