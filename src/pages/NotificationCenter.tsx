import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, CheckCheck, Trash2, Settings, Filter } from "lucide-react";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  sender_username?: string;
  sender_photo?: string;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "read">("all");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadNotifications();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('notification-center-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterNotifications();
  }, [notifications, activeTab, activeFilter]);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch sender info for each notification
      const notificationsWithSenders = (data || []).map((notification) => {
        return {
          ...notification,
          sender_username: undefined,
          sender_photo: undefined,
        };
      });

      setNotifications(notificationsWithSenders);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = () => {
    let filtered = notifications;

    // Filter by type
    if (activeTab !== "all") {
      filtered = filtered.filter(n => {
        if (activeTab === "social") {
          return ['friend_request', 'friend_accepted', 'like', 'comment', 'mention'].includes(n.type);
        } else if (activeTab === "messages") {
          return ['message', 'new_message', 'group_message'].includes(n.type);
        } else if (activeTab === "system") {
          return n.type === 'system';
        }
        return true;
      });
    }

    // Filter by read status
    if (activeFilter === "unread") {
      filtered = filtered.filter(n => !n.read);
    } else if (activeFilter === "read") {
      filtered = filtered.filter(n => n.read);
    }

    setFilteredNotifications(filtered);
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    
    toast({
      title: "Tamamlandı",
      description: "Tüm bildirimler okundu olarak işaretlendi",
    });
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    toast({
      title: "Silindi",
      description: "Bildirim silindi",
    });
  };

  const clearAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .eq("read", true);

    setNotifications(prev => prev.filter(n => !n.read));
    
    toast({
      title: "Temizlendi",
      description: "Okunmuş bildirimler silindi",
    });
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Bildirim Merkezi
            </h1>
            <p className="text-muted-foreground mt-1">
              Tüm bildirimlerinizi yönetin
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {unreadCount} okunmamış
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="all">Tümü</TabsTrigger>
            <TabsTrigger value="social">Sosyal</TabsTrigger>
            <TabsTrigger value="messages">Mesajlar</TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <NotificationList
              notifications={filteredNotifications}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              onMarkAllAsRead={markAllAsRead}
              onClearAllRead={clearAllRead}
              onNotificationClick={handleNotificationClick}
              onDeleteNotification={deleteNotification}
            />
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <NotificationList
              notifications={filteredNotifications}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              onMarkAllAsRead={markAllAsRead}
              onClearAllRead={clearAllRead}
              onNotificationClick={handleNotificationClick}
              onDeleteNotification={deleteNotification}
            />
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <NotificationList
              notifications={filteredNotifications}
              activeFilter={activeFilter}
              setActiveFilter={setActiveFilter}
              onMarkAllAsRead={markAllAsRead}
              onClearAllRead={clearAllRead}
              onNotificationClick={handleNotificationClick}
              onDeleteNotification={deleteNotification}
            />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bildirim Ayarları</CardTitle>
                <CardDescription>
                  Hangi bildirimleri almak istediğinizi özelleştirin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationPreferences />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  activeFilter: "all" | "unread" | "read";
  setActiveFilter: (filter: "all" | "unread" | "read") => void;
  onMarkAllAsRead: () => void;
  onClearAllRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  onDeleteNotification: (id: string) => void;
}

function NotificationList({
  notifications,
  activeFilter,
  setActiveFilter,
  onMarkAllAsRead,
  onClearAllRead,
  onNotificationClick,
  onDeleteNotification,
}: NotificationListProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Button
            variant={activeFilter === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("all")}
          >
            Tümü
          </Button>
          <Button
            variant={activeFilter === "unread" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("unread")}
          >
            Okunmamış {unreadCount > 0 && `(${unreadCount})`}
          </Button>
          <Button
            variant={activeFilter === "read" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveFilter("read")}
          >
            Okunmuş
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={onMarkAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Tümünü Okundu İşaretle
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onClearAllRead}>
            <Trash2 className="w-4 h-4 mr-2" />
            Okunmuşları Temizle
          </Button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {activeFilter === "unread" 
                  ? "Okunmamış bildirim yok"
                  : activeFilter === "read"
                  ? "Okunmuş bildirim yok"
                  : "Henüz bildirim yok"}
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`cursor-pointer hover:shadow-md transition-all ${
                  !notification.read ? "ring-2 ring-primary/20" : ""
                }`}
                onClick={() => onNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {notification.sender_photo ? (
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={notification.sender_photo} />
                        <AvatarFallback>
                          {notification.sender_username?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-white">
                        <Bell className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-semibold">{notification.title}</p>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNotification(notification.id);
                            }}
                            className="h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {notification.sender_username && (
                          <span>@{notification.sender_username}</span>
                        )}
                        <span>•</span>
                        <span>
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: tr,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </>
  );
}
