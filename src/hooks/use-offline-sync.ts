import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './use-network-status';
import { useToast } from './use-toast';

interface QueuedAction {
  id: string;
  type: 'message' | 'post' | 'like' | 'comment' | 'swipe';
  data: any;
  timestamp: number;
}

const STORAGE_KEY = 'offline-sync-queue';

export const useOfflineSync = () => {
  const isOnline = useNetworkStatus();
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Load queue from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem(STORAGE_KEY);
    if (savedQueue) {
      try {
        setQueue(JSON.parse(savedQueue));
      } catch (error) {
        console.error('Failed to parse offline queue:', error);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  }, [queue]);

  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || isSyncing) return;

    setIsSyncing(true);
    const failedActions: QueuedAction[] = [];

    for (const action of queue) {
      try {
        // Here you would implement the actual sync logic
        // For now, we'll just simulate success
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('Synced action:', action);
      } catch (error) {
        console.error('Failed to sync action:', error);
        failedActions.push(action);
      }
    }

    setQueue(failedActions);
    setIsSyncing(false);

    if (failedActions.length === 0) {
      toast({
        title: "Senkronizasyon Tamamlandı",
        description: `${queue.length} işlem başarıyla gönderildi.`,
      });
    } else {
      toast({
        title: "Kısmi Senkronizasyon",
        description: `${queue.length - failedActions.length}/${queue.length} işlem gönderildi.`,
        variant: "destructive",
      });
    }
  }, [queue, isSyncing, toast]);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !isSyncing) {
      syncQueue();
    }
  }, [isOnline, queue.length, isSyncing, syncQueue]);

  const addToQueue = (action: Omit<QueuedAction, 'id' | 'timestamp'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };

    setQueue(prev => [...prev, queuedAction]);
    
    toast({
      title: "Çevrimdışı Mod",
      description: "İşlem kaydedildi ve çevrimiçi olduğunuzda gönderilecek.",
    });

    return queuedAction.id;
  };

  const clearQueue = () => {
    setQueue([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    queue,
    queueCount: queue.length,
    addToQueue,
    syncQueue,
    clearQueue,
    isSyncing,
  };
};
