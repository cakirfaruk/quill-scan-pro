import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Moon, Sun, Star, Sparkles, ChevronRight, Bell, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface TransitNotification {
  id: string;
  transit_type: string;
  planet: string;
  sign: string;
  description: string;
  notification_date: string;
  is_read: boolean;
}

interface TransitNotificationsCardProps {
  userId: string;
}

const planetIcons: Record<string, any> = {
  moon: Moon,
  sun: Sun,
  venus: Star,
  mars: Sparkles,
  mercury: Sparkles,
  jupiter: Star,
  saturn: Moon,
};

const planetColors: Record<string, string> = {
  moon: "text-blue-400",
  sun: "text-yellow-500",
  venus: "text-pink-400",
  mars: "text-red-400",
  mercury: "text-purple-400",
  jupiter: "text-orange-400",
  saturn: "text-gray-400",
};

export const TransitNotificationsCard = ({ userId }: TransitNotificationsCardProps) => {
  const [notifications, setNotifications] = useState<TransitNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    try {
      const { data } = await supabase
        .from("transit_notifications")
        .select("*")
        .eq("user_id", userId)
        .gte("notification_date", new Date().toISOString().split("T")[0])
        .order("notification_date", { ascending: true })
        .limit(5);

      setNotifications(data || []);
    } catch (error) {
      console.error("Error loading transit notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("transit_notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getPlanetIcon = (planet: string) => {
    const Icon = planetIcons[planet.toLowerCase()] || Star;
    const color = planetColors[planet.toLowerCase()] || "text-primary";
    return <Icon className={`w-5 h-5 ${color}`} />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Gezegen Transitleri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Yaklaşan transit bildirimi yok
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Gezegen Transitleri
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <AnimatePresence>
            {notifications.map((notification, idx) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                  notification.is_read
                    ? "bg-muted/50"
                    : "bg-primary/5 border border-primary/20"
                }`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getPlanetIcon(notification.planet)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm">
                        {notification.planet} → {notification.sign}
                      </p>
                      {!notification.is_read && (
                        <Badge variant="secondary" className="text-[10px] px-1 py-0">
                          Yeni
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(notification.notification_date), "d MMMM", {
                        locale: tr,
                      })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
