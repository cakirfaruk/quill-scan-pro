import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/use-push-notifications';

export const PushNotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isSubscribed, permission, subscribe } = usePushNotifications();

  useEffect(() => {
    // Show prompt if user hasn't decided yet and not subscribed
    const hasSeenPrompt = localStorage.getItem('push-notification-prompt-seen');
    
    if (!hasSeenPrompt && permission === 'default' && !isSubscribed) {
      // Show prompt after 5 seconds
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [permission, isSubscribed]);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success || permission !== 'default') {
      localStorage.setItem('push-notification-prompt-seen', 'true');
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('push-notification-prompt-seen', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt || isSubscribed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4">
      <Card className="border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Bildirimleri Aç 🔔</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="mt-2">
            Analizleriniz hazır olduğunda bildirim alın - hiçbir şeyi kaçırmayın!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            onClick={handleSubscribe}
            className="flex-1"
          >
            Bildirimleri Aç
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="flex-1"
          >
            Sonra
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
