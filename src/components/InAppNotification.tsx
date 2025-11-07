import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bell, MessageCircle, Heart, Users, UserPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

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

export const InAppNotification = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      setupRealtimeSubscription(user.id);
    }
  };

  const setupRealtimeSubscription = (userId: string) => {
    const channel = supabase
      .channel('in-app-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        async (payload) => {
          const newNotification = payload.new as Notification;
          
          setNotifications(prev => [...prev, newNotification]);
          
          // Auto dismiss after 5 seconds
          setTimeout(() => {
            handleDismiss(newNotification.id);
          }, 5000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleDismiss = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const handleClick = useCallback(async (notification: Notification) => {
    // Mark as read
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification.id);

    // Navigate if link exists
    if (notification.link) {
      navigate(notification.link);
    }

    handleDismiss(notification.id);
  }, [navigate, handleDismiss]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'message':
      case 'new_message':
        return <MessageCircle className="w-5 h-5" />;
      case 'like':
      case 'post_like':
        return <Heart className="w-5 h-5" />;
      case 'friend_request':
        return <UserPlus className="w-5 h-5" />;
      case 'friend_accepted':
        return <Users className="w-5 h-5" />;
      case 'match':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getGradient = (type: string) => {
    switch (type) {
      case 'message':
      case 'new_message':
        return 'from-blue-500 to-cyan-500';
      case 'like':
      case 'post_like':
        return 'from-pink-500 to-rose-500';
      case 'friend_request':
      case 'friend_accepted':
        return 'from-purple-500 to-indigo-500';
      case 'match':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              delay: index * 0.05,
            }}
            className="pointer-events-auto"
          >
            <div
              onClick={() => handleClick(notification)}
              className={`relative bg-gradient-to-r ${getGradient(notification.type)} p-[2px] rounded-lg cursor-pointer group hover:shadow-lg transition-all duration-300`}
            >
              <div className="bg-card rounded-lg p-4 flex items-start gap-3">
                {/* Icon or Avatar */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r ${getGradient(notification.type)} flex items-center justify-center text-white`}>
                  {notification.sender_photo ? (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={notification.sender_photo} />
                      <AvatarFallback>{notification.sender_username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  ) : (
                    getIcon(notification.type)
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1 truncate">
                    {notification.title}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  {notification.sender_username && (
                    <p className="text-xs text-muted-foreground mt-1">
                      @{notification.sender_username}
                    </p>
                  )}
                </div>

                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(notification.id);
                  }}
                  className="flex-shrink-0 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Progress Bar */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 5, ease: "linear" }}
                className="absolute bottom-0 left-0 h-1 bg-primary/50 rounded-b-lg"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
