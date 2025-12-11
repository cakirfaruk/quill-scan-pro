import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Package, Infinity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface ActivePackage {
  id: string;
  package_name: string;
  package_type: string;
  expires_at: string;
  usage_limit: number | null;
  usage_count: number;
  notification_hour: number;
}

const ActivePackages = () => {
  const [packages, setPackages] = useState<ActivePackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivePackages();
  }, []);

  const loadActivePackages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_active_packages")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: true });

    if (!error && data) {
      setPackages(data);
    }
    setIsLoading(false);
  };

  const getPackageIcon = (type: string) => {
    switch (type) {
      case 'daily_horoscope': return '🌅';
      case 'tarot': return '🎴';
      case 'coffee': return '☕';
      case 'oracle': return '🔮';
      case 'match_tarot': return '💘';
      case 'dream': return '🌙';
      default: return '📦';
    }
  };

  if (isLoading || packages.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Aktif Paketleriniz</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getPackageIcon(pkg.package_type)}</span>
              <div>
                <p className="font-medium text-foreground text-sm">{pkg.package_name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(pkg.expires_at), { 
                      addSuffix: true, 
                      locale: tr 
                    })}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              {pkg.usage_limit ? (
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-xs">
                    {pkg.usage_count}/{pkg.usage_limit}
                  </Badge>
                  <Progress 
                    value={(pkg.usage_count / pkg.usage_limit) * 100} 
                    className="w-16 h-1.5"
                  />
                </div>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <Infinity className="w-3 h-3 mr-1" />
                  Sınırsız
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default ActivePackages;
