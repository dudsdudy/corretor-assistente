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
    <div className="relative">
      <Bell className="h-5 w-5 text-warning" />
      <Badge 
        variant="destructive" 
        className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
      >
        {untreatedLeads > 9 ? "9+" : untreatedLeads}
      </Badge>
    </div>
  );
};

export default NotificationBadge;