import { useState, useCallback } from 'react';
import { useEnhancedOfflineSync } from './use-enhanced-offline-sync';

interface OptimisticItem {
  id: string;
  type: 'post' | 'message' | 'comment' | 'like';
  data: any;
  status: 'pending' | 'syncing' | 'success' | 'failed';
  createdAt: number;
}

export const useOptimisticUI = () => {
  const [optimisticItems, setOptimisticItems] = useState<OptimisticItem[]>([]);
  const { addToQueue, pendingCount, failedCount, isSyncing } = useEnhancedOfflineSync();

  const addOptimisticItem = useCallback((type: OptimisticItem['type'], data: any) => {
    const optimisticId = `optimistic_${Date.now()}_${Math.random()}`;
    
    const item: OptimisticItem = {
      id: optimisticId,
      type,
      data: { ...data, id: optimisticId },
      status: 'pending',
      createdAt: Date.now(),
    };

    setOptimisticItems(prev => [item, ...prev]);
    
    // Add to sync queue
    addToQueue({ type, data });
    
    return optimisticId;
  }, [addToQueue]);

  const updateItemStatus = useCallback((id: string, status: OptimisticItem['status']) => {
    setOptimisticItems(prev => 
      prev.map(item => item.id === id ? { ...item, status } : item)
    );
  }, []);

  const removeOptimisticItem = useCallback((id: string) => {
    setOptimisticItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearSuccessful = useCallback(() => {
    setOptimisticItems(prev => prev.filter(item => item.status !== 'success'));
  }, []);

  const getSyncStatus = useCallback(() => {
    return {
      pending: optimisticItems.filter(i => i.status === 'pending').length + pendingCount,
      syncing: optimisticItems.filter(i => i.status === 'syncing').length + (isSyncing ? 1 : 0),
      failed: optimisticItems.filter(i => i.status === 'failed').length + failedCount,
      total: optimisticItems.length + pendingCount + failedCount,
    };
  }, [optimisticItems, pendingCount, failedCount, isSyncing]);

  return {
    optimisticItems,
    addOptimisticItem,
    updateItemStatus,
    removeOptimisticItem,
    clearSuccessful,
    getSyncStatus,
  };
};
