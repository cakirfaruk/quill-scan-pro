import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './use-network-status';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface QueuedAction {
  id: string;
  type: 'message' | 'post' | 'like' | 'comment' | 'friend_request' | 'profile_update';
  data: any;
  timestamp: number;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed' | 'success';
  error?: string;
  userId?: string;
}

interface SyncStats {
  total: number;
  success: number;
  failed: number;
  pending: number;
}

const STORAGE_KEY = 'enhanced-offline-sync-queue';
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY = 2000;

export const useEnhancedOfflineSync = () => {
  const isOnline = useNetworkStatus();
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);

  // Load queue from localStorage on mount
  useEffect(() => {
    loadQueue();
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    saveQueue();
  }, [queue]);

  const loadQueue = () => {
    try {
      const savedQueue = localStorage.getItem(STORAGE_KEY);
      if (savedQueue) {
        const parsed = JSON.parse(savedQueue);
        setQueue(parsed);
        
        // Check for old pending items
        const oldPending = parsed.filter((a: QueuedAction) => 
          a.status === 'pending' && Date.now() - a.timestamp > 86400000 // 24 hours
        );
        
        if (oldPending.length > 0) {
          toast.warning(`${oldPending.length} eski bekleyen işlem bulundu`, {
            description: 'Senkronize etmek ister misiniz?',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  };

  const saveQueue = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  };

  const syncAction = async (action: QueuedAction): Promise<boolean> => {
    try {
      switch (action.type) {
        case 'message':
          await supabase
            .from('messages')
            .insert(action.data);
          break;
          
        case 'post':
          await supabase
            .from('posts')
            .insert(action.data);
          break;
          
        case 'like':
          await supabase
            .from('post_likes')
            .insert(action.data);
          break;
          
        case 'comment':
          await supabase
            .from('post_comments')
            .insert(action.data);
          break;
          
        case 'friend_request':
          await supabase
            .from('friends')
            .insert(action.data);
          break;
          
        case 'profile_update':
          await supabase
            .from('profiles')
            .update(action.data)
            .eq('user_id', action.userId);
          break;
          
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to sync action:', error);
      throw error;
    }
  };

  const syncQueue = useCallback(async () => {
    if (queue.length === 0 || isSyncing || !isOnline) return;

    setIsSyncing(true);
    setSyncProgress(0);
    
    const pendingActions = queue.filter(a => a.status === 'pending' || a.status === 'failed');
    let synced = 0;
    
    const updatedQueue = [...queue];

    for (let i = 0; i < pendingActions.length; i++) {
      const action = pendingActions[i];
      const actionIndex = updatedQueue.findIndex(a => a.id === action.id);
      
      if (actionIndex === -1) continue;

      // Update status to syncing
      updatedQueue[actionIndex] = {
        ...action,
        status: 'syncing',
      };
      setQueue([...updatedQueue]);

      try {
        await syncAction(action);
        
        // Mark as success
        updatedQueue[actionIndex] = {
          ...action,
          status: 'success',
          retryCount: 0,
        };
        synced++;
        
        // Wait a bit before removing successful items
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        // Mark as failed
        const newRetryCount = action.retryCount + 1;
        
        updatedQueue[actionIndex] = {
          ...action,
          status: newRetryCount >= MAX_RETRY_COUNT ? 'failed' : 'pending',
          retryCount: newRetryCount,
          error: error.message || 'Bilinmeyen hata',
        };
        
        // Retry with delay if not exceeded max attempts
        if (newRetryCount < MAX_RETRY_COUNT) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
      
      setQueue([...updatedQueue]);
      setSyncProgress(((i + 1) / pendingActions.length) * 100);
    }

    // Remove successful items after a delay
    setTimeout(() => {
      setQueue(prev => prev.filter(a => a.status !== 'success'));
    }, 2000);

    setIsSyncing(false);
    setSyncProgress(0);
    setLastSyncTime(Date.now());

    // Show results
    const failed = updatedQueue.filter(a => a.status === 'failed').length;
    
    if (failed === 0 && synced > 0) {
      toast.success(`Senkronizasyon tamamlandı`, {
        description: `${synced} işlem başarıyla gönderildi`,
      });
    } else if (synced > 0) {
      toast.warning(`Kısmi senkronizasyon`, {
        description: `${synced} başarılı, ${failed} başarısız`,
      });
    } else if (failed > 0) {
      toast.error(`Senkronizasyon başarısız`, {
        description: `${failed} işlem gönderilemedi`,
      });
    }
  }, [queue, isSyncing, isOnline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && queue.filter(a => a.status === 'pending').length > 0 && !isSyncing) {
      syncQueue();
    }
  }, [isOnline, queue.length, isSyncing, syncQueue]);

  const addToQueue = useCallback((action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount' | 'status'>) => {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    };

    setQueue(prev => [...prev, queuedAction]);
    
    if (!isOnline) {
      toast.info('Çevrimdışı Mod', {
        description: 'İşlem kaydedildi ve çevrimiçi olduğunuzda gönderilecek',
      });
    }

    return queuedAction.id;
  }, [isOnline]);

  const retryFailed = useCallback(() => {
    setQueue(prev => prev.map(action => 
      action.status === 'failed' 
        ? { ...action, status: 'pending', retryCount: 0, error: undefined }
        : action
    ));
    
    if (isOnline) {
      syncQueue();
    }
  }, [isOnline, syncQueue]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    localStorage.removeItem(STORAGE_KEY);
    toast.success('Sıra temizlendi');
  }, []);

  const removeAction = useCallback((id: string) => {
    setQueue(prev => prev.filter(a => a.id !== id));
  }, []);

  const getStats = useCallback((): SyncStats => {
    return {
      total: queue.length,
      success: queue.filter(a => a.status === 'success').length,
      failed: queue.filter(a => a.status === 'failed').length,
      pending: queue.filter(a => a.status === 'pending').length,
    };
  }, [queue]);

  return {
    queue,
    queueCount: queue.length,
    pendingCount: queue.filter(a => a.status === 'pending').length,
    failedCount: queue.filter(a => a.status === 'failed').length,
    addToQueue,
    syncQueue,
    clearQueue,
    retryFailed,
    removeAction,
    isSyncing,
    syncProgress,
    lastSyncTime,
    stats: getStats(),
  };
};
