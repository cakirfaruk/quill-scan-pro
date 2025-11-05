import { useEffect, useState, useCallback, createElement } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

interface ErrorAlert {
  id: string;
  error_type: string;
  error_message: string;
  severity: ErrorSeverity;
  timestamp: string;
  url: string;
}

interface AlertPreferences {
  error_alerts_enabled: boolean;
  alert_severity_threshold: ErrorSeverity;
  push_enabled: boolean;
}

const SEVERITY_LEVELS: Record<ErrorSeverity, number> = {
  info: 1,
  warning: 2,
  error: 3,
  fatal: 4,
};

/**
 * Hook for real-time error alerting
 * Listens to new errors in the database and shows notifications
 */
export const useErrorAlerts = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        return;
      }

      // Create default preferences if not found
      if (!data) {
        const { data: newPrefs, error: insertError } = await supabase
          .from('notification_preferences')
          .insert({
            user_id: user.id,
            error_alerts_enabled: true,
            alert_severity_threshold: 'error',
            push_enabled: false,
          })
          .select('*')
          .single();

        if (insertError) {
          console.error('Error creating preferences:', insertError);
          return;
        }

        if (newPrefs) {
          const prefs: any = newPrefs;
          setPreferences({
            error_alerts_enabled: prefs.error_alerts_enabled ?? true,
            alert_severity_threshold: (prefs.alert_severity_threshold as ErrorSeverity) ?? 'error',
            push_enabled: prefs.push_enabled ?? false,
          });
        }
      } else {
        const prefs: any = data;
        setPreferences({
          error_alerts_enabled: prefs.error_alerts_enabled ?? true,
          alert_severity_threshold: (prefs.alert_severity_threshold as ErrorSeverity) ?? 'error',
          push_enabled: prefs.push_enabled ?? false,
        });
      }
    } catch (error) {
      console.error('Error in fetchPreferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Show alert notification
  const showAlert = useCallback((error: ErrorAlert) => {
    const severityEmojis: Record<ErrorSeverity, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🔴',
      fatal: '💀',
    };

    const severityTitles: Record<ErrorSeverity, string> = {
      info: 'Bilgi',
      warning: 'Uyarı',
      error: 'Hata',
      fatal: 'Kritik Hata',
    };

    toast({
      title: `${severityEmojis[error.severity]} ${severityTitles[error.severity]}`,
      description: `${error.error_type}: ${error.error_message}`,
      variant: error.severity === 'error' || error.severity === 'fatal' ? 'destructive' : 'default',
      duration: error.severity === 'fatal' ? 0 : 5000,
    });

    // Browser notification if enabled
    if (preferences?.push_enabled && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`${severityTitles[error.severity]}: ${error.error_type}`, {
        body: error.error_message,
        icon: '/favicon.ico',
        tag: error.id,
        requireInteraction: error.severity === 'fatal',
      });
    }
  }, [preferences, toast]);

  // Check if error should trigger alert
  const shouldAlert = useCallback((severity: ErrorSeverity): boolean => {
    if (!preferences?.error_alerts_enabled) return false;
    
    const errorLevel = SEVERITY_LEVELS[severity];
    const thresholdLevel = SEVERITY_LEVELS[preferences.alert_severity_threshold];
    
    return errorLevel >= thresholdLevel;
  }, [preferences]);

  // Setup realtime subscription
  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  useEffect(() => {
    if (isLoading || !preferences?.error_alerts_enabled) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      
      // Subscribe to new errors
      const errorChannel = supabase
        .channel('error-alerts')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'error_logs',
          },
          (payload) => {
            const newError = payload.new as ErrorAlert;
            
            // Only alert if severity meets threshold
            if (shouldAlert(newError.severity)) {
              showAlert(newError);
            }
          }
        )
        .subscribe();

      setChannel(errorChannel);
    });

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [isLoading, preferences, shouldAlert, showAlert]);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<AlertPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updateData: any = {};
      if ('error_alerts_enabled' in updates) updateData.error_alerts_enabled = updates.error_alerts_enabled;
      if ('alert_severity_threshold' in updates) updateData.alert_severity_threshold = updates.alert_severity_threshold;
      if ('push_enabled' in updates) updateData.push_enabled = updates.push_enabled;

      const { error } = await supabase
        .from('notification_preferences')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating preferences:', error);
        return;
      }

      setPreferences((prev) => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: 'Ayarlar güncellendi',
        description: 'Bildirim tercihleri başarıyla kaydedildi.',
      });
    } catch (error) {
      console.error('Error in updatePreferences:', error);
    }
  }, [toast]);

  // Request push notification permission
  const requestPushPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: 'Desteklenmiyor',
        description: 'Tarayıcınız push bildirimleri desteklemiyor.',
        variant: 'destructive',
      });
      return false;
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      await updatePreferences({ push_enabled: true });
      toast({
        title: 'Bildirimler aktif',
        description: 'Push bildirimleri başarıyla etkinleştirildi.',
      });
      return true;
    } else {
      toast({
        title: 'İzin reddedildi',
        description: 'Tarayıcı ayarlarından bildirimleri açabilirsiniz.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast, updatePreferences]);

  return {
    preferences,
    isLoading,
    updatePreferences,
    requestPushPermission,
  };
};
