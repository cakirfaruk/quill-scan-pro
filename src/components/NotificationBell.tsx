import { useEffect, useState, useCallback, memo } from "react";
import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  created_at: string;
  reference_id: string | null;
}

export const NotificationBell = memo(() => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("Error loading notifications:", error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount((data || []).filter(n => !n.read).length);
  }, []);

  const showBrowserNotification = useCallback((notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
      });
    }
  }, []);

  const setupRealtimeSubscription = useCallback(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('New notification:', payload);
          const newNotification = payload.new as Notification;
          
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Show browser notification
          showBrowserNotification(newNotification);
          
          // Show toast
          toast({
            title: newNotification.title,
            description: newNotification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showBrowserNotification, toast]);

  useEffect(() => {
    loadNotifications();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [loadNotifications, setupRealtimeSubscription]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Bildirimler Açıldı",
          description: "Artık yeni bildirimleri göreceksiniz",
        });
      }
    }
  }, [toast]);

  const markAsRead = useCallback(async (notificationId: string, link: string | null, notificationType?: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    // Don't navigate if it's a friend request (handled by icon click)
    if (link && notificationType !== 'friend_request') {
      navigate(link);
    }
  }, [navigate]);

  const handleAcceptFriendRequest = useCallback(async (e: React.MouseEvent, notificationId: string, friendRequestId: string) => {
    e.stopPropagation();
    
    try {
      // Accept the friend request
      await supabase
        .from("friends")
        .update({ status: "accepted" })
        .eq("id", friendRequestId);

      // Mark notification as read and remove reference_id to hide buttons
      await supabase
        .from("notifications")
        .update({ read: true, reference_id: null })
        .eq("id", notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true, reference_id: null } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      toast({
        title: "Arkadaşlık isteği kabul edildi",
        description: "Artık arkadaş listesinde görüneceksiniz",
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast({
        title: "Hata",
        description: "Arkadaşlık isteği kabul edilemedi",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleRejectFriendRequest = useCallback(async (e: React.MouseEvent, notificationId: string, friendRequestId: string) => {
    e.stopPropagation();
    
    try {
      // Delete the friend request
      await supabase
        .from("friends")
        .delete()
        .eq("id", friendRequestId);

      // Mark notification as read and remove reference_id to hide buttons
      await supabase
        .from("notifications")
        .update({ read: true, reference_id: null })
        .eq("id", notificationId);

      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true, reference_id: null } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      toast({
        title: "Arkadaşlık isteği reddedildi",
        description: "İstek başarıyla reddedildi",
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast({
        title: "Hata",
        description: "Arkadaşlık isteği reddedilemedi",
        variant: "destructive",
      });
    }
  }, [toast]);

  const markAllAsRead = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const getTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Şimdi';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} dk önce`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} saat önce`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} gün önce`;
    return date.toLocaleDateString('tr-TR');
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={requestNotificationPermission}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-card z-50">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Bildirimler</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto py-1 px-2 text-xs"
            >
              Tümünü okundu işaretle
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-96">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Henüz bildirim yok
            </div>
          ) : (
            notifications.map((notification) => {
              const isFriendRequest = notification.type === 'friend_request';
              const friendRequestId = notification.reference_id;
              
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start p-4 cursor-pointer ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id, notification.link, notification.type)}
                >
                  <div className="flex items-start justify-between w-full mb-1">
                    <div className="flex items-center gap-2 flex-1">
                      <p className="font-semibold text-sm">{notification.title}</p>
                      {isFriendRequest && friendRequestId && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-green-500/20 rounded-full"
                            onClick={(e) => handleAcceptFriendRequest(e, notification.id, friendRequestId)}
                            title="Onayla"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 hover:bg-red-500/20 rounded-full"
                            onClick={(e) => handleRejectFriendRequest(e, notification.id, friendRequestId)}
                            title="Reddet"
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 ml-2 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {notification.message}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {getTimeAgo(notification.created_at)}
                  </span>
                </DropdownMenuItem>
              );
            })
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});
