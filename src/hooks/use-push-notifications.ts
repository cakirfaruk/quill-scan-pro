import { useState, useEffect } from 'react';
import { 
  requestNotificationPermission, 
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  checkNotificationPermission 
} from '@/utils/pushNotifications';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check initial permission status
    const currentPermission = checkNotificationPermission();
    setPermission(currentPermission);
    
    // Check if already subscribed
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const reg = registration as ServiceWorkerRegistration & { pushManager: PushManager };
          const subscription = await reg.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const subscribe = async () => {
    setIsLoading(true);
    try {
      // Request permission first
      const hasPermission = await requestNotificationPermission();
      
      if (!hasPermission) {
        toast({
          title: 'Bildirim İzni Gerekli',
          description: 'Lütfen tarayıcı ayarlarından bildirim izni verin.',
          variant: 'destructive',
        });
        setPermission('denied');
        return false;
      }

      setPermission('granted');

      // Subscribe to push notifications
      const success = await subscribeToPushNotifications();
      
      if (success) {
        setIsSubscribed(true);
        toast({
          title: 'Bildirimler Aktif! 🔔',
          description: 'Artık analizleriniz hazır olduğunda bildirim alacaksınız.',
        });
        return true;
      } else {
        toast({
          title: 'Bildirim Aboneliği Başarısız',
          description: 'Bir hata oluştu, lütfen tekrar deneyin.',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast({
        title: 'Hata',
        description: 'Bildirim aboneliği sırasında bir hata oluştu.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await unsubscribeFromPushNotifications();
      
      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'Bildirimler Kapatıldı',
          description: 'Artık push bildirimi almayacaksınız.',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast({
        title: 'Hata',
        description: 'Bildirim aboneliği iptal edilemedi.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
  };
};
